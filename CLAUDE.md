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
| `GET` | `/api/stats` | Get learning statistics + activity data |
| `GET` | `/api/backup` | Export all cards as JSON + markdown |
| `POST` | `/api/sync` | Sync markdown files to database (initial import) |
| `GET` | `/api/email-preview` | HTML preview of daily email |
| `POST/GET` | `/api/send-email` | Send daily email (used by cron) |
| `GET` | `/api/comments` | Get comments (optional `?status=open\|completed`) |
| `POST` | `/api/comments` | Add comment `{cardId, content}` |
| `PATCH` | `/api/comments` | Update status `{id, status: 'open'\|'completed'}` |
| `DELETE` | `/api/comments?id=N` | Delete comment |

## Card Comments System

Users can add feedback/comments to cards while reviewing. Comments are saved in the database and can be processed via Claude Code.

### Workflow for processing comments:
1. Get open comments: `curl https://vocab.becker.im/api/comments?status=open`
2. Update card content based on feedback
3. Mark comment as completed: `curl -X PATCH https://vocab.becker.im/api/comments -d '{"id": 1, "status": "completed"}'`

### Example: Process all open comments
```bash
# Get all open comments (returns card info + comment content)
curl -s https://vocab.becker.im/api/comments?status=open | jq '.comments[] | {id, card_front, content}'
```

## Rating System
- **1 (Again)**: Forgot completely, reset interval
- **2 (Hard)**: Barely remembered, shorter interval
- **3 (Good)**: Remembered well, normal interval
- **4 (Easy)**: Too easy, longer interval

## Daily Email
Emails are sent Mon-Fri at 8:00 AM to fe.becker@holzlandbecker.de via Docker cron sidecar.

**Architecture:**
- `cron` container runs Alpine with crond
- Calls `http://vocab:3000/api/send-email` at 8:00 AM weekdays
- SMTP credentials passed via environment variables

**To manually trigger:**
```bash
curl -X POST https://vocab.becker.im/api/send-email
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
- **App UUID**: `zgskwcoc4oggsogkc0gg8kk8`
- **Domain**: vocab.becker.im
- **Build**: Docker Compose
- **Port**: 3000

## Persistent Storage (WICHTIG!)

Die SQLite-Datenbank muss persistent sein, sonst gehen Daten bei Redeploy verloren!

**Konfiguration via Coolify Web-UI:**
1. Öffne https://coolify.becker.im
2. Gehe zu: Projects → Main Prod → prod → Vocab App
3. Klicke auf **Storages** Tab
4. Klicke **+ Add** → **Volume**
5. Konfiguriere:
   - **Name**: `vocab-data`
   - **Destination Path**: `/app/data`
6. Speichern und Redeploy

**Docs:** https://coolify.io/docs/knowledge-base/persistent-storage

## IMPORTANT: Deployment Verification

**After pushing code changes, ALWAYS verify the deployment worked:**

1. **Trigger deployment** (if not auto-deployed):
   ```bash
   node ~/.claude/skills/coolify/scripts/deploy.js --deploy zgskwcoc4oggsogkc0gg8kk8
   ```

2. **Wait for deployment** (typically 60-90 seconds for this app)

3. **Verify via API test**:
   ```bash
   # Test a new/modified endpoint
   curl -s https://vocab.becker.im/api/stats | jq 'keys'

   # Or test specific feature
   curl -s https://vocab.becker.im/api/comments?status=open
   ```

4. **Check container logs if issues**:
   ```bash
   sg docker -c "docker logs app-zgskwcoc4oggsogkc0gg8kk8-* --tail 50"
   ```

**Never assume deployment succeeded just because git push worked. Always test the live site.**
