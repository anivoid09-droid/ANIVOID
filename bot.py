#!/usr/bin/env python3
"""
Anime RPG Telegram Bot
Full-featured RPG bot with characters, cards, raids, adventures, guilds, market, tournaments,
mini-games, premium, battle pass, and more.
"""
import os
import random
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional

import psycopg2
import psycopg2.extras
from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup, InputFile
)
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, filters, ContextTypes, ChatMemberHandler
)
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN", "8650797200:AAFLOqrhj_uY9sJRZebGxSXZt1MZ-nO50r4")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "7036768966"))
DATABASE_URL = os.environ.get("DATABASE_URL", "")

RANKS = [
    (1, "Beginner"),
    (5, "Bronze Hunter"),
    (10, "Silver Hunter"),
    (20, "Gold Hunter"),
    (35, "Elite Slayer"),
    (50, "Legendary Hero"),
    (75, "Anime God"),
]

XP_PER_LEVEL = 200
BOSS_HP = {}
BOSS_MAX_HP = 50000

def get_rank(level: int) -> str:
    rank = "Beginner"
    for lvl, r in RANKS:
        if level >= lvl:
            rank = r
    return rank

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

def ensure_user(user):
    """Auto-register user if not exists."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO users (user_id, username, first_name, coins, bank, xp, level, joined_at)
                VALUES (%s, %s, %s, 500, 0, 0, 1, NOW())
                ON CONFLICT (user_id) DO UPDATE
                  SET username = EXCLUDED.username,
                      first_name = EXCLUDED.first_name
            """, (user.id, user.username, user.first_name))
            conn.commit()

def get_user(user_id: int) -> Optional[dict]:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None

def add_xp(user_id: int, xp_amount: int) -> dict:
    """Add XP and handle level ups. Returns dict with leveled_up, new_level."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT xp, level FROM users WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return {"leveled_up": False, "new_level": 1}
            old_level = row["level"]
            new_xp = row["xp"] + xp_amount
            new_level = max(1, new_xp // XP_PER_LEVEL)
            cur.execute(
                "UPDATE users SET xp = %s, level = %s WHERE user_id = %s",
                (new_xp, new_level, user_id)
            )
            conn.commit()
            return {"leveled_up": new_level > old_level, "new_level": new_level}

def is_premium(user_id: int) -> bool:
    user = get_user(user_id)
    if not user or not user.get("premium_until"):
        return False
    return user["premium_until"] > datetime.now()

def send_photo_or_text(context, chat_id, image_path, caption, reply_markup=None):
    """Helper to send photo or fallback to text."""
    pass

# ─── BOT COMMANDS ──────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    text = (
        f"⚔️ <b>Welcome to ANIVOID RPG, {user.first_name}!</b>\n\n"
        "You've entered the world of Anime Heroes!\n\n"
        "🎮 <b>Quick Start:</b>\n"
        "/profile — View your profile\n"
        "/characters — Your characters\n"
        "/cards — Your cards\n"
        "/market — Browse market\n"
        "/adventure — Go on adventure\n"
        "/raid — Fight raid boss\n"
        "/help — Full command list"
    )
    keyboard = [
        [InlineKeyboardButton("📖 Help", callback_data="help"),
         InlineKeyboardButton("👤 Profile", callback_data="profile")],
        [InlineKeyboardButton("⚔️ Adventure", callback_data="adventure"),
         InlineKeyboardButton("🔥 Market", callback_data="market_0")],
    ]
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup(keyboard))

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user:
        ensure_user(update.effective_user)
    text = (
        "📖 <b>ANIVOID RPG Commands</b>\n\n"
        "👤 <b>Profile:</b>\n"
        "/profile — View your stats\n"
        "/characters — Your characters\n"
        "/cards — Your cards\n"
        "/characterinfo [id] — Character details\n"
        "/cardinfo [id] — Card details\n\n"
        "⚔️ <b>Battle:</b>\n"
        "/adventure — Start adventure\n"
        "/explore — Explore area\n"
        "/raid — Fight raid boss\n"
        "/damage [power] — Attack raid boss\n\n"
        "🏪 <b>Market:</b>\n"
        "/market — Browse marketplace\n"
        "/buy [id] — Buy item\n"
        "/sell [type] [id] [price] — Sell item\n"
        "/trade — Trade with players\n\n"
        "🏆 <b>Tournaments:</b>\n"
        "/tournament — View tournaments\n"
        "/jointournament [id] — Join tournament\n"
        "/tournamentleaderboard [id] — Leaderboard\n\n"
        "🏰 <b>Guilds:</b>\n"
        "/guildcreate [name] — Create guild\n"
        "/guildjoin [name] — Join guild\n"
        "/guildleave — Leave guild\n"
        "/guildinfo — Guild information\n"
        "/guildleaderboard — Guild rankings\n\n"
        "🎮 <b>Mini Games:</b>\n"
        "/dice [bet] — Roll dice\n"
        "/bet [amount] — Place bet\n"
        "/rob @user — Rob a player\n"
        "/slots [bet] — Play slots\n"
        "/flip [bet] — Flip coin\n\n"
        "💎 <b>Premium:</b>\n"
        "/buypremium — Buy premium\n"
        "/mypremium — Premium status\n"
        "/battlepass — Battle pass info\n"
        "/bpreward — Claim BP reward\n"
        "/buypass — Buy battle pass\n\n"
        "🏦 <b>Economy:</b>\n"
        "/balance — Check wallet\n"
        "/deposit [amount] — Deposit to bank\n"
        "/withdraw [amount] — Withdraw from bank\n"
        "/daily — Daily reward"
    )
    await update.message.reply_text(text, parse_mode="HTML")

async def cmd_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    data = get_user(user.id)
    if not data:
        await update.message.reply_text("❌ Profile not found.")
        return

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as c FROM user_characters WHERE user_id = %s", (user.id,))
            char_count = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) as c FROM user_cards WHERE user_id = %s", (user.id,))
            card_count = cur.fetchone()["c"]

    rank = get_rank(data["level"])
    premium_status = "✨ Premium" if is_premium(user.id) else "❌ No"
    xp_to_next = XP_PER_LEVEL - (data["xp"] % XP_PER_LEVEL)

    text = (
        f"👤 <b>Player Profile</b>\n\n"
        f"User: @{data.get('username') or user.first_name}\n"
        f"🏆 Rank: {rank}\n"
        f"📊 Level: {data['level']}\n"
        f"⭐ XP: {data['xp']} ({xp_to_next} to next level)\n\n"
        f"💰 Wallet: {data['coins']:,} coins\n"
        f"🏦 Bank: {data['bank']:,} coins\n\n"
        f"⚔️ Characters: {char_count}\n"
        f"🃏 Cards: {card_count}\n"
        f"💎 Premium: {premium_status}"
    )
    await update.message.reply_text(text, parse_mode="HTML")

async def cmd_balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    data = get_user(user.id)
    await update.message.reply_text(
        f"💰 <b>Balance</b>\n\nWallet: {data['coins']:,} coins\n🏦 Bank: {data['bank']:,} coins",
        parse_mode="HTML"
    )

async def cmd_deposit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Usage: /deposit [amount]")
        return
    amount = int(args[0])
    data = get_user(user.id)
    if data["coins"] < amount:
        await update.message.reply_text("❌ Insufficient wallet coins.")
        return
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET coins = coins - %s, bank = bank + %s WHERE user_id = %s",
                        (amount, amount, user.id))
            conn.commit()
    await update.message.reply_text(f"✅ Deposited {amount:,} coins to bank.")

async def cmd_withdraw(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Usage: /withdraw [amount]")
        return
    amount = int(args[0])
    data = get_user(user.id)
    if data["bank"] < amount:
        await update.message.reply_text("❌ Insufficient bank coins.")
        return
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET bank = bank - %s, coins = coins + %s WHERE user_id = %s",
                        (amount, amount, user.id))
            conn.commit()
    await update.message.reply_text(f"✅ Withdrew {amount:,} coins from bank.")

async def cmd_daily(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    reward = 500 if not is_premium(user.id) else 1000
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (reward, user.id))
            conn.commit()
    await update.message.reply_text(
        f"🎁 <b>Daily Reward!</b>\n\n+{reward} coins added to your wallet!\n"
        f"{'💎 Premium bonus applied!' if is_premium(user.id) else ''}",
        parse_mode="HTML"
    )

# ─── CHARACTERS ──────────────────────────────────────────────────────────────

async def cmd_characters(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    await show_user_characters(update, context, user.id, 0)

async def show_user_characters(update_or_query, context, user_id, index):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.*, uc.status, uc.revive_time, uc.id as uc_id
                FROM user_characters uc
                JOIN characters c ON c.id = uc.character_id
                WHERE uc.user_id = %s
                ORDER BY c.id
            """, (user_id,))
            chars = cur.fetchall()

    if not chars:
        text = "⚔️ You don't own any characters yet.\nBuy from /market!"
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(text)
        else:
            await update_or_query.edit_message_text(text)
        return

    index = max(0, min(index, len(chars) - 1))
    char = chars[index]

    status_icon = "✅" if char["status"] == "alive" else "💀"
    if char["status"] == "dead" and char["revive_time"]:
        remaining = char["revive_time"] - datetime.now()
        if remaining.total_seconds() > 0:
            mins = int(remaining.total_seconds() / 60)
            status_text = f"💀 Dead (revives in {mins} min)"
        else:
            status_text = "✅ Alive (revive pending)"
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute("UPDATE user_characters SET status = 'alive', revive_time = NULL WHERE id = %s",
                                (char["uc_id"],))
                    conn.commit()
    else:
        status_text = f"{status_icon} {char['status'].capitalize()}"

    text = (
        f"⚔️ <b>Your Character</b> [{index + 1}/{len(chars)}]\n\n"
        f"🔥 <b>{char['name']}</b>\n"
        f"💫 Rarity: {char['rarity']}\n"
        f"⚡ Power: {char['power']}\n"
        f"☠️ Kills: {char['kills']}\n"
        f"🎯 Skills: {char.get('skills') or 'None'}\n"
        f"❤️ Status: {status_text}"
    )

    buttons = []
    nav = []
    if index > 0:
        nav.append(InlineKeyboardButton("◀ Prev", callback_data=f"chars_{user_id}_{index - 1}"))
    if index < len(chars) - 1:
        nav.append(InlineKeyboardButton("Next ▶", callback_data=f"chars_{user_id}_{index + 1}"))
    if nav:
        buttons.append(nav)
    buttons.append([InlineKeyboardButton("⚔️ Battle", callback_data=f"battle_{char['id']}")])

    keyboard = InlineKeyboardMarkup(buttons)

    if char.get("image_path") and os.path.exists(char["image_path"]):
        try:
            if hasattr(update_or_query, "message"):
                await update_or_query.message.reply_photo(
                    photo=open(char["image_path"], "rb"),
                    caption=text, parse_mode="HTML", reply_markup=keyboard
                )
            else:
                await update_or_query.edit_message_caption(
                    caption=text, parse_mode="HTML", reply_markup=keyboard
                )
        except Exception:
            if hasattr(update_or_query, "message"):
                await update_or_query.message.reply_text(text, parse_mode="HTML", reply_markup=keyboard)
            else:
                await update_or_query.edit_message_text(text, parse_mode="HTML", reply_markup=keyboard)
    else:
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(text, parse_mode="HTML", reply_markup=keyboard)
        else:
            try:
                await update_or_query.edit_message_text(text, parse_mode="HTML", reply_markup=keyboard)
            except Exception:
                await update_or_query.edit_message_caption(text, parse_mode="HTML", reply_markup=keyboard)

async def cmd_characterinfo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /characterinfo [id]")
        return
    char_id = int(context.args[0])
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM characters WHERE id = %s", (char_id,))
            char = cur.fetchone()
    if not char:
        await update.message.reply_text("❌ Character not found.")
        return
    text = (
        f"📋 <b>Character Info</b>\n\n"
        f"ID: {char['id']}\n"
        f"🔥 Name: {char['name']}\n"
        f"💫 Rarity: {char['rarity']}\n"
        f"⚡ Power: {char['power']}\n"
        f"☠️ Kills: {char['kills']}\n"
        f"🎯 Skills: {char.get('skills') or 'None'}\n"
        f"💰 Price: {char['price']:,} coins"
    )
    if char.get("image_path") and os.path.exists(char["image_path"]):
        await update.message.reply_photo(photo=open(char["image_path"], "rb"), caption=text, parse_mode="HTML")
    else:
        await update.message.reply_text(text, parse_mode="HTML")

# ─── CARDS ────────────────────────────────────────────────────────────────────

async def cmd_cards(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    await show_user_cards(update, context, user.id, 0)

async def show_user_cards(update_or_query, context, user_id, index):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.*, uc.favorite
                FROM user_cards uc
                JOIN cards c ON c.id = uc.card_id
                WHERE uc.user_id = %s
                ORDER BY c.id
            """, (user_id,))
            cards = cur.fetchall()

    if not cards:
        text = "🃏 You don't own any cards yet.\nBuy from /market!"
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(text)
        else:
            await update_or_query.edit_message_text(text)
        return

    index = max(0, min(index, len(cards) - 1))
    card = cards[index]

    text = (
        f"🃏 <b>Your Card</b> [{index + 1}/{len(cards)}]\n\n"
        f"✨ <b>{card['name']}</b>\n"
        f"💫 Rarity: {card['rarity']}\n"
        f"⚡ Power: {card['power']}\n"
        f"🎯 Skills: {card.get('skills') or 'None'}\n"
        f"⭐ Favorite: {'Yes' if card.get('favorite') else 'No'}"
    )

    buttons = []
    nav = []
    if index > 0:
        nav.append(InlineKeyboardButton("◀ Prev", callback_data=f"ucard_{user_id}_{index - 1}"))
    if index < len(cards) - 1:
        nav.append(InlineKeyboardButton("Next ▶", callback_data=f"ucard_{user_id}_{index + 1}"))
    if nav:
        buttons.append(nav)
    buttons.append([InlineKeyboardButton("⭐ Favorite", callback_data=f"fav_card_{card['id']}")])

    keyboard = InlineKeyboardMarkup(buttons)

    if card.get("image_path") and os.path.exists(card["image_path"]):
        try:
            if hasattr(update_or_query, "message"):
                await update_or_query.message.reply_photo(
                    photo=open(card["image_path"], "rb"),
                    caption=text, parse_mode="HTML", reply_markup=keyboard
                )
            else:
                await update_or_query.edit_message_caption(caption=text, parse_mode="HTML", reply_markup=keyboard)
        except Exception:
            if hasattr(update_or_query, "message"):
                await update_or_query.message.reply_text(text, parse_mode="HTML", reply_markup=keyboard)
            else:
                await update_or_query.edit_message_text(text, parse_mode="HTML", reply_markup=keyboard)
    else:
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(text, parse_mode="HTML", reply_markup=keyboard)
        else:
            try:
                await update_or_query.edit_message_text(text, parse_mode="HTML", reply_markup=keyboard)
            except Exception:
                await update_or_query.edit_message_caption(text, parse_mode="HTML", reply_markup=keyboard)

async def cmd_cardinfo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /cardinfo [id]")
        return
    card_id = int(context.args[0])
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cards WHERE id = %s", (card_id,))
            card = cur.fetchone()
    if not card:
        await update.message.reply_text("❌ Card not found.")
        return
    text = (
        f"📋 <b>Card Info</b>\n\n"
        f"ID: {card['id']}\n"
        f"✨ Name: {card['name']}\n"
        f"💫 Rarity: {card['rarity']}\n"
        f"⚡ Power: {card['power']}\n"
        f"🎯 Skills: {card.get('skills') or 'None'}\n"
        f"💰 Price: {card['price']:,} coins"
    )
    if card.get("image_path") and os.path.exists(card["image_path"]):
        await update.message.reply_photo(photo=open(card["image_path"], "rb"), caption=text, parse_mode="HTML")
    else:
        await update.message.reply_text(text, parse_mode="HTML")

# ─── MARKET ───────────────────────────────────────────────────────────────────

async def cmd_market(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    await show_market(update, context, 0)

async def show_market(update_or_query, context, index):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT m.*, 
                    CASE WHEN m.item_type = 'character' THEN c.name
                         WHEN m.item_type = 'card' THEN cd.name END as item_name,
                    CASE WHEN m.item_type = 'character' THEN c.rarity
                         WHEN m.item_type = 'card' THEN cd.rarity END as rarity,
                    CASE WHEN m.item_type = 'character' THEN c.power
                         WHEN m.item_type = 'card' THEN cd.power END as power,
                    CASE WHEN m.item_type = 'character' THEN c.kills ELSE NULL END as kills,
                    CASE WHEN m.item_type = 'character' THEN c.skills
                         WHEN m.item_type = 'card' THEN cd.skills END as skills,
                    CASE WHEN m.item_type = 'character' THEN c.image_path
                         WHEN m.item_type = 'card' THEN cd.image_path END as image_path
                FROM market m
                LEFT JOIN characters c ON m.item_type = 'character' AND m.item_id = c.id
                LEFT JOIN cards cd ON m.item_type = 'card' AND m.item_id = cd.id
                ORDER BY m.id
            """)
            items = cur.fetchall()

    if not items:
        text = "🏪 Marketplace currently empty."
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(text)
        else:
            await update_or_query.edit_message_text(text)
        return

    index = max(0, min(index, len(items) - 1))
    item = items[index]
    icon = "⚔️" if item["item_type"] == "character" else "🃏"
    type_label = "Character" if item["item_type"] == "character" else "Card"

    text = (
        f"🔥 <b>Marketplace</b> [{index + 1}/{len(items)}]\n\n"
        f"{icon} {type_label}: <b>{item['item_name'] or 'Unknown'}</b>\n"
        f"💫 Rarity: {item.get('rarity') or 'N/A'}\n"
        f"⚡ Power: {item.get('power') or 0}\n"
    )
    if item["item_type"] == "character" and item.get("kills") is not None:
        text += f"☠️ Kills: {item['kills']}\n"
    if item.get("skills"):
        text += f"🎯 Skills: {item['skills']}\n"
    text += f"\n💰 Price: <b>{item['price']:,} coins</b>"

    buttons = []
    nav = []
    if index > 0:
        nav.append(InlineKeyboardButton("◀ Prev", callback_data=f"market_{index - 1}"))
    if index < len(items) - 1:
        nav.append(InlineKeyboardButton("Next ▶", callback_data=f"market_{index + 1}"))
    if nav:
        buttons.append(nav)
    buttons.append([InlineKeyboardButton("🛒 Buy", callback_data=f"buy_market_{item['id']}")])

    keyboard = InlineKeyboardMarkup(buttons)

    if item.get("image_path") and os.path.exists(item["image_path"]):
        try:
            if hasattr(update_or_query, "message"):
                await update_or_query.message.reply_photo(
                    photo=open(item["image_path"], "rb"),
                    caption=text, parse_mode="HTML", reply_markup=keyboard
                )
            else:
                await update_or_query.edit_message_caption(caption=text, parse_mode="HTML", reply_markup=keyboard)
        except Exception:
            if hasattr(update_or_query, "message"):
                await update_or_query.message.reply_text(text, parse_mode="HTML", reply_markup=keyboard)
            else:
                await update_or_query.edit_message_text(text, parse_mode="HTML", reply_markup=keyboard)
    else:
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(text, parse_mode="HTML", reply_markup=keyboard)
        else:
            try:
                await update_or_query.edit_message_text(text, parse_mode="HTML", reply_markup=keyboard)
            except Exception:
                await update_or_query.edit_message_caption(text, parse_mode="HTML", reply_markup=keyboard)

async def cmd_buy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    if not context.args:
        await update.message.reply_text("Usage: /buy [market_id]")
        return
    await do_buy(update, context, user.id, int(context.args[0]))

async def do_buy(update_or_query, context, user_id, market_id):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM market WHERE id = %s", (market_id,))
            item = cur.fetchone()

    if not item:
        msg = "❌ Item not found in market."
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(msg)
        else:
            await update_or_query.answer(msg, show_alert=True)
        return

    user = get_user(user_id)
    total_coins = user["coins"] + user["bank"]

    if total_coins < item["price"]:
        msg = f"❌ Insufficient coins. Need {item['price']:,}, have {total_coins:,}."
        if hasattr(update_or_query, "message"):
            await update_or_query.message.reply_text(msg)
        else:
            await update_or_query.answer(msg, show_alert=True)
        return

    with get_db() as conn:
        with conn.cursor() as cur:
            if item["item_type"] == "character":
                cur.execute("SELECT id FROM user_characters WHERE user_id = %s AND character_id = %s",
                            (user_id, item["item_id"]))
                if cur.fetchone():
                    msg = "⚠️ You already own this character."
                    if hasattr(update_or_query, "message"):
                        await update_or_query.message.reply_text(msg)
                    else:
                        await update_or_query.answer(msg, show_alert=True)
                    return
            elif item["item_type"] == "card":
                cur.execute("SELECT id FROM user_cards WHERE user_id = %s AND card_id = %s",
                            (user_id, item["item_id"]))
                if cur.fetchone():
                    msg = "⚠️ You already own this card."
                    if hasattr(update_or_query, "message"):
                        await update_or_query.message.reply_text(msg)
                    else:
                        await update_or_query.answer(msg, show_alert=True)
                    return

            remaining = item["price"]
            wallet_deduct = min(user["coins"], remaining)
            remaining -= wallet_deduct
            bank_deduct = remaining

            cur.execute(
                "UPDATE users SET coins = coins - %s, bank = bank - %s WHERE user_id = %s",
                (wallet_deduct, bank_deduct, user_id)
            )

            if item["item_type"] == "character":
                cur.execute("INSERT INTO user_characters (user_id, character_id, status) VALUES (%s, %s, 'alive')",
                            (user_id, item["item_id"]))
                cur.execute("SELECT name FROM characters WHERE id = %s", (item["item_id"],))
                name = cur.fetchone()["name"]
            else:
                cur.execute("INSERT INTO user_cards (user_id, card_id, favorite) VALUES (%s, %s, false)",
                            (user_id, item["item_id"]))
                cur.execute("SELECT name FROM cards WHERE id = %s", (item["item_id"],))
                name = cur.fetchone()["name"]

            conn.commit()

    msg = f"✅ <b>Purchase Successful!</b>\n\nYou obtained:\n<b>{name}</b>"
    if hasattr(update_or_query, "message"):
        await update_or_query.message.reply_text(msg, parse_mode="HTML")
    else:
        await update_or_query.answer("✅ Purchase successful!", show_alert=True)

async def cmd_sell(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if len(args) < 3:
        await update.message.reply_text("Usage: /sell [character|card] [item_id] [price]")
        return
    item_type, item_id, price = args[0].lower(), int(args[1]), int(args[2])
    if item_type not in ("character", "card"):
        await update.message.reply_text("❌ Item type must be 'character' or 'card'.")
        return
    if price < 1:
        await update.message.reply_text("❌ Price must be at least 1 coin.")
        return

    with get_db() as conn:
        with conn.cursor() as cur:
            if item_type == "character":
                cur.execute("SELECT * FROM user_characters WHERE user_id = %s AND character_id = %s",
                            (user.id, item_id))
            else:
                cur.execute("SELECT * FROM user_cards WHERE user_id = %s AND card_id = %s",
                            (user.id, item_id))
            owned = cur.fetchone()
            if not owned:
                await update.message.reply_text("❌ You don't own this item.")
                return

            if item_type == "character":
                cur.execute("DELETE FROM user_characters WHERE user_id = %s AND character_id = %s",
                            (user.id, item_id))
            else:
                cur.execute("DELETE FROM user_cards WHERE user_id = %s AND card_id = %s",
                            (user.id, item_id))

            cur.execute("INSERT INTO market (item_type, item_id, price, seller_id) VALUES (%s, %s, %s, %s)",
                        (item_type, item_id, price, user.id))
            conn.commit()

    await update.message.reply_text(f"✅ Item listed on market for {price:,} coins!")

# ─── ADVENTURE ────────────────────────────────────────────────────────────────

async def cmd_adventure(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    events = [
        ("🌲 Forest Event", ["🎁 Open chest", "⚔️ Attack monster", "🏃 Run away", "🔍 Search area"]),
        ("🏔️ Mountain Peak", ["🧗 Climb higher", "⛏️ Mine crystals", "🦅 Follow bird", "🏕️ Rest here"]),
        ("🌊 Ancient Ruins", ["🗡️ Fight guardians", "📜 Read scrolls", "💎 Grab treasure", "🚪 Leave quickly"]),
        ("🌙 Midnight Cave", ["🔦 Explore deep", "👻 Confront spirit", "🪨 Move boulder", "🦇 Follow bats"]),
    ]
    event_name, choices = random.choice(events)
    keyboard = []
    for i, choice in enumerate(choices):
        keyboard.append([InlineKeyboardButton(choice, callback_data=f"adv_{i}")])

    await update.message.reply_text(
        f"🗺️ <b>{event_name}</b>\n\nYou encounter something unexpected! What do you do?",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def cmd_explore(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    discoveries = [
        ("💰 Coin Pouch", "coins", random.randint(50, 300)),
        ("⚔️ Ancient Weapon", "xp", random.randint(20, 80)),
        ("🗺️ Treasure Map", "coins", random.randint(200, 500)),
        ("🌿 Healing Herb", "xp", random.randint(10, 30)),
        ("💎 Rare Crystal", "coins", random.randint(100, 400)),
    ]
    name, reward_type, amount = random.choice(discoveries)
    with get_db() as conn:
        with conn.cursor() as cur:
            if reward_type == "coins":
                cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (amount, user.id))
            else:
                cur.execute("UPDATE users SET xp = xp + %s WHERE user_id = %s", (amount, user.id))
            conn.commit()
    text = (
        f"🔍 <b>Exploration Result</b>\n\n"
        f"You discovered: <b>{name}</b>!\n"
        f"Reward: +{amount} {reward_type}"
    )
    await update.message.reply_text(text, parse_mode="HTML")

# ─── RAID BOSS ────────────────────────────────────────────────────────────────

async def cmd_raid(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    chat_id = update.effective_chat.id
    if chat_id not in BOSS_HP:
        BOSS_HP[chat_id] = BOSS_MAX_HP

    hp = BOSS_HP[chat_id]
    hp_bar = "█" * int(hp / BOSS_MAX_HP * 10) + "░" * (10 - int(hp / BOSS_MAX_HP * 10))

    text = (
        f"🔥 <b>RAID BOSS — Shadow Dragon</b>\n\n"
        f"❤️ HP: [{hp_bar}] {hp:,}/{BOSS_MAX_HP:,}\n\n"
        f"Select a character with /damage to attack!\n"
        f"Example: /damage 500\n\n"
        f"Defeat rewards: 2000 coins + 100 XP + Premium!"
    )
    await update.message.reply_text(text, parse_mode="HTML")

async def cmd_damage(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    chat_id = update.effective_chat.id

    if chat_id not in BOSS_HP:
        BOSS_HP[chat_id] = BOSS_MAX_HP

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.power, c.name, uc.status, uc.revive_time, uc.id as uc_id
                FROM user_characters uc
                JOIN characters c ON c.id = uc.character_id
                WHERE uc.user_id = %s AND uc.status = 'alive'
                ORDER BY c.power DESC LIMIT 1
            """, (user.id,))
            char = cur.fetchone()

    if not char:
        await update.message.reply_text("❌ No alive characters! Use /characters to check status.")
        return

    power = char["power"]
    damage = random.randint(int(power * 0.8), int(power * 1.2))
    multiplier = 2 if is_premium(user.id) else 1
    damage *= multiplier

    BOSS_HP[chat_id] = max(0, BOSS_HP[chat_id] - damage)
    remaining_hp = BOSS_HP[chat_id]

    xp_result = add_xp(user.id, 20)
    level_msg = ""
    if xp_result["leveled_up"]:
        new_rank = get_rank(xp_result["new_level"])
        level_msg = f"\n\n🎉 <b>Level Up! Level {xp_result['new_level']} — {new_rank}</b>"

    if remaining_hp <= 0:
        BOSS_HP[chat_id] = BOSS_MAX_HP
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins + 2000 WHERE user_id = %s", (user.id,))
                premium_until = datetime.now() + timedelta(days=7)
                cur.execute("UPDATE users SET premium_until = %s WHERE user_id = %s",
                            (premium_until, user.id))
                conn.commit()
        xp_result2 = add_xp(user.id, 100)
        kill_msg = ""
        if xp_result2["leveled_up"]:
            new_rank2 = get_rank(xp_result2["new_level"])
            kill_msg = f"\n🎉 <b>Level Up! Level {xp_result2['new_level']} — {new_rank2}</b>"

        text = (
            f"💥 <b>BOSS DEFEATED!</b>\n\n"
            f"⚔️ {char['name']} dealt {damage:,} damage!\n"
            f"The Shadow Dragon has been slain!\n\n"
            f"🏆 Rewards:\n"
            f"💰 +2000 coins\n"
            f"⭐ +100 XP\n"
            f"💎 7 days Premium!{kill_msg}"
        )
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE characters SET kills = kills + 1 WHERE id = %s",
                            (char.get("character_id") or char.get("id"),))
                conn.commit()
    else:
        boss_attack = random.randint(100, 500)
        char_dead = random.random() < 0.15
        death_msg = ""
        if char_dead:
            revive_time = datetime.now() + timedelta(hours=3)
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE user_characters SET status = 'dead', revive_time = %s WHERE id = %s",
                        (revive_time, char["uc_id"])
                    )
                    conn.commit()
            death_msg = f"\n\n💀 <b>{char['name']} was killed!</b> Revives in 3 hours."

        hp_bar = "█" * int(remaining_hp / BOSS_MAX_HP * 10) + "░" * (10 - int(remaining_hp / BOSS_MAX_HP * 10))
        text = (
            f"⚔️ <b>Raid Attack!</b>\n\n"
            f"🗡️ {char['name']} dealt <b>{damage:,}</b> damage!\n"
            f"Boss counter-attacked for {boss_attack} damage!\n\n"
            f"❤️ Boss HP: [{hp_bar}] {remaining_hp:,}\n"
            f"⭐ +20 XP earned!{death_msg}{level_msg}"
        )

    await update.message.reply_text(text, parse_mode="HTML")

# ─── TOURNAMENTS ──────────────────────────────────────────────────────────────

async def cmd_tournament(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM tournaments WHERE status IN ('pending', 'active') ORDER BY id")
            tournaments = cur.fetchall()

    if not tournaments:
        await update.message.reply_text("🏆 No active tournaments right now.")
        return

    text = "🏆 <b>Active Tournaments</b>\n\n"
    keyboard = []
    for t in tournaments:
        status_icon = "🟢" if t["status"] == "active" else "🟡"
        text += f"{status_icon} <b>{t['name']}</b>\nReward: {t['reward_value']} {t['reward_type']}\n\n"
        keyboard.append([InlineKeyboardButton(f"Join: {t['name']}", callback_data=f"joint_{t['id']}")])

    await update.message.reply_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup(keyboard))

async def cmd_jointournament(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    if not context.args:
        await update.message.reply_text("Usage: /jointournament [tournament_id]")
        return
    t_id = int(context.args[0])
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM tournaments WHERE id = %s", (t_id,))
            t = cur.fetchone()
            if not t:
                await update.message.reply_text("❌ Tournament not found.")
                return
            if t["status"] == "ended":
                await update.message.reply_text("❌ Tournament has ended.")
                return
            cur.execute("SELECT id FROM tournament_participants WHERE tournament_id = %s AND user_id = %s",
                        (t_id, user.id))
            if cur.fetchone():
                await update.message.reply_text("⚠️ You're already in this tournament.")
                return
            cur.execute("INSERT INTO tournament_participants (tournament_id, user_id, score) VALUES (%s, %s, 0)",
                        (t_id, user.id))
            conn.commit()
    await update.message.reply_text(f"✅ Joined tournament: <b>{t['name']}</b>!", parse_mode="HTML")

async def cmd_tournament_lb(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /tournamentleaderboard [id]")
        return
    t_id = int(context.args[0])
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM tournaments WHERE id = %s", (t_id,))
            t = cur.fetchone()
            if not t:
                await update.message.reply_text("❌ Tournament not found.")
                return
            cur.execute("""
                SELECT u.username, u.first_name, tp.score
                FROM tournament_participants tp
                JOIN users u ON u.user_id = tp.user_id
                WHERE tp.tournament_id = %s
                ORDER BY tp.score DESC LIMIT 10
            """, (t_id,))
            rows = cur.fetchall()

    if not rows:
        await update.message.reply_text("📊 No participants yet.")
        return

    text = f"🏆 <b>{t['name']} Leaderboard</b>\n\n"
    medals = ["🥇", "🥈", "🥉"]
    for i, row in enumerate(rows):
        medal = medals[i] if i < 3 else f"{i + 1}."
        name = row.get("username") or row.get("first_name") or "Unknown"
        text += f"{medal} @{name} — {row['score']} pts\n"

    await update.message.reply_text(text, parse_mode="HTML")

# ─── GUILDS ───────────────────────────────────────────────────────────────────

async def cmd_guildcreate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    if not context.args:
        await update.message.reply_text("Usage: /guildcreate [name]")
        return
    name = " ".join(context.args)
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("INSERT INTO guilds (name, owner_id, level, coins) VALUES (%s, %s, 1, 0)",
                            (name, user.id))
                cur.execute("SELECT id FROM guilds WHERE name = %s", (name,))
                guild = cur.fetchone()
                cur.execute("INSERT INTO guild_members (guild_id, user_id) VALUES (%s, %s)",
                            (guild["id"], user.id))
                conn.commit()
                await update.message.reply_text(f"✅ Guild <b>{name}</b> created!", parse_mode="HTML")
            except Exception:
                await update.message.reply_text("❌ Guild name already taken.")

async def cmd_guildjoin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    if not context.args:
        await update.message.reply_text("Usage: /guildjoin [name]")
        return
    name = " ".join(context.args)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM guilds WHERE name = %s", (name,))
            guild = cur.fetchone()
            if not guild:
                await update.message.reply_text("❌ Guild not found.")
                return
            cur.execute("SELECT id FROM guild_members WHERE user_id = %s", (user.id,))
            if cur.fetchone():
                await update.message.reply_text("⚠️ Already in a guild. Leave first.")
                return
            cur.execute("INSERT INTO guild_members (guild_id, user_id) VALUES (%s, %s)",
                        (guild["id"], user.id))
            conn.commit()
    await update.message.reply_text(f"✅ Joined guild <b>{name}</b>!", parse_mode="HTML")

async def cmd_guildleave(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM guild_members WHERE user_id = %s", (user.id,))
            conn.commit()
    await update.message.reply_text("✅ Left your guild.")

async def cmd_guildinfo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT g.*, COUNT(gm.id) as members
                FROM guild_members gm
                JOIN guilds g ON g.id = gm.guild_id
                WHERE gm.user_id = %s
                GROUP BY g.id
            """, (user.id,))
            guild = cur.fetchone()
    if not guild:
        await update.message.reply_text("❌ You're not in a guild. Join with /guildjoin")
        return
    text = (
        f"🏰 <b>Guild Info</b>\n\n"
        f"Name: {guild['name']}\n"
        f"Level: {guild['level']}\n"
        f"Coins: {guild['coins']:,}\n"
        f"Members: {guild['members']}\n"
        f"Owner ID: {guild['owner_id']}"
    )
    await update.message.reply_text(text, parse_mode="HTML")

async def cmd_guildleaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT g.name, g.level, g.coins, COUNT(gm.id) as members
                FROM guilds g
                LEFT JOIN guild_members gm ON gm.guild_id = g.id
                GROUP BY g.id
                ORDER BY g.level DESC, g.coins DESC LIMIT 10
            """)
            guilds = cur.fetchall()

    if not guilds:
        await update.message.reply_text("🏆 No guilds yet.")
        return

    text = "🏆 <b>Guild Leaderboard</b>\n\n"
    medals = ["🥇", "🥈", "🥉"]
    for i, g in enumerate(guilds):
        m = medals[i] if i < 3 else f"{i + 1}."
        text += f"{m} <b>{g['name']}</b> — Level {g['level']} | {g['members']} members\n"

    await update.message.reply_text(text, parse_mode="HTML")

# ─── MINI GAMES ───────────────────────────────────────────────────────────────

async def cmd_dice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Usage: /dice [bet_amount]")
        return
    bet = int(args[0])
    data = get_user(user.id)
    if data["coins"] < bet:
        await update.message.reply_text("❌ Insufficient coins.")
        return

    player_roll = random.randint(1, 6)
    bot_roll = random.randint(1, 6)
    win = player_roll > bot_roll

    with get_db() as conn:
        with conn.cursor() as cur:
            if win:
                cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (bet, user.id))
            else:
                cur.execute("UPDATE users SET coins = coins - %s WHERE user_id = %s", (bet, user.id))
            conn.commit()

    result = "🎉 YOU WIN!" if win else "💀 YOU LOSE!"
    text = (
        f"🎲 <b>Dice Game</b>\n\n"
        f"You rolled: {player_roll}\n"
        f"Bot rolled: {bot_roll}\n\n"
        f"{result}\n"
        f"{'+'if win else '-'}{bet} coins"
    )
    await update.message.reply_text(text, parse_mode="HTML")

async def cmd_bet(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Usage: /bet [amount]")
        return
    bet = int(args[0])
    data = get_user(user.id)
    if data["coins"] < bet:
        await update.message.reply_text("❌ Insufficient coins.")
        return

    win = random.random() < 0.5
    with get_db() as conn:
        with conn.cursor() as cur:
            change = bet if win else -bet
            cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (change, user.id))
            conn.commit()

    result = f"🎉 Won {bet} coins!" if win else f"💀 Lost {bet} coins!"
    await update.message.reply_text(f"🎰 <b>Bet Result</b>\n\n{result}", parse_mode="HTML")

async def cmd_rob(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    success = random.random() < 0.4
    if success:
        amount = random.randint(50, 300)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (amount, user.id))
                conn.commit()
        await update.message.reply_text(f"🦹 You successfully robbed {amount} coins!")
    else:
        fine = random.randint(50, 200)
        data = get_user(user.id)
        fine = min(fine, data["coins"])
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins - %s WHERE user_id = %s", (fine, user.id))
                conn.commit()
        await update.message.reply_text(f"👮 You got caught and fined {fine} coins!")

async def cmd_slots(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Usage: /slots [bet]")
        return
    bet = int(args[0])
    data = get_user(user.id)
    if data["coins"] < bet:
        await update.message.reply_text("❌ Insufficient coins.")
        return

    emojis = ["🍒", "🍋", "⭐", "💎", "🎯", "🔥"]
    slot1 = random.choice(emojis)
    slot2 = random.choice(emojis)
    slot3 = random.choice(emojis)

    win = slot1 == slot2 == slot3
    if slot1 == slot2 or slot2 == slot3:
        partial = True
        prize = bet // 2
    else:
        partial = False
        prize = -bet

    if win:
        prize = bet * 3
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (prize, user.id))
                conn.commit()
        result = f"🎉 JACKPOT! +{prize} coins!"
    elif partial:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (prize, user.id))
                conn.commit()
        result = f"✨ Partial match! +{prize} coins!"
    else:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins - %s WHERE user_id = %s", (bet, user.id))
                conn.commit()
        result = f"💀 No match. -{bet} coins."

    await update.message.reply_text(
        f"🎰 <b>Slots</b>\n\n[ {slot1} | {slot2} | {slot3} ]\n\n{result}",
        parse_mode="HTML"
    )

async def cmd_flip(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Usage: /flip [bet]")
        return
    bet = int(args[0])
    data = get_user(user.id)
    if data["coins"] < bet:
        await update.message.reply_text("❌ Insufficient coins.")
        return

    win = random.random() < 0.5
    result_icon = "🌟 Heads" if win else "💀 Tails"
    with get_db() as conn:
        with conn.cursor() as cur:
            change = bet if win else -bet
            cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (change, user.id))
            conn.commit()

    await update.message.reply_text(
        f"🪙 <b>Coin Flip</b>\n\n{result_icon}!\n\n{'+'if win else '-'}{bet} coins",
        parse_mode="HTML"
    )

# ─── PREMIUM ──────────────────────────────────────────────────────────────────

async def cmd_buypremium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    keyboard = [
        [InlineKeyboardButton("7 Days — 2000 coins", callback_data="prem_7_2000")],
        [InlineKeyboardButton("30 Days — 7000 coins", callback_data="prem_30_7000")],
        [InlineKeyboardButton("90 Days — 18000 coins", callback_data="prem_90_18000")],
    ]
    await update.message.reply_text(
        "💎 <b>Premium Subscription</b>\n\nBenefits:\n✅ No ads\n✅ Double rewards\n✅ Special cards\n✅ 2x raid damage",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def cmd_mypremium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    data = get_user(user.id)
    if data.get("premium_until") and data["premium_until"] > datetime.now():
        remaining = data["premium_until"] - datetime.now()
        days = remaining.days
        await update.message.reply_text(
            f"💎 <b>Premium Active!</b>\n\nExpires in: {days} days\nDate: {data['premium_until'].strftime('%Y-%m-%d')}",
            parse_mode="HTML"
        )
    else:
        await update.message.reply_text("❌ No active premium. Buy with /buypremium")

# ─── BATTLE PASS ──────────────────────────────────────────────────────────────

async def cmd_battlepass(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM battle_pass WHERE user_id = %s AND active = true", (user.id,))
            bp = cur.fetchone()

    if bp:
        text = (
            f"⚔️ <b>Battle Pass Active!</b>\n\n"
            f"Tier: {bp['tier']}\n"
            f"Purchased: {bp['purchased_at'].strftime('%Y-%m-%d')}\n"
            f"Expires: {bp['expires_at'].strftime('%Y-%m-%d') if bp.get('expires_at') else 'Never'}\n\n"
            f"Use /bpreward to claim your tier reward!"
        )
    else:
        text = (
            "⚔️ <b>Battle Pass</b>\n\nGet exclusive rewards every tier!\n\n"
            "Price: 3000 coins / 30 days\nUse /buypass to purchase!"
        )
    await update.message.reply_text(text, parse_mode="HTML")

async def cmd_buypass(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    data = get_user(user.id)
    if data["coins"] < 3000:
        await update.message.reply_text("❌ Need 3000 coins for Battle Pass.")
        return
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET coins = coins - 3000 WHERE user_id = %s", (user.id,))
            expires = datetime.now() + timedelta(days=30)
            cur.execute("""
                INSERT INTO battle_pass (user_id, active, tier, purchased_at, expires_at)
                VALUES (%s, true, 0, NOW(), %s)
                ON CONFLICT DO NOTHING
            """, (user.id, expires))
            conn.commit()
    await update.message.reply_text("✅ <b>Battle Pass purchased!</b>\nUse /bpreward to claim rewards!", parse_mode="HTML")

async def cmd_bpreward(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    ensure_user(user)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM battle_pass WHERE user_id = %s AND active = true", (user.id,))
            bp = cur.fetchone()
            if not bp:
                await update.message.reply_text("❌ No active Battle Pass. Buy with /buypass")
                return
            reward = (bp["tier"] + 1) * 200
            cur.execute("UPDATE battle_pass SET tier = tier + 1 WHERE id = %s", (bp["id"],))
            cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (reward, user.id))
            conn.commit()
    await update.message.reply_text(
        f"🎁 <b>Battle Pass Reward!</b>\n\nTier {bp['tier'] + 1} reward claimed!\n+{reward} coins!",
        parse_mode="HTML"
    )

# ─── BROADCAST ────────────────────────────────────────────────────────────────

async def cmd_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.id != ADMIN_ID:
        await update.message.reply_text("❌ Admin only command.")
        return
    if not context.args:
        await update.message.reply_text("Usage: /broadcast [message]")
        return
    message = " ".join(context.args)

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT chat_id FROM groups")
            groups = cur.fetchall()

    sent, failed = 0, 0
    for group in groups:
        try:
            await context.bot.send_message(chat_id=group["chat_id"], text=message, parse_mode="HTML")
            sent += 1
        except Exception:
            failed += 1

    await update.message.reply_text(
        f"📢 <b>Broadcast Completed</b>\n\nGroups Sent: {sent}\nFailed: {failed}",
        parse_mode="HTML"
    )

# ─── CALLBACK HANDLERS ────────────────────────────────────────────────────────

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user = query.from_user
    ensure_user(user)
    data = query.data

    if data == "help":
        await query.edit_message_text(
            "📖 Use /help for full command list!",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀ Back", callback_data="start")]])
        )

    elif data == "profile":
        user_data = get_user(user.id)
        rank = get_rank(user_data["level"])
        await query.edit_message_text(
            f"👤 <b>Profile</b>\n\nLevel: {user_data['level']} | Rank: {rank}\n"
            f"Coins: {user_data['coins']:,} | Bank: {user_data['bank']:,}\nXP: {user_data['xp']}",
            parse_mode="HTML"
        )

    elif data.startswith("market_"):
        idx = int(data.split("_")[1])
        await show_market(query, context, idx)

    elif data.startswith("chars_"):
        parts = data.split("_")
        uid, idx = int(parts[1]), int(parts[2])
        await show_user_characters(query, context, uid, idx)

    elif data.startswith("ucard_"):
        parts = data.split("_")
        uid, idx = int(parts[1]), int(parts[2])
        await show_user_cards(query, context, uid, idx)

    elif data.startswith("buy_market_"):
        market_id = int(data.split("_")[2])
        await do_buy(query, context, user.id, market_id)

    elif data.startswith("adv_"):
        choice = int(data.split("_")[1])
        outcomes = [
            ("🎁 You opened the chest and found coins!", "coins", random.randint(100, 500)),
            ("⚔️ You fought bravely and gained XP!", "xp", random.randint(30, 100)),
            ("🏃 Smart move! You escaped safely.", "coins", random.randint(10, 50)),
            ("🔍 You found a hidden treasure!", "coins", random.randint(200, 800)),
        ]
        desc, reward_type, amount = outcomes[choice]
        with get_db() as conn:
            with conn.cursor() as cur:
                if reward_type == "coins":
                    cur.execute("UPDATE users SET coins = coins + %s WHERE user_id = %s", (amount, user.id))
                else:
                    cur.execute("UPDATE users SET xp = xp + %s WHERE user_id = %s", (amount, user.id))
                conn.commit()
        multiplier = 2 if is_premium(user.id) else 1
        final = amount * multiplier
        await query.edit_message_text(
            f"🗺️ <b>Adventure Result</b>\n\n{desc}\n\n+{final} {reward_type}{'(2x Premium!)' if multiplier == 2 else ''}",
            parse_mode="HTML"
        )

    elif data.startswith("joint_"):
        t_id = int(data.split("_")[1])
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM tournaments WHERE id = %s", (t_id,))
                t = cur.fetchone()
                if not t:
                    await query.answer("Tournament not found.", show_alert=True)
                    return
                cur.execute("SELECT id FROM tournament_participants WHERE tournament_id = %s AND user_id = %s",
                            (t_id, user.id))
                if cur.fetchone():
                    await query.answer("Already joined!", show_alert=True)
                    return
                cur.execute("INSERT INTO tournament_participants (tournament_id, user_id, score) VALUES (%s, %s, 0)",
                            (t_id, user.id))
                conn.commit()
        await query.answer(f"✅ Joined {t['name']}!", show_alert=True)

    elif data.startswith("prem_"):
        parts = data.split("_")
        days, cost = int(parts[1]), int(parts[2])
        user_data = get_user(user.id)
        if user_data["coins"] < cost:
            await query.answer(f"❌ Need {cost} coins!", show_alert=True)
            return
        expires = datetime.now() + timedelta(days=days)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET coins = coins - %s, premium_until = %s WHERE user_id = %s",
                            (cost, expires, user.id))
                conn.commit()
        await query.edit_message_text(
            f"💎 <b>Premium Activated!</b>\n\n{days} days premium unlocked!\nExpires: {expires.strftime('%Y-%m-%d')}",
            parse_mode="HTML"
        )

    elif data.startswith("fav_card_"):
        card_id = int(data.split("_")[2])
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT favorite FROM user_cards WHERE user_id = %s AND card_id = %s",
                            (user.id, card_id))
                row = cur.fetchone()
                if row:
                    new_fav = not row["favorite"]
                    cur.execute("UPDATE user_cards SET favorite = %s WHERE user_id = %s AND card_id = %s",
                                (new_fav, user.id, card_id))
                    conn.commit()
                    await query.answer("⭐ Favorited!" if new_fav else "Removed from favorites")

    elif data.startswith("battle_"):
        await query.answer("⚔️ Use /raid to battle the boss!", show_alert=True)

# ─── GROUP DETECTION ──────────────────────────────────────────────────────────

async def chat_member_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    result = update.my_chat_member
    if not result:
        return
    new_status = result.new_chat_member.status
    chat = result.chat

    if new_status in ("member", "administrator") and chat.type in ("group", "supergroup"):
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO groups (chat_id, group_name, added_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (chat_id) DO UPDATE SET group_name = EXCLUDED.group_name
                """, (str(chat.id), chat.title))
                conn.commit()
        try:
            await context.bot.send_message(
                chat_id=chat.id,
                text=(
                    "✅ <b>ANIVOID Bot Activated</b>\n\n"
                    "This group has been registered successfully.\n"
                    "Use /help to see all commands!"
                ),
                parse_mode="HTML"
            )
        except Exception as e:
            logger.warning(f"Could not send welcome message: {e}")

# ─── AUTO ADS ─────────────────────────────────────────────────────────────────

async def send_auto_ads(application):
    """Send random active ad to all groups every 2 hours."""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM ads WHERE status = 'active' ORDER BY RANDOM() LIMIT 1")
                ad = cur.fetchone()
                if not ad:
                    return
                cur.execute("SELECT chat_id FROM groups")
                groups = cur.fetchall()

        for group in groups:
            try:
                await application.bot.send_message(
                    chat_id=group["chat_id"],
                    text=f"📢 <b>Sponsored</b>\n\n{ad['ad_text']}",
                    parse_mode="HTML"
                )
            except Exception as e:
                logger.warning(f"Failed to send ad to {group['chat_id']}: {e}")
    except Exception as e:
        logger.error(f"Auto ads error: {e}")

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    application = Application.builder().token(TELEGRAM_TOKEN).build()

    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("help", cmd_help))
    application.add_handler(CommandHandler("profile", cmd_profile))
    application.add_handler(CommandHandler("balance", cmd_balance))
    application.add_handler(CommandHandler("deposit", cmd_deposit))
    application.add_handler(CommandHandler("withdraw", cmd_withdraw))
    application.add_handler(CommandHandler("daily", cmd_daily))
    application.add_handler(CommandHandler("characters", cmd_characters))
    application.add_handler(CommandHandler("characterinfo", cmd_characterinfo))
    application.add_handler(CommandHandler("cards", cmd_cards))
    application.add_handler(CommandHandler("cardinfo", cmd_cardinfo))
    application.add_handler(CommandHandler("market", cmd_market))
    application.add_handler(CommandHandler("buy", cmd_buy))
    application.add_handler(CommandHandler("sell", cmd_sell))
    application.add_handler(CommandHandler("trade", lambda u, c: u.message.reply_text("🔄 Trade: use /sell to list items")))
    application.add_handler(CommandHandler("adventure", cmd_adventure))
    application.add_handler(CommandHandler("explore", cmd_explore))
    application.add_handler(CommandHandler("raid", cmd_raid))
    application.add_handler(CommandHandler("damage", cmd_damage))
    application.add_handler(CommandHandler("tournament", cmd_tournament))
    application.add_handler(CommandHandler("jointournament", cmd_jointournament))
    application.add_handler(CommandHandler("tournamentleaderboard", cmd_tournament_lb))
    application.add_handler(CommandHandler("guildcreate", cmd_guildcreate))
    application.add_handler(CommandHandler("guildjoin", cmd_guildjoin))
    application.add_handler(CommandHandler("guildleave", cmd_guildleave))
    application.add_handler(CommandHandler("guildinfo", cmd_guildinfo))
    application.add_handler(CommandHandler("guildleaderboard", cmd_guildleaderboard))
    application.add_handler(CommandHandler("dice", cmd_dice))
    application.add_handler(CommandHandler("bet", cmd_bet))
    application.add_handler(CommandHandler("rob", cmd_rob))
    application.add_handler(CommandHandler("slots", cmd_slots))
    application.add_handler(CommandHandler("flip", cmd_flip))
    application.add_handler(CommandHandler("buypremium", cmd_buypremium))
    application.add_handler(CommandHandler("mypremium", cmd_mypremium))
    application.add_handler(CommandHandler("battlepass", cmd_battlepass))
    application.add_handler(CommandHandler("buypass", cmd_buypass))
    application.add_handler(CommandHandler("bpreward", cmd_bpreward))
    application.add_handler(CommandHandler("broadcast", cmd_broadcast))
    application.add_handler(CallbackQueryHandler(callback_handler))
    application.add_handler(ChatMemberHandler(chat_member_handler, ChatMemberHandler.MY_CHAT_MEMBER))

    async def auto_ads_job(context: ContextTypes.DEFAULT_TYPE):
        await send_auto_ads(context.application)

    application.job_queue.run_repeating(auto_ads_job, interval=7200, first=60)

    logger.info("ANIVOID Bot starting...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
