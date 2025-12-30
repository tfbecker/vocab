#!/bin/bash

# Vocab Backup Script
# Exports ALL vocab decks to markdown and pushes to GitHub

set -e

SCRIPT_DIR="$(dirname "$0")"
VOCAB_DIR="$(dirname "$SCRIPT_DIR")"
DECKS_DIR="$VOCAB_DIR/data/decks"
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

# Create decks directory if needed
mkdir -p "$DECKS_DIR"

# Export all decks to markdown files using Python
echo "$BACKUP_JSON" | python3 -c "
import json
import os
import sys

data = json.load(sys.stdin)
decks_dir = '$DECKS_DIR'

markdown_decks = data.get('markdown', {})
stats = data.get('stats', {})

for deck_slug, markdown_content in markdown_decks.items():
    filepath = os.path.join(decks_dir, f'{deck_slug}.md')
    with open(filepath, 'w') as f:
        f.write(markdown_content)
    print(f'Exported {deck_slug} to {filepath}')

print(f'')
print(f'Total cards: {stats.get(\"total_cards\", 0)}')
print(f'Decks exported: {len(markdown_decks)}')
for deck_info in stats.get('decks', []):
    print(f'  - {deck_info[\"slug\"]}: {deck_info[\"count\"]} cards')
"

log "Saved all deck backups to $DECKS_DIR"

# Git commit and push
cd "$VOCAB_DIR"

# Add all deck files
git add "$DECKS_DIR"/*.md

# Check if there are staged changes
if git diff --cached --quiet 2>/dev/null; then
  log "No changes to backup - skipping commit"
  exit 0
fi

git commit -m "Backup vocab $(date +%Y-%m-%d)"
git push origin main

log "Pushed backup to GitHub successfully"
