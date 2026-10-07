"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@cookbook/ui/components/ui/button";
import { naira } from "@cookbook/ui/lib/format";

import { checkoutAction } from "@/lib/pay";

/** Buy, in one tap: the server opens the order and sends the buyer to Acute's checkout. */
export function CheckoutButton({
  dishId,
  priceKobo,
  label,
  disabled,
}: {
  dishId: string;
  priceKobo: number;
  label?: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function buy() {
    startTransition(async () => {
      // On success the action redirects, so a result only ever means it could not.
      const result = await checkoutAction(dishId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button size="lg" className="w-full" disabled={disabled || pending} onClick={buy}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {disabled ? "Sold out" : (label ?? `Buy · ${naira(priceKobo)}`)}
    </Button>
  );
}
