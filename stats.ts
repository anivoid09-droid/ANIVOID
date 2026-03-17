import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, groupsTable, adsTable, tournamentsTable, charactersTable, cardsTable } from "@workspace/db";
import { sql, count, sum, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  try {
    const [usersResult] = await db.select({ count: count() }).from(usersTable);
    const [groupsResult] = await db.select({ count: count() }).from(groupsTable);
    const [coinsResult] = await db.select({ total: sum(usersTable.coins) }).from(usersTable);
    const [activeAdsResult] = await db.select({ count: count() }).from(adsTable).where(eq(adsTable.status, "active"));
    const [activeTournamentsResult] = await db.select({ count: count() }).from(tournamentsTable).where(eq(tournamentsTable.status, "active"));
    const [charactersResult] = await db.select({ count: count() }).from(charactersTable);
    const [cardsResult] = await db.select({ count: count() }).from(cardsTable);
    const [premiumResult] = await db.select({ count: count() }).from(usersTable).where(sql`${usersTable.premiumUntil} > NOW()`);

    res.json({
      totalUsers: usersResult.count,
      totalGroups: groupsResult.count,
      totalCoins: Number(coinsResult.total) || 0,
      activeAds: activeAdsResult.count,
      activeTournaments: activeTournamentsResult.count,
      totalCharacters: charactersResult.count,
      totalCards: cardsResult.count,
      premiumUsers: premiumResult.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
