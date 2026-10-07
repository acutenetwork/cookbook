"use server";

import { randomUUID } from "node:crypto";

import { AcuteError, createWalletPayment, payFromWallet } from "@cookbook/acute";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/store/constants";
import { getFoodListing } from "@/lib/store/queries";

export interface CheckoutResult {
  error?: string;
  /** Set once the payment exists: where to send the buyer to see the order. */
  reference?: string;
  /** True when the money already moved, which a wallet payment does instantly. */
  paid?: boolean;
}

/**
 * The wallet recipe: buy a dish from your Acute wallet, in one tap.
 *
 *   1. Create a `virtual_wallet` payment whose target is the SELLER's wallet, with
 *      Raspbury's cut as a commission, so the money never passes through us.
 *   2. Settle it from the buyer's wallet. Instant: debit the buyer, credit the
 *      seller net of the cut, credit Raspbury the cut, in one Acute transaction.
 *
 * Two calls by design: the payment is the order's identity, then the wallet pays
 * it. If the settle fails, the order stays pending against a real payment, and the
 * webhook or the order page's poll picks up whatever Acute decides.
 */
export async function checkoutAction(listingId: string): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const listing = await getFoodListing(listingId);
  if (!listing) return { error: "That dish is no longer listed." };
  if (!listing.available) return { error: "That dish just sold out." };
  if (listing.sellerId === user.id) return { error: "That is your own dish." };

  const orderId = randomUUID();
  try {
    const payment = await createWalletPayment({
      baseAmount: listing.priceKobo,
      targetWalletId: listing.sellerWalletId,
      commission: { percentage: PLATFORM_COMMISSION_PERCENT },
      description: listing.title,
    });

    // The order is written before the wallet is touched, so money that moves
    // always has an order to land on.
    await db.insert(orders).values({
      id: orderId,
      reference: payment.id,
      buyerId: user.id,
      sellerId: listing.sellerId,
      listingId: listing.id,
      listingTitle: listing.title,
      sellerWalletId: listing.sellerWalletId,
      amountKobo: payment.baseAmount,
      payableKobo: payment.payableAmount,
      status: "pending",
      createdAt: new Date(),
    });

    let paid: boolean;
    try {
      paid = (await payFromWallet(user.acuteWalletId, payment.id)).status === "settled";
    } catch (error) {
      // Acute refused to move the money (not enough in the wallet, say), so this
      // order will never be paid: close it rather than leave it waiting forever.
      if (error instanceof AcuteError) {
        await db.update(orders).set({ status: "failed" }).where(eq(orders.id, orderId));
      }
      throw error;
    }

    if (paid) {
      // The webhook marks it paid too; whichever lands first wins, the other is a no-op.
      await db
        .update(orders)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    revalidatePath("/orders");
    revalidatePath("/wallet");
    return { reference: payment.id, paid };
  } catch (error) {
    if (error instanceof AcuteError) {
      if (error.code === "WALLET_INSUFFICIENT_FUNDS") {
        return { error: "Not enough in your wallet. Add money first." };
      }
      return { error: error.message };
    }
    throw error;
  }
}
