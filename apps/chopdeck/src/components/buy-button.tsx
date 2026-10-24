"use client";

import { AcuteError, useAcutePayment } from "@acutenetwork/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@cookbook/ui/components/ui/button";
import { naira } from "@cookbook/ui/lib/format";

import { openWidgetOrderAction, recordWidgetPaymentAction } from "@/lib/pay";

/** The order could not be opened: a message for the buyer, not a bug. */
class OrderError extends Error {}

/**
 * Buy, in one tap: the order is opened and Acute's checkout appears over this
 * page. The buyer never leaves Chopdeck.
 *
 * `onSettled` only moves the screen on. The order is confirmed by the webhook,
 * which marks it paid even if this tab is closed the instant the money lands.
 */
export function BuyButton({
  dishId,
  priceKobo,
  buyer,
  label,
  disabled,
}: {
  dishId: string;
  priceKobo: number;
  /** Acute requires the payer's email on every payment; it is where the receipt goes. */
  buyer: { email: string; name: string };
  label?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const orderId = useRef<string | null>(null);

  const acute = useAcutePayment({
    onSettled: () => {
      toast.success("Paid. Your order is confirmed.");
      if (orderId.current) router.push(`/orders/${orderId.current}`);
    },
    onError: (error) => toast.error(error.message),
  });

  // The moment the payment exists, tie it to the order from the server.
  const reference = acute.payment?.reference;
  useEffect(() => {
    if (!reference || !orderId.current) return;
    void recordWidgetPaymentAction(orderId.current, reference).then((result) => {
      // Not shown to the buyer: the webhook still matches the payment by its
      // metadata, so this failing costs speed, never the order.
      if (result.error) console.error(`[chopdeck] could not record ${reference}: ${result.error}`);
    });
  }, [reference]);

  async function buy() {
    setOpening(true);
    try {
      // The checkout is on screen from the tap; the order opens behind it, so
      // the buyer is not left watching a spinner while our server works.
      await acute.pay(async () => {
        const opened = await openWidgetOrderAction(dishId);
        if ("error" in opened) throw new OrderError(opened.error);
        orderId.current = opened.orderId;
        return {
          amount: opened.amountKobo,
          description: opened.title,
          customer: buyer,
          metadata: { orderId: opened.orderId },
          // One order, one payment: a second tap reopens the same account.
          idempotencyKey: opened.orderId,
        };
      });
    } catch (error) {
      // Our own refusal (sold out, signed out) puts the checkout away and lands here.
      if (error instanceof OrderError) toast.error(error.message);
      // An Acute refusal already reached `onError`; anything else is ours to say.
      else if (!(error instanceof AcuteError)) toast.error("Could not open the payment. Try again.");
    } finally {
      setOpening(false);
    }
  }

  const busy = opening || acute.loading;

  return (
    <Button size="lg" className="w-full" disabled={disabled || busy} onClick={() => void buy()}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {disabled ? "Sold out" : (label ?? `Buy · ${naira(priceKobo)}`)}
    </Button>
  );
}
