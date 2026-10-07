import { naira } from "@cookbook/ui/lib/format";
import Link from "next/link";

import type { Dish } from "../catalog";

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <Link
      href={`/food/${dish.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dish.imageUrl}
          alt={dish.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
          {dish.category}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold">{dish.title}</p>
        <p className="mt-2 text-base font-bold tabular-nums">{naira(dish.priceKobo)}</p>
      </div>
    </Link>
  );
}
