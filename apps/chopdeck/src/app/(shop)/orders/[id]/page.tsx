import { requireUser } from "@cookbook/store/auth/session";
import { loadOrder, OrderView } from "@cookbook/store/ui/order-view";

import { BuyButton } from "@/components/buy-button";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, order] = await Promise.all([requireUser(), loadOrder(params)]);

  return (
    <OrderView order={order}>
      {/* Still pending: the same order reopens the same payment. */}
      <BuyButton
        dishId={order.dishId}
        priceKobo={order.amountKobo}
        buyer={{ email: user.email, name: user.fullName }}
        label="Finish paying"
      />
    </OrderView>
  );
}
