import { Button } from "@cookbook/ui/components/ui/button";
import { loadOrder, OrderView } from "@cookbook/store/ui/order-view";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await loadOrder(params);

  return (
    <OrderView order={order}>
      {/* Still pending: the checkout page is the buyer's own link back to paying. */}
      {order.checkoutUrl ? (
        <Button asChild size="lg" className="w-full">
          <a href={order.checkoutUrl}>Finish paying</a>
        </Button>
      ) : null}
    </OrderView>
  );
}
