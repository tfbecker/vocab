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

## Adding Vocabulary (via API - preferred)

Use the Claude Skill or API directly - no redeploy needed!

### Via Claude Code
Just tell Claude to add vocabulary:
```
"Add these vocab words: accomplish = erreichen, thrive = gedeihen"
```

### Via API
```bash
# Single card
curl -X POST https://vocab.becker.im/api/cards/add \
  -H "Content-Type: application/json" \
  -d '{"front": "accomplish", "back": "erreichen", "notes": "verb"}'

# Bulk add
curl -X POST https://vocab.becker.im/api/cards/add \
  -H "Content-Type: application/json" \
  -d '{"cards": [
    {"front": "accomplish", "back": "erreichen"},
    {"front": "thrive", "back": "gedeihen"}
  ]}'
```

### Via Script
```bash
node ~/.claude/skills/vocab/scripts/add.js "accomplish=erreichen" "thrive=gedeihen"
```

## Backup to GitHub

Export current DB to markdown and push to GitHub:
```bash
node ~/.claude/skills/vocab/scripts/backup.js
```

This preserves both:
- Vocabulary in human-readable markdown format
- Git history of all changes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/decks` | List all decks with stats |
| `GET` | `/api/cards/due` | Get due cards (optional `?deck=slug`) |
| `POST` | `/api/cards/add` | Add cards `{front, back, notes?, deck?}` or `{cards: [...]}` |
| `POST` | `/api/cards/review` | Submit review `{cardId, rating: 1-4}` |
| `GET` | `/api/stats` | Get learning statistics |
| `GET` | `/api/backup` | Export all cards as JSON + markdown |
| `POST` | `/api/sync` | Sync markdown files to database (initial import) |
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

## Coolify Deployment

To deploy via Coolify Web Interface:
1. Go to https://coolify.becker.im
2. Navigate to: Projects → Main Prod → prod environment
3. Click "Add New Resource" → "Public Repository"
4. Enter: `https://github.com/tfbecker/vocab`
5. Select "Dockerfile" as build pack
6. Set domain to: `vocab.becker.im`
7. Set port to: `3000`
8. Click "Save" and deploy

After deployment, run sync to initialize database:
```bash
curl -X POST https://vocab.becker.im/api/sync
```

## Coolify App Info
- **Project**: Main Prod (`m408o8osoo4848k8g0ckgwko`)
- **Domain**: vocab.becker.im
- **Build**: Docker
- **Port**: 3000
