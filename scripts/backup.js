#!/usr/bin/env node

/**
 * Vocab Backup Script
 * Exports all vocab decks to markdown files and pushes to GitHub
 *
 * Usage: node scripts/backup.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const API_URL = 'https://vocab.becker.im';
const DECKS_DIR = path.join(__dirname, '..', 'data', 'decks');
const LOG_FILE = path.join(__dirname, 'backup.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logLine + '\n');
}

function git(...args) {
  return execFileSync('git', args, { stdio: 'pipe', encoding: 'utf8' });
}

async function main() {
  try {
    log('Starting vocab backup...');

    // Fetch backup from API
    const response = await fetch(`${API_URL}/api/backup`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Backup API returned unsuccessful response');
    }

    // Ensure decks directory exists
    fs.mkdirSync(DECKS_DIR, { recursive: true });

    // Write each deck to a markdown file
    const decks = data.markdown || {};
    let deckCount = 0;
    const deckFiles = [];

    for (const [slug, content] of Object.entries(decks)) {
      const filePath = path.join(DECKS_DIR, `${slug}.md`);
      fs.writeFileSync(filePath, content);
      deckFiles.push(filePath);
      log(`Exported ${slug} to ${filePath}`);
      deckCount++;
    }

    // Print summary
    const stats = data.stats || {};
    log(`\nTotal cards: ${stats.total_cards || 0}`);
    log(`Decks exported: ${deckCount}`);
    for (const deck of stats.decks || []) {
      log(`  - ${deck.slug}: ${deck.count} cards`);
    }

    // Git commit and push
    const vocabDir = path.join(__dirname, '..');
    process.chdir(vocabDir);

    // Add all deck files individually
    for (const file of deckFiles) {
      git('add', file);
    }

    // Check if there are staged changes
    try {
      git('diff', '--cached', '--quiet');
      log('No changes to backup - skipping commit');
      return;
    } catch {
      // Changes exist, continue with commit
    }

    // Commit and push
    const today = new Date().toISOString().split('T')[0];
    git('commit', '-m', `Backup vocab ${today}`);
    git('push', 'origin', 'main');

    log('Pushed backup to GitHub successfully');

  } catch (error) {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

main();
