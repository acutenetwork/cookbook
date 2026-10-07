import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * A shop's own data: who its customers are, what is on the menu, and the orders.
 * The money lives at Acute. An order joins to its payment by Acute's reference,
 * and the shop never stores a balance.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

/** The menu. The shop is the only seller; the seed script keeps it stocked. */
export const dishes = sqliteTable("dishes", {
  /** A readable slug, so the seed script can upsert without duplicating. */
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceKobo: integer("price_kobo").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const orderStatuses = ["pending", "paid", "expired", "failed", "refunded"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orders = sqliteTable(
  "orders",
  {
    /** Ours. It is also the payment's idempotency key and its `orderId` metadata. */
    id: text("id").primaryKey(),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id),
    dishId: text("dish_id")
      .notNull()
      .references(() => dishes.id),
    dishTitle: text("dish_title").notNull(),
    /** Which integration took the money: the embedded widget, or the hosted checkout. */
    channel: text("channel", { enum: ["widget", "checkout"] }).notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    /** What the buyer pays (base plus Acute's fee). Known once the payment exists. */
    payableKobo: integer("payable_kobo"),
    /**
     * Acute's payment reference. Null between writing the order and creating its
     * payment: the order is written FIRST, so a payment always has an order to
     * land on, even if the browser closes in between.
     */
    reference: text("reference").unique(),
    /** The hosted checkout page, for a checkout order the buyer has not paid yet. */
    checkoutUrl: text("checkout_url"),
    status: text("status", { enum: orderStatuses }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
  },
  (table) => [index("orders_buyer_idx").on(table.buyerId, table.createdAt)],
);

/** Every verified webhook, keyed on Acute's event id so a redelivery is a no-op. */
export const webhookEvents = sqliteTable("webhook_events", {
  eventId: text("event_id").primaryKey(),
  type: text("type").notNull(),
  resourceId: text("resource_id"),
  payload: text("payload").notNull(),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
});
