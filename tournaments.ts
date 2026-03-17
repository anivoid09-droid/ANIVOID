import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tournamentsTable, tournamentParticipantsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tournaments", async (_req, res) => {
  try {
    const tournaments = await db.select().from(tournamentsTable).orderBy(tournamentsTable.createdAt);
    const result = await Promise.all(
      tournaments.map(async (t) => {
        const [pCount] = await db
          .select({ count: count() })
          .from(tournamentParticipantsTable)
          .where(eq(tournamentParticipantsTable.tournamentId, t.id));
        return {
          id: t.id,
          name: t.name,
          status: t.status as "pending" | "active" | "ended",
          rewardType: t.rewardType as "coins" | "card" | "character" | "premium",
          rewardValue: t.rewardValue,
          participantCount: pCount.count,
          createdAt: t.createdAt.toISOString(),
        };
      })
    );
    const [totalResult] = await db.select({ count: count() }).from(tournamentsTable);
    res.json({ tournaments: result, total: totalResult.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

router.post("/tournaments", async (req, res) => {
  try {
    const { name, rewardType, rewardValue } = req.body;
    const [t] = await db
      .insert(tournamentsTable)
      .values({ name, rewardType, rewardValue, status: "pending" })
      .returning();
    res.status(201).json({
      id: t.id,
      name: t.name,
      status: t.status as "pending" | "active" | "ended",
      rewardType: t.rewardType as "coins" | "card" | "character" | "premium",
      rewardValue: t.rewardValue,
      participantCount: 0,
      createdAt: t.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

router.patch("/tournaments/:tournamentId", async (req, res) => {
  try {
    const id = Number(req.params.tournamentId);
    const { status } = req.body;
    await db.update(tournamentsTable).set({ status }).where(eq(tournamentsTable.id, id));
    const [t] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, id));
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    const [pCount] = await db
      .select({ count: count() })
      .from(tournamentParticipantsTable)
      .where(eq(tournamentParticipantsTable.tournamentId, id));
    res.json({
      id: t.id,
      name: t.name,
      status: t.status as "pending" | "active" | "ended",
      rewardType: t.rewardType as "coins" | "card" | "character" | "premium",
      rewardValue: t.rewardValue,
      participantCount: pCount.count,
      createdAt: t.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update tournament" });
  }
});

router.delete("/tournaments/:tournamentId", async (req, res) => {
  try {
    const id = Number(req.params.tournamentId);
    await db.delete(tournamentParticipantsTable).where(eq(tournamentParticipantsTable.tournamentId, id));
    await db.delete(tournamentsTable).where(eq(tournamentsTable.id, id));
    res.json({ success: true, message: "Tournament deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete tournament" });
  }
});

export default router;
