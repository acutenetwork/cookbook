import { randomUUID } from "node:crypto";

import { getPayment, type Payment, type PaymentStatus } from "@cookbook/acute";
import { and, desc, eq, gt, isNotNull, isNull, or } from "drizzle-orm";

import { getDish } from "./catalog";
import { db } from "./db";
import { orders, type OrderStatus } from "./db/schema";

import type { SessionUser } from "./auth/session";

export type Order = typeof orders.$inferSelect;
export type OrderChannel = Order["channel"];

/**
 * How long a pending order is handed back instead of a new one. Shorter than
 * Acute's 30-minute account lifetime, so a reused order never points the buyer at
 * an account that has already expired.
 */
const REUSE_WINDOW_MS = 25 * 60 * 1000;

/**
 * Open an order for a dish, or hand back the one the buyer already has open.
 *
 * Reuse is what makes a second tap on Buy safe: the order id is the payment's
 * idempotency key, so the same order means Acute returns the same payment and the
 * same account, never a second one the buyer might pay as well.
 */
export async function openOrder(
  user: SessionUser,
  dishId: string,
  channel: OrderChannel,
): Promise<{ order: Order } | { error: string }> {
  const dish = await getDish(dishId);
  if (!dish) return { error: "That dish is no longer on the menu." };
  if (!dish.available) return { error: "That dish just sold out." };

  const open = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.buyerId, user.id),
        eq(orders.dishId, dish.id),
        eq(orders.channel, channel),
        eq(orders.status, "pending"),
        // A price change makes it a different order: the payment's amount would no
        // longer match, and Acute refuses a reused key with a different body.
        eq(orders.amountKobo, dish.priceKobo),
        gt(orders.createdAt, new Date(Date.now() - REUSE_WINDOW_MS)),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .get();
  if (open) return { order: open };

  const order: Order = {
    id: randomUUID(),
    buyerId: user.id,
    dishId: dish.id,
    dishTitle: dish.title,
    channel,
    amountKobo: dish.priceKobo,
    payableKobo: null,
    reference: null,
    checkoutUrl: null,
    status: "pending",
    createdAt: new Date(),
    paidAt: null,
  };
  await db.insert(orders).values(order);
  return { order };
}

export function getOrder(id: string): Promise<Order | undefined> {
  return db.select().from(orders).where(eq(orders.id, id)).get();
}

/**
 * The buyer's orders. One with no payment yet is left out: it is a Buy tap that
 * never reached Acute, so there is nothing to show and nothing owed.
 */
export function listOrders(buyerId: string): Promise<Order[]> {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.buyerId, buyerId), isNotNull(orders.reference)))
    .orderBy(desc(orders.createdAt))
    .all();
}

function orderStatusFor(status: PaymentStatus): OrderStatus {
  switch (status) {
    case "settled":
      return "paid";
    case "expired":
      return "expired";
    case "failed":
      return "failed";
    case "refunded":
    case "partially_refunded":
      return "refunded";
    default:
      return "pending";
  }
}

/**
 * Statuses only move forward. Webhooks and polls arrive in any order, so a late
 * "pending" must never undo a "paid", and money arriving after an expiry still
 * wins.
 */
const RANK: Record<OrderStatus, number> = { pending: 0, expired: 1, failed: 1, paid: 2, refunded: 3 };

/**
 * Does this payment belong to this order? The order id rides on the payment as
 * metadata, but metadata on a browser-made payment is whatever the browser sent,
 * so the amount has to agree too. A payment that names an order but is for a
 * different sum is never allowed to mark it paid.
 */
function belongsTo(order: Order, payment: Payment): boolean {
  return payment.metadata?.orderId === order.id && payment.baseAmount === order.amountKobo;
}

/**
 * Record what Acute says about an order's payment. Safe to call any number of
 * times, from the webhook, the status poll and the page that created it.
 */
export async function applyPayment(order: Order, payment: Payment): Promise<OrderStatus> {
  if (!belongsTo(order, payment)) {
    throw new Error(`Payment ${payment.id} does not belong to order ${order.id}.`);
  }

  const next = orderStatusFor(payment.status);
  const status = RANK[next] > RANK[order.status] ? next : order.status;

  await db
    .update(orders)
    .set({
      reference: payment.id,
      payableKobo: payment.payableAmount,
      checkoutUrl: payment.checkoutUrl,
      status,
      paidAt: status === "paid" ? (order.paidAt ?? new Date()) : order.paidAt,
    })
    .where(eq(orders.id, order.id));

  return status;
}

/**
 * The order a payment settles. By reference when we already recorded it; by its
 * `orderId` metadata when the payment reached Acute but the browser closed before
 * telling us its reference.
 */
export async function findOrderForPayment(payment: Payment): Promise<Order | undefined> {
  const orderId = payment.metadata?.orderId;
  const order = await db
    .select()
    .from(orders)
    .where(
      or(
        eq(orders.reference, payment.id),
        orderId ? and(eq(orders.id, orderId), isNull(orders.reference)) : undefined,
      ),
    )
    .get();
  return order && belongsTo(order, payment) ? order : undefined;
}

/**
 * Ask Acute directly. The webhook is the fast road; this is the one that does not
 * depend on it, so a slow or lost webhook never strands a buyer on "waiting".
 */
export async function syncOrder(order: Order): Promise<OrderStatus> {
  if (order.status !== "pending" || !order.reference) return order.status;
  return applyPayment(order, await getPayment(order.reference));
}
