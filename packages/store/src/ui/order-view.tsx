import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@cookbook/ui/components/ui/card";
import { naira, nairaExact, shortDate } from "@cookbook/ui/lib/format";

import { requireUser } from "../auth/session";
import { getOrder, type Order } from "../orders";
import { OrderStatus } from "./order-status";

const CHANNEL_LABEL: Record<Order["channel"], string> = {
  widget: "Bank transfer, on this page",
  checkout: "Bank transfer, on Acute checkout",
};

/** The buyer's own order, or a 404 (someone else's order is not theirs to see). */
export async function loadOrder(params: Promise<{ id: string }>): Promise<Order> {
  const [user, { id }] = await Promise.all([requireUser(), params]);
  const order = await getOrder(id);
  if (!order || order.buyerId !== user.id) notFound();
  return order;
}

/** An order. `children` is the app's way to finish paying, shown while it is pending. */
export function OrderView({ order, children }: { order: Order; children?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My orders
      </Link>

      <h1 className="text-xl font-bold tracking-tight">{order.dishTitle}</h1>
      {order.reference ? (
        <p className="mt-1 font-mono text-xs text-muted-foreground">{order.reference}</p>
      ) : null}

      <div className="mt-5">
        <OrderStatus orderId={order.id} initialStatus={order.status} />
      </div>

      {order.status === "pending" && children ? <div className="mt-4">{children}</div> : null}

      <Card className="mt-4 p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Dish</dt>
            <dd className="font-medium">{naira(order.amountKobo)}</dd>
          </div>
          {order.payableKobo !== null ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {order.status === "paid" ? "Total paid" : "Total"}
              </dt>
              <dd className="font-semibold">{nairaExact(order.payableKobo)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Method</dt>
            <dd className="text-right font-medium">{CHANNEL_LABEL[order.channel]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Placed</dt>
            <dd className="font-medium">{shortDate(order.createdAt)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
