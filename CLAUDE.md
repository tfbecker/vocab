# Vocab - Spaced Repetition App

A minimalist vocabulary learning app using the FSRS-6 algorithm.

## Live URL
https://vocab.becker.im

## Tech Stack
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Algorithm**: ts-fsrs (FSRS-6)
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Docker + Coolify

## Adding Vocabulary

Vocabulary is stored in Markdown files in `data/decks/`. Each file is a deck.

### Deck Format
```markdown
---
name: English → German
description: English vocabulary for German speakers
language_from: en
language_to: de
---

## Vokabeln

| front | back | notes |
|-------|------|-------|
| accomplish | erreichen, schaffen | verb |
| comprehensive | umfassend, ausführlich | adjective |
```

### To add new vocabulary:
1. Edit the markdown file in `data/decks/`
2. Click "Sync" in the web UI, or call `POST /api/sync`
3. New cards will be added with "New" state

### To create a new deck:
1. Create a new `.md` file in `data/decks/`
2. Follow the format above
3. Sync to import

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/decks` | List all decks with stats |
| `GET` | `/api/cards/due` | Get due cards (optional `?deck=slug`) |
| `POST` | `/api/cards/review` | Submit review `{cardId, rating: 1-4}` |
| `GET` | `/api/stats` | Get learning statistics |
| `POST` | `/api/sync` | Sync markdown files to database |
| `GET` | `/api/email-preview` | HTML preview of daily email |

## Rating System
- **1 (Again)**: Forgot completely, reset interval
- **2 (Hard)**: Barely remembered, shorter interval
- **3 (Good)**: Remembered well, normal interval
- **4 (Easy)**: Too easy, longer interval

## Daily Email
Emails are sent Mon-Fri at 8:00 AM to felixbecker1111@gmail.com via cron job.

To manually trigger:
```bash
/root/Felix-Home/Coding/vocab/scripts/send-daily-email.sh
```

## Development
```bash
cd /root/Felix-Home/Coding/vocab
npm run dev
# Open http://localhost:3000
```

## Deployment
Push to GitHub triggers automatic redeployment via Coolify webhook.

```bash
git add -A && git commit -m "message" && git push
```

## Coolify App Info
- **Project**: Main Prod (`m408o8osoo4848k8g0ckgwko`)
- **Domain**: vocab.becker.im
- **Build**: Docker
