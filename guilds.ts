import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { guildsTable, guildMembersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/guilds", async (_req, res) => {
  try {
    const guilds = await db.select().from(guildsTable).orderBy(guildsTable.id);
    const result = await Promise.all(
      guilds.map(async (g) => {
        const [mCount] = await db
          .select({ count: count() })
          .from(guildMembersTable)
          .where(eq(guildMembersTable.guildId, g.id));
        return {
          id: g.id,
          name: g.name,
          ownerId: Number(g.ownerId),
          level: g.level,
          coins: g.coins,
          memberCount: mCount.count,
        };
      })
    );
    const [totalResult] = await db.select({ count: count() }).from(guildsTable);
    res.json({ guilds: result, total: totalResult.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

export default router;
