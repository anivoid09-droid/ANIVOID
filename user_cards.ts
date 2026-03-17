import { pgTable, serial, bigint, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { cardsTable } from "./cards";

export const userCardsTable = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => usersTable.userId),
  cardId: integer("card_id").notNull().references(() => cardsTable.id),
  favorite: boolean("favorite").notNull().default(false),
});

export type UserCard = typeof userCardsTable.$inferSelect;
