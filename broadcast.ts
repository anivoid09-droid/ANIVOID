import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { groupsTable } from "@workspace/db";

const router: IRouter = Router();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8650797200:AAFLOqrhj_uY9sJRZebGxSXZt1MZ-nO50r4";

router.post("/broadcast", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const groups = await db.select().from(groupsTable);
    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      groups.map(async (group) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: group.chatId, text: message, parse_mode: "HTML" }),
          });
          const data = await response.json() as { ok: boolean };
          if (data.ok) sent++;
          else failed++;
        } catch {
          failed++;
        }
      })
    );

    res.json({ sent, failed, total: groups.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Broadcast failed" });
  }
});

export default router;
