#!/bin/bash

# Vocab Backup Script
# Exports vocab database to markdown and pushes to GitHub

set -e

SCRIPT_DIR="$(dirname "$0")"
VOCAB_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_FILE="$VOCAB_DIR/data/vocab-backup.md"
LOG_FILE="$SCRIPT_DIR/backup.log"
TODAY=$(date +"%Y-%m-%d %H:%M:%S")

log() {
  echo "[$TODAY] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Starting vocab backup..."

# Fetch backup from API
BACKUP_JSON=$(curl -s https://vocab.becker.im/api/backup)

if [ -z "$BACKUP_JSON" ]; then
  log "ERROR: Failed to fetch backup from API"
  exit 1
fi

# Extract markdown content
BACKUP_DATE=$(date +"%Y-%m-%d %H:%M")
MARKDOWN=$(echo "$BACKUP_JSON" | python3 -c "
import sys, json, os
data = json.load(sys.stdin)
md = data.get('markdown', {}).get('english-german', '')
stats = data.get('stats', {})
backup_date = '$BACKUP_DATE'
print(f'# Vocab Backup')
print()
print(f'**Last backup:** {backup_date}')
print()
print(f'**Total cards:** {stats.get(\"total_cards\", 0)}')
print()
print(md)
")

if [ -z "$MARKDOWN" ]; then
  log "ERROR: Failed to parse backup JSON"
  exit 1
fi

# Save to file
echo "$MARKDOWN" > "$BACKUP_FILE"
log "Saved backup to $BACKUP_FILE"

# Git commit and push
cd "$VOCAB_DIR"

# Add the backup file
git add "$BACKUP_FILE"

# Check if there are staged changes
if git diff --cached --quiet 2>/dev/null; then
  log "No changes to backup - skipping commit"
  exit 0
fi
git commit -m "Backup vocab $(date +%Y-%m-%d)"
git push origin main

log "Pushed backup to GitHub successfully"
