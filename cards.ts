import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull().default("Common"),
  power: integer("power").notNull().default(100),
  skills: text("skills"),
  price: integer("price").notNull().default(300),
  imagePath: text("image_path"),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
