import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const charactersTable = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull().default("Common"),
  power: integer("power").notNull().default(100),
  kills: integer("kills").notNull().default(0),
  skills: text("skills"),
  price: integer("price").notNull().default(500),
  imagePath: text("image_path"),
});

export const insertCharacterSchema = createInsertSchema(charactersTable).omit({ id: true });
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
