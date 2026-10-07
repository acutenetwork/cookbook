import { asc, eq } from "drizzle-orm";

import { db } from "./db";
import { dishes } from "./db/schema";

export type Dish = typeof dishes.$inferSelect;

/** Everything on the menu right now. */
export function listAvailableDishes(): Promise<Dish[]> {
  return db
    .select()
    .from(dishes)
    .where(eq(dishes.available, true))
    .orderBy(asc(dishes.createdAt))
    .all();
}

export function getDish(id: string): Promise<Dish | undefined> {
  return db.select().from(dishes).where(eq(dishes.id, id)).get();
}
