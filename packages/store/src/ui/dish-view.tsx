import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { naira } from "@cookbook/ui/lib/format";

import { requireUser, type SessionUser } from "../auth/session";
import { getDish, type Dish } from "../catalog";

/** What a dish page needs: the buyer, and the dish (or a 404). */
export async function loadDish(
  params: Promise<{ id: string }>,
): Promise<{ user: SessionUser; dish: Dish }> {
  const [user, { id }] = await Promise.all([requireUser(), params]);
  const dish = await getDish(id);
  if (!dish) notFound();
  return { user, dish };
}

/** A dish, with the app's own Buy button in `children`. */
export function DishView({ dish, children }: { dish: Dish; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Menu
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-16/10 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dish.imageUrl} alt={dish.title} className="size-full object-cover" />
        </div>

        <div className="p-6">
          <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
            {dish.category}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{dish.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{dish.description}</p>

          <p className="mt-6 text-3xl font-bold tracking-tight tabular-nums">
            {naira(dish.priceKobo)}
          </p>

          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
