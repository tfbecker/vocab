#!/bin/bash

# Setup cron job for daily vocab emails
# Run this script once to install the cron job

SCRIPT_PATH="/root/Felix-Home/Coding/vocab/scripts/send-daily-email.sh"
CRON_JOB="0 8 * * 1-5 $SCRIPT_PATH"

# Make the email script executable
chmod +x "$SCRIPT_PATH"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "send-daily-email.sh"; then
  echo "Cron job already exists"
  crontab -l | grep "send-daily-email.sh"
else
  # Add the cron job
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "Cron job installed successfully:"
  echo "$CRON_JOB"
  echo ""
  echo "This will send vocab reminder emails at 8:00 AM on weekdays (Mon-Fri)"
fi
