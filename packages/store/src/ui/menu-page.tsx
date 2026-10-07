import { Card } from "@cookbook/ui/components/ui/card";

import { requireUser } from "../auth/session";
import { listAvailableDishes } from "../catalog";
import { DishCard } from "./dish-card";

export default async function MenuPage() {
  const [user, dishes] = await Promise.all([requireUser(), listAvailableDishes()]);
  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Hi {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">What are you eating today?</p>
      </header>

      {dishes.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">The kitchen is closed. Check back soon.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
