import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userCharactersTable, userCardsTable } from "@workspace/db";
import { eq, ilike, or, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    let query = db.select().from(usersTable);
    let countQuery = db.select({ count: count() }).from(usersTable);

    if (search) {
      const condition = or(
        ilike(usersTable.username, `%${search}%`),
        ilike(usersTable.firstName, `%${search}%`)
      );
      query = query.where(condition) as typeof query;
      countQuery = countQuery.where(condition) as typeof countQuery;
    }

    const [users, [totalResult]] = await Promise.all([
      query.limit(limit).offset(offset).orderBy(usersTable.joinedAt),
      countQuery,
    ]);

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const [charCount] = await db
          .select({ count: count() })
          .from(userCharactersTable)
          .where(eq(userCharactersTable.userId, user.userId));
        const [cardCount] = await db
          .select({ count: count() })
          .from(userCardsTable)
          .where(eq(userCardsTable.userId, user.userId));
        return {
          userId: user.userId,
          username: user.username,
          firstName: user.firstName,
          coins: user.coins,
          bank: user.bank,
          xp: user.xp,
          level: user.level,
          premiumUntil: user.premiumUntil?.toISOString() ?? null,
          joinedAt: user.joinedAt.toISOString(),
          charactersCount: charCount.count,
          cardsCount: cardCount.count,
        };
      })
    );

    res.json({
      users: usersWithCounts,
      total: totalResult.count,
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const [charCount] = await db
      .select({ count: count() })
      .from(userCharactersTable)
      .where(eq(userCharactersTable.userId, userId));
    const [cardCount] = await db
      .select({ count: count() })
      .from(userCardsTable)
      .where(eq(userCardsTable.userId, userId));

    res.json({
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      coins: user.coins,
      bank: user.bank,
      xp: user.xp,
      level: user.level,
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
      joinedAt: user.joinedAt.toISOString(),
      charactersCount: charCount.count,
      cardsCount: cardCount.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.patch("/users/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { coins, bank, xp, level, premiumUntil } = req.body;

    const updates: Record<string, unknown> = {};
    if (coins !== undefined) updates.coins = coins;
    if (bank !== undefined) updates.bank = bank;
    if (xp !== undefined) updates.xp = xp;
    if (level !== undefined) updates.level = level;
    if (premiumUntil !== undefined) updates.premiumUntil = premiumUntil ? new Date(premiumUntil) : null;

    await db.update(usersTable).set(updates).where(eq(usersTable.userId, userId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const [charCount] = await db.select({ count: count() }).from(userCharactersTable).where(eq(userCharactersTable.userId, userId));
    const [cardCount] = await db.select({ count: count() }).from(userCardsTable).where(eq(userCardsTable.userId, userId));

    res.json({
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      coins: user.coins,
      bank: user.bank,
      xp: user.xp,
      level: user.level,
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
      joinedAt: user.joinedAt.toISOString(),
      charactersCount: charCount.count,
      cardsCount: cardCount.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
