import { Router, type IRouter, type Request } from "express";
import { db } from "@workspace/db";
import { cardsTable, marketTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router: IRouter = Router();

function mapCard(c: typeof cardsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    power: c.power,
    skills: c.skills,
    price: c.price,
    imagePath: c.imagePath ? `/api/uploads/${path.basename(c.imagePath)}` : null,
  };
}

router.get("/cards", async (_req, res) => {
  try {
    const cards = await db.select().from(cardsTable).orderBy(cardsTable.id);
    const [totalResult] = await db.select({ count: count() }).from(cardsTable);
    res.json({ cards: cards.map(mapCard), total: totalResult.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

router.get("/cards/:cardId", async (req, res) => {
  try {
    const id = Number(req.params.cardId);
    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, id));
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(mapCard(card));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

router.post("/cards", upload.single("image"), async (req: Request, res) => {
  try {
    const { name, rarity, power, skills, price } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const [card] = await db
      .insert(cardsTable)
      .values({
        name,
        rarity: rarity || "Common",
        power: Number(power) || 100,
        skills: skills || null,
        price: Number(price) || 300,
        imagePath,
      })
      .returning();

    if (card.price > 0) {
      await db.insert(marketTable).values({
        itemType: "card",
        itemId: card.id,
        price: card.price,
        sellerId: null,
      });
    }

    res.status(201).json(mapCard(card));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create card" });
  }
});

router.put("/cards/:cardId", upload.single("image"), async (req: Request, res) => {
  try {
    const id = Number(req.params.cardId);
    const { name, rarity, power, skills, price } = req.body;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (rarity) updates.rarity = rarity;
    if (power !== undefined) updates.power = Number(power);
    if (skills !== undefined) updates.skills = skills;
    if (price !== undefined) updates.price = Number(price);
    if (req.file) updates.imagePath = req.file.path;

    await db.update(cardsTable).set(updates).where(eq(cardsTable.id, id));
    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, id));
    if (!card) return res.status(404).json({ error: "Card not found" });

    res.json(mapCard(card));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update card" });
  }
});

router.delete("/cards/:cardId", async (req, res) => {
  try {
    const id = Number(req.params.cardId);
    await db.delete(marketTable).where(eq(marketTable.itemId, id));
    await db.delete(cardsTable).where(eq(cardsTable.id, id));
    res.json({ success: true, message: "Card deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

export default router;
