import { DishView, loadDish } from "@cookbook/store/ui/dish-view";

import { BuyButton } from "@/components/buy-button";

export default async function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, dish } = await loadDish(params);

  return (
    <DishView dish={dish}>
      <BuyButton
        dishId={dish.id}
        priceKobo={dish.priceKobo}
        buyer={{ email: user.email, name: user.fullName }}
        disabled={!dish.available}
      />
    </DishView>
  );
}
