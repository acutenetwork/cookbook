import { DishView, loadDish } from "@cookbook/store/ui/dish-view";

import { CheckoutButton } from "@/components/checkout-button";

export default async function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { dish } = await loadDish(params);

  return (
    <DishView dish={dish}>
      <CheckoutButton dishId={dish.id} priceKobo={dish.priceKobo} disabled={!dish.available} />
    </DishView>
  );
}
