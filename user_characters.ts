import { pgTable, serial, bigint, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { charactersTable } from "./characters";

export const userCharactersTable = pgTable("user_characters", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => usersTable.userId),
  characterId: integer("character_id").notNull().references(() => charactersTable.id),
  status: text("status").notNull().default("alive"),
  reviveTime: timestamp("revive_time"),
});

export type UserCharacter = typeof userCharactersTable.$inferSelect;
