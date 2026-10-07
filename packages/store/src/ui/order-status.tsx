"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Watches a pending order until the money lands or the payment ends. */
export function OrderStatus({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "pending") return;

    let active = true;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
      if (!response.ok || !active) return;
      const data = (await response.json()) as { status: string };
      if (data.status !== "pending") {
        setStatus(data.status);
        clearInterval(timer);
        router.refresh();
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId, status, router]);

  if (status === "paid") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-success">Payment received</p>
          <p className="text-xs text-muted-foreground">Your order is confirmed. The kitchen is on it.</p>
        </div>
      </div>
    );
  }

  if (status === "refunded") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
        <CheckCircle2 className="size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold">Refunded</p>
          <p className="text-xs text-muted-foreground">Your money is on its way back to you.</p>
        </div>
      </div>
    );
  }

  if (status === "expired" || status === "failed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4">
        <XCircle className="size-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            {status === "expired" ? "This payment expired" : "Payment failed"}
          </p>
          <p className="text-xs text-muted-foreground">Nothing was charged. Order again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/10 p-4">
      <Clock className="size-5 shrink-0 animate-pulse text-warning" />
      <div>
        <p className="text-sm font-semibold text-warning">Waiting for your payment</p>
        <p className="text-xs text-muted-foreground">
          This page updates itself the moment the money lands.
        </p>
      </div>
    </div>
  );
}
