import { Router, type IRouter, type Request } from "express";
import { db } from "@workspace/db";
import { charactersTable, marketTable } from "@workspace/db";
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

function mapCharacter(c: typeof charactersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    power: c.power,
    kills: c.kills,
    skills: c.skills,
    price: c.price,
    imagePath: c.imagePath ? `/api/uploads/${path.basename(c.imagePath)}` : null,
  };
}

router.get("/characters", async (_req, res) => {
  try {
    const characters = await db.select().from(charactersTable).orderBy(charactersTable.id);
    const [totalResult] = await db.select({ count: count() }).from(charactersTable);
    res.json({ characters: characters.map(mapCharacter), total: totalResult.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

router.get("/characters/:characterId", async (req, res) => {
  try {
    const id = Number(req.params.characterId);
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, id));
    if (!char) return res.status(404).json({ error: "Character not found" });
    res.json(mapCharacter(char));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

router.post("/characters", upload.single("image"), async (req: Request, res) => {
  try {
    const { name, rarity, power, kills, skills, price } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const [char] = await db
      .insert(charactersTable)
      .values({
        name,
        rarity: rarity || "Common",
        power: Number(power) || 100,
        kills: Number(kills) || 0,
        skills: skills || null,
        price: Number(price) || 500,
        imagePath,
      })
      .returning();

    if (char.price > 0) {
      await db.insert(marketTable).values({
        itemType: "character",
        itemId: char.id,
        price: char.price,
        sellerId: null,
      });
    }

    res.status(201).json(mapCharacter(char));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create character" });
  }
});

router.put("/characters/:characterId", upload.single("image"), async (req: Request, res) => {
  try {
    const id = Number(req.params.characterId);
    const { name, rarity, power, kills, skills, price } = req.body;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (rarity) updates.rarity = rarity;
    if (power !== undefined) updates.power = Number(power);
    if (kills !== undefined) updates.kills = Number(kills);
    if (skills !== undefined) updates.skills = skills;
    if (price !== undefined) updates.price = Number(price);
    if (req.file) updates.imagePath = req.file.path;

    await db.update(charactersTable).set(updates).where(eq(charactersTable.id, id));
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, id));
    if (!char) return res.status(404).json({ error: "Character not found" });

    res.json(mapCharacter(char));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update character" });
  }
});

router.delete("/characters/:characterId", async (req, res) => {
  try {
    const id = Number(req.params.characterId);
    await db.delete(marketTable).where(eq(marketTable.itemId, id));
    await db.delete(charactersTable).where(eq(charactersTable.id, id));
    res.json({ success: true, message: "Character deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete character" });
  }
});

export default router;
