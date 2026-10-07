"use server";

import { getPayment } from "@cookbook/acute";
import { getCurrentUser } from "@cookbook/store/auth/session";
import { applyPayment, getOrder, openOrder } from "@cookbook/store/orders";
import { revalidatePath } from "next/cache";

/**
 * The widget recipe, server half. Two calls, around the one the browser makes:
 *
 *   1. `openWidgetOrderAction` writes the order FIRST and hands the browser its id.
 *   2. The browser creates the payment with the publishable key, carrying that id
 *      as the idempotency key and as `orderId` metadata, and opens the checkout.
 *   3. `recordWidgetPaymentAction` looks the payment up with our SECRET key and
 *      ties it to the order.
 *
 * Step 3 is a speed-up, not the guarantee. If the tab closes before it runs, the
 * webhook still finds the order by its `orderId` metadata, and only accepts it if
 * the amount matches.
 */

export type OpenWidgetOrderResult =
  | { error: string }
  | { orderId: string; amountKobo: number; title: string };

export async function openWidgetOrderAction(dishId: string): Promise<OpenWidgetOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const result = await openOrder(user, dishId, "widget");
  if ("error" in result) return result;

  const { order } = result;
  return { orderId: order.id, amountKobo: order.amountKobo, title: order.dishTitle };
}

export async function recordWidgetPaymentAction(
  orderId: string,
  reference: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const order = await getOrder(orderId);
  if (!order || order.buyerId !== user.id) return { error: "That order is not yours." };

  // The browser's word is not enough to tie a payment to an order: ask Acute.
  // `applyPayment` refuses a payment whose order id or amount does not match.
  await applyPayment(order, await getPayment(reference));
  revalidatePath("/orders");
  return {};
}
