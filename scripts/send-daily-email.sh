#!/bin/bash

# Vocab Daily Email Sender
# Sends spaced repetition reminder email with due cards

set -e

SCRIPT_DIR="$(dirname "$0")"
LOG_FILE="$SCRIPT_DIR/email.log"
TODAY=$(date +"%Y-%m-%d")
WEEKDAY=$(date +%u)

# Only send on weekdays (1=Mon, 5=Fri)
if [ "$WEEKDAY" -gt 5 ]; then
  echo "[$TODAY $(date +%H:%M:%S)] Skipping - weekend" >> "$LOG_FILE"
  exit 0
fi

echo "[$TODAY $(date +%H:%M:%S)] Starting daily vocab email..." >> "$LOG_FILE"

# Get the email preview HTML
BODY=$(curl -s https://vocab.becker.im/api/email-preview)

if [ -z "$BODY" ]; then
  echo "[$TODAY $(date +%H:%M:%S)] ERROR: Failed to fetch email preview" >> "$LOG_FILE"
  exit 1
fi

# Get due count for subject
DUE_COUNT=$(curl -s https://vocab.becker.im/api/cards/due | python3 -c "import sys, json; print(json.load(sys.stdin).get('total', 0))")

# Only send if there are cards due
if [ "$DUE_COUNT" -eq 0 ]; then
  echo "[$TODAY $(date +%H:%M:%S)] No cards due - skipping email" >> "$LOG_FILE"
  exit 0
fi

SUBJECT="📚 Vocab Review - $DUE_COUNT Karten heute"

# Send email using the email skill
python3 ~/.claude/skills/email/scripts/send.py \
  --body "$BODY" \
  --subject "$SUBJECT" \
  --to "felixbecker1111@gmail.com"

echo "[$TODAY $(date +%H:%M:%S)] Email sent successfully ($DUE_COUNT cards due)" >> "$LOG_FILE"
