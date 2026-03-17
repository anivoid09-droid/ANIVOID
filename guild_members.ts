import { pgTable, serial, integer, bigint } from "drizzle-orm/pg-core";
import { guildsTable } from "./guilds";
import { usersTable } from "./users";

export const guildMembersTable = pgTable("guild_members", {
  id: serial("id").primaryKey(),
  guildId: integer("guild_id").notNull().references(() => guildsTable.id),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => usersTable.userId),
});

export type GuildMember = typeof guildMembersTable.$inferSelect;
