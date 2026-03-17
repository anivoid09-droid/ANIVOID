import { pgTable, serial, integer, bigint } from "drizzle-orm/pg-core";
import { tournamentsTable } from "./tournaments";
import { usersTable } from "./users";

export const tournamentParticipantsTable = pgTable("tournament_participants", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => usersTable.userId),
  score: integer("score").notNull().default(0),
});

export type TournamentParticipant = typeof tournamentParticipantsTable.$inferSelect;
