# ANIVOID Anime RPG Bot + Admin Dashboard

## Overview

Full-stack Anime RPG Telegram Bot with connected Admin Website Dashboard. The bot and website share the same PostgreSQL database.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (shared backend)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite (Admin Dashboard)
- **Telegram Bot**: Python 3.11 + python-telegram-bot
- **Scheduler**: APScheduler (via PTB job queue)

## Admin Telegram ID
`7036768966`

## Telegram Bot Token
`8650797200:AAFLOqrhj_uY9sJRZebGxSXZt1MZ-nO50r4`

## Structure

```text
workspace/
├── bot.py                  # Telegram Bot (Python)
├── artifacts/
│   ├── api-server/         # Express API server (shared backend)
│   └── admin-dashboard/    # React + Vite admin panel
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
├── uploads/                # Uploaded character/card images
└── scripts/                # Utility scripts
```

## Workflows

1. **Telegram Bot** — `python3 bot.py` (console)
2. **artifacts/api-server: API Server** — `pnpm --filter @workspace/api-server run dev`
3. **artifacts/admin-dashboard: web** — `pnpm --filter @workspace/admin-dashboard run dev`

## Bot Commands (fully implemented)

- `/start`, `/help` — Welcome and command list
- `/profile`, `/balance`, `/deposit`, `/withdraw`, `/daily` — Economy
- `/characters`, `/characterinfo`, `/cards`, `/cardinfo` — Inventory
- `/market`, `/buy`, `/sell`, `/trade` — Marketplace
- `/adventure`, `/explore` — Adventure with choices
- `/raid`, `/damage` — Raid boss battles
- `/tournament`, `/jointournament`, `/tournamentleaderboard` — Tournaments
- `/guildcreate`, `/guildjoin`, `/guildleave`, `/guildinfo`, `/guildleaderboard` — Guilds
- `/dice`, `/bet`, `/rob`, `/slots`, `/flip` — Mini-games
- `/buypremium`, `/mypremium` — Premium system
- `/battlepass`, `/buypass`, `/bpreward` — Battle pass
- `/broadcast` — Admin only broadcast

## Database Tables

- `users` — Player stats (coins, bank, xp, level, premium)
- `groups` — Saved Telegram groups for broadcast/ads
- `characters` — RPG characters (name, rarity, power, kills, skills, price, image_path)
- `cards` — Collectible cards (name, rarity, power, skills, price, image_path)
- `user_characters` — User-owned characters
- `user_cards` — User-owned cards
- `ads` — Auto-ads sent to groups every 2 hours
- `market` — Marketplace listings
- `guilds` + `guild_members` — Guild system
- `tournaments` + `tournament_participants` — Tournament system
- `battle_pass` — Battle pass subscriptions

## Admin Dashboard Pages

- `/` — Dashboard with live stats
- `/users` — User management, edit coins/xp/level
- `/groups` — Telegram groups overview
- `/characters` — Create/edit/delete characters with image upload
- `/cards` — Create/edit/delete cards with image upload
- `/ads` — Ad manager with enable/disable toggle
- `/tournaments` — Tournament creation and management
- `/market` — Market item management
- `/guilds` — Guild overview
- `/broadcast` — Send broadcast to all groups

## Image Upload

- Admin uploads images via the dashboard (multipart/form-data)
- Images saved to `/uploads/` directory on the server
- Bot reads image files directly from disk and sends as Telegram photos
- API serves images at `/api/uploads/<filename>`

## Auto Systems

- **Auto-ads**: Every 2 hours, sends a random active ad to all groups
- **Auto user register**: Every bot interaction auto-registers the user
- **Auto group save**: Bot auto-saves group when added to one
- **Character death/revive**: Characters die in raids, auto-revive after 3 hours

## Rank System

| Level | Rank |
|-------|------|
| 1 | Beginner |
| 5 | Bronze Hunter |
| 10 | Silver Hunter |
| 20 | Gold Hunter |
| 35 | Elite Slayer |
| 50 | Legendary Hero |
| 75 | Anime God |
