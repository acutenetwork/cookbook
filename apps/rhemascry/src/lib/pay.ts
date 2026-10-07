"use server";

import { AcuteError, createBankTransferPayment } from "@cookbook/acute";
import { getCurrentUser } from "@cookbook/store/auth/session";
import { applyPayment, openOrder } from "@cookbook/store/orders";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * The hosted-checkout recipe. Everything happens on our server, with the secret
 * key, and the buyer is sent to Acute to pay:
 *
 *   1. Write the order FIRST, so the payment always has somewhere to land.
 *   2. Create the payment, keyed on the order id, with `redirectUrl` pointing back
 *      at the order and `cancelUrl` back at the dish.
 *   3. Record the payment on the order, then redirect to its `checkoutUrl`.
 *
 * Acute's checkout shows the account, takes the transfer and sends the buyer back.
 * The webhook is what marks the order paid; the order page also asks Acute
 * directly, so a slow webhook never leaves the buyer looking at "waiting".
 */
export async function checkoutAction(dishId: string): Promise<{ error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const opened = await openOrder(user, dishId, "checkout");
  if ("error" in opened) return opened;
  const { order } = opened;

  // A reopened order already has its checkout page: send the buyer straight back.
  if (order.checkoutUrl) redirect(order.checkoutUrl);

  const origin = await siteOrigin();
  let checkoutUrl: string | null;
  try {
    const payment = await createBankTransferPayment({
      baseAmount: order.amountKobo,
      description: order.dishTitle,
      customer: { email: user.email, name: user.fullName },
      metadata: { orderId: order.id },
      redirectUrl: `${origin}/orders/${order.id}`,
      cancelUrl: `${origin}/food/${order.dishId}`,
      // One order, one payment: a double submit gets the same payment back.
      idempotencyKey: order.id,
    });
    await applyPayment(order, payment);
    checkoutUrl = payment.checkoutUrl;
  } catch (error) {
    if (error instanceof AcuteError) return { error: error.message };
    throw error;
  }

  if (!checkoutUrl) throw new Error(`Acute returned no checkout page for order ${order.id}.`);
  redirect(checkoutUrl);
}

/** This site's own origin, as the buyer reached it, for Acute to send them back to. */
async function siteOrigin(): Promise<string> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  if (!host) throw new Error("No Host header, so there is no address to return the buyer to.");
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
