import { pgTable, serial, text, integer, bigint } from "drizzle-orm/pg-core";

export const marketTable = pgTable("market", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  price: integer("price").notNull(),
  sellerId: bigint("seller_id", { mode: "number" }),
});

export type Market = typeof marketTable.$inferSelect;
