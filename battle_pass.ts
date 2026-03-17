import { pgTable, serial, bigint, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const battlePassTable = pgTable("battle_pass", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => usersTable.userId),
  active: boolean("active").notNull().default(true),
  tier: integer("tier").notNull().default(0),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type BattlePass = typeof battlePassTable.$inferSelect;
