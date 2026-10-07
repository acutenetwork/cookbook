import Link from "next/link";

import { StatusPill } from "@cookbook/ui/components/status-pill";
import { Card } from "@cookbook/ui/components/ui/card";
import { naira, timeAgo } from "@cookbook/ui/lib/format";

import { requireUser } from "../auth/session";
import { listOrders } from "../orders";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listOrders(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Orders</h1>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing yet.{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Find something to eat
            </Link>
            .
          </p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`}>
                <Card className="flex flex-row items-center gap-3 p-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{order.dishTitle}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</p>
                  </div>
                  <StatusPill status={order.status} />
                  <span className="text-sm font-semibold tabular-nums">
                    {naira(order.payableKobo ?? order.amountKobo)}
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
