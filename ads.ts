import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

function mapAd(a: typeof adsTable.$inferSelect) {
  return {
    id: a.id,
    adText: a.adText,
    status: a.status as "active" | "inactive",
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/ads", async (_req, res) => {
  try {
    const ads = await db.select().from(adsTable).orderBy(adsTable.createdAt);
    const [totalResult] = await db.select({ count: count() }).from(adsTable);
    res.json({ ads: ads.map(mapAd), total: totalResult.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

router.post("/ads", async (req, res) => {
  try {
    const { adText, status } = req.body;
    const [ad] = await db
      .insert(adsTable)
      .values({ adText, status: status || "active" })
      .returning();
    res.status(201).json(mapAd(ad));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ad" });
  }
});

router.put("/ads/:adId", async (req, res) => {
  try {
    const id = Number(req.params.adId);
    const { adText, status } = req.body;
    const updates: Record<string, unknown> = {};
    if (adText !== undefined) updates.adText = adText;
    if (status !== undefined) updates.status = status;
    await db.update(adsTable).set(updates).where(eq(adsTable.id, id));
    const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, id));
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    res.json(mapAd(ad));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update ad" });
  }
});

router.patch("/ads/:adId/toggle", async (req, res) => {
  try {
    const id = Number(req.params.adId);
    const [current] = await db.select().from(adsTable).where(eq(adsTable.id, id));
    if (!current) return res.status(404).json({ error: "Ad not found" });
    const newStatus = current.status === "active" ? "inactive" : "active";
    await db.update(adsTable).set({ status: newStatus }).where(eq(adsTable.id, id));
    const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, id));
    res.json(mapAd(ad!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle ad" });
  }
});

router.delete("/ads/:adId", async (req, res) => {
  try {
    const id = Number(req.params.adId);
    await db.delete(adsTable).where(eq(adsTable.id, id));
    res.json({ success: true, message: "Ad deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete ad" });
  }
});

export default router;
