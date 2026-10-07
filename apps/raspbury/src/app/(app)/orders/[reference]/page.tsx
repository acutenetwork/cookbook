import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OrderStatus } from "@/components/store/order-status";
import { Card } from "@cookbook/ui/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { naira, nairaExact, shortDate } from "@cookbook/ui/lib/format";
import { getOrderByReference } from "@/lib/store/queries";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) notFound();

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My orders
      </Link>

      <h1 className="text-xl font-bold tracking-tight">{order.listingTitle}</h1>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{order.reference}</p>

      <div className="mt-5">
        <OrderStatus reference={order.reference} initialStatus={order.status} />
      </div>


      <Card className="mt-4 p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Dish</dt>
            <dd className="font-medium">{naira(order.amountKobo)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total paid</dt>
            <dd className="font-semibold">{nairaExact(order.payableKobo)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Method</dt>
            <dd className="font-medium">
              Wallet balance
            </dd>
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
