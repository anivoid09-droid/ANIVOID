import { pgTable, bigint, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  userId: bigint("user_id", { mode: "number" }).primaryKey(),
  username: text("username"),
  firstName: text("first_name"),
  coins: integer("coins").notNull().default(500),
  bank: integer("bank").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  premiumUntil: timestamp("premium_until"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ joinedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
