import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { groupsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/groups", async (_req, res) => {
  try {
    const groups = await db.select().from(groupsTable).orderBy(groupsTable.addedAt);
    const [totalResult] = await db.select({ count: count() }).from(groupsTable);

    res.json({
      groups: groups.map(g => ({
        id: g.id,
        chatId: g.chatId,
        groupName: g.groupName,
        addedAt: g.addedAt.toISOString(),
      })),
      total: totalResult.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.delete("/groups/:groupId", async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    await db.delete(groupsTable).where(eq(groupsTable.id, groupId));
    res.json({ success: true, message: "Group deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

export default router;
