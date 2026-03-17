import { pgTable, serial, text, integer, bigint } from "drizzle-orm/pg-core";

export const guildsTable = pgTable("guilds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  ownerId: bigint("owner_id", { mode: "number" }).notNull(),
  level: integer("level").notNull().default(1),
  coins: integer("coins").notNull().default(0),
});

export type Guild = typeof guildsTable.$inferSelect;
