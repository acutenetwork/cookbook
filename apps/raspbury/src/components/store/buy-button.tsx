"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@cookbook/ui/components/ui/button";
import { naira } from "@cookbook/ui/lib/format";

import { checkoutAction } from "@/lib/store/checkout";

/**
 * Buy, in one tap, from the wallet. When the wallet cannot pay yet, the button
 * says why and the line under it goes to the fix.
 */
export function BuyButton({
  listingId,
  priceKobo,
  balanceKobo,
  needsVerification,
  disabled,
}: {
  listingId: string;
  priceKobo: number;
  /** Null until the wallet is verified, or when the balance could not be read. */
  balanceKobo: number | null;
  needsVerification: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const canPay = balanceKobo !== null && balanceKobo >= priceKobo;
  const blocker = needsVerification
    ? "Verify your wallet to pay with it."
    : balanceKobo === null
      ? "Your wallet balance is unavailable right now."
      : !canPay
        ? `Your balance is ${naira(balanceKobo)}. Add money to buy this.`
        : null;

  function buy() {
    startTransition(async () => {
      const result = await checkoutAction(listingId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.paid) toast.success("Paid. Your order is confirmed.");
      router.push(`/orders/${result.reference}`);
    });
  }

  return (
    <div className="space-y-2">
      <Button size="lg" className="w-full" disabled={disabled || !canPay || pending} onClick={buy}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {disabled ? "Sold out" : `Pay ${naira(priceKobo)} from wallet`}
      </Button>
      {!disabled && blocker ? (
        <p className="text-center text-xs text-muted-foreground">
          {blocker}{" "}
          <Link href="/wallet" className="font-medium text-primary hover:underline">
            Go to wallet
          </Link>
        </p>
      ) : null}
    </div>
  );
}
