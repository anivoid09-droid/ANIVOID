import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { marketTable, charactersTable, cardsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import path from "path";

const router: IRouter = Router();

router.get("/market", async (_req, res) => {
  try {
    const items = await db.select().from(marketTable).orderBy(marketTable.id);
    const result = await Promise.all(
      items.map(async (item) => {
        let name = null, rarity = null, power = null, imagePath = null;
        if (item.itemType === "character") {
          const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, item.itemId));
          if (char) { name = char.name; rarity = char.rarity; power = char.power; imagePath = char.imagePath; }
        } else if (item.itemType === "card") {
          const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, item.itemId));
          if (card) { name = card.name; rarity = card.rarity; power = card.power; imagePath = card.imagePath; }
        }
        return {
          id: item.id,
          itemType: item.itemType as "character" | "card",
          itemId: item.itemId,
          price: item.price,
          sellerId: item.sellerId,
          itemName: name,
          itemRarity: rarity,
          itemPower: power,
          imagePath: imagePath ? `/api/uploads/${path.basename(imagePath)}` : null,
        };
      })
    );
    const [totalResult] = await db.select({ count: count() }).from(marketTable);
    res.json({ items: result, total: totalResult.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch market" });
  }
});

router.post("/market", async (req, res) => {
  try {
    const { itemType, itemId, price } = req.body;
    const [item] = await db
      .insert(marketTable)
      .values({ itemType, itemId, price, sellerId: null })
      .returning();

    let name = null, rarity = null, power = null, imagePath = null;
    if (itemType === "character") {
      const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, itemId));
      if (char) { name = char.name; rarity = char.rarity; power = char.power; imagePath = char.imagePath; }
    } else if (itemType === "card") {
      const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, itemId));
      if (card) { name = card.name; rarity = card.rarity; power = card.power; imagePath = card.imagePath; }
    }
    res.status(201).json({
      id: item.id,
      itemType: item.itemType as "character" | "card",
      itemId: item.itemId,
      price: item.price,
      sellerId: item.sellerId,
      itemName: name,
      itemRarity: rarity,
      itemPower: power,
      imagePath: imagePath ? `/api/uploads/${path.basename(imagePath)}` : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add market item" });
  }
});

router.delete("/market/:marketId", async (req, res) => {
  try {
    const id = Number(req.params.marketId);
    await db.delete(marketTable).where(eq(marketTable.id, id));
    res.json({ success: true, message: "Market item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove market item" });
  }
});

export default router;
