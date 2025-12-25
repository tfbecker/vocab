import Database from "better-sqlite3";
import path from "path";
import { State, createEmptyCard } from "ts-fsrs";
import type { Card, ReviewStats } from "./types";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "vocab.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb();
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      deck TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      notes TEXT,
      due TEXT NOT NULL,
      stability REAL NOT NULL DEFAULT 0,
      difficulty REAL NOT NULL DEFAULT 0,
      elapsed_days INTEGER NOT NULL DEFAULT 0,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      state INTEGER NOT NULL DEFAULT 0,
      last_review TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due);
    CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck);
    CREATE INDEX IF NOT EXISTS idx_cards_state ON cards(state);

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(reviewed_at);
  `);
}

export function generateCardId(deck: string, front: string): string {
  return crypto.createHash("md5").update(`${deck}:${front}`).digest("hex").slice(0, 12);
}

export function upsertCard(deck: string, front: string, back: string, notes: string | null): void {
  const database = getDb();
  const id = generateCardId(deck, front);
  const emptyCard = createEmptyCard();

  database.prepare(`
    INSERT INTO cards (id, deck, front, back, notes, due, stability, difficulty, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      back = excluded.back,
      notes = excluded.notes
  `).run(
    id,
    deck,
    front,
    back,
    notes,
    emptyCard.due.toISOString(),
    emptyCard.stability,
    emptyCard.difficulty,
    emptyCard.state
  );
}

export function getCardById(id: string): Card | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM cards WHERE id = ?").get(id) as any;
  if (!row) return null;
  return rowToCard(row);
}

export function getDueCards(deckSlug?: string): Card[] {
  const database = getDb();
  const now = new Date().toISOString();

  let query = "SELECT * FROM cards WHERE due <= ?";
  const params: any[] = [now];

  if (deckSlug) {
    query += " AND deck = ?";
    params.push(deckSlug);
  }

  query += " ORDER BY due ASC";

  const rows = database.prepare(query).all(...params) as any[];
  return rows.map(rowToCard);
}

export function getAllCards(deckSlug?: string): Card[] {
  const database = getDb();

  let query = "SELECT * FROM cards";
  const params: any[] = [];

  if (deckSlug) {
    query += " WHERE deck = ?";
    params.push(deckSlug);
  }

  query += " ORDER BY created_at DESC";

  const rows = database.prepare(query).all(...params) as any[];
  return rows.map(rowToCard);
}

export function updateCardAfterReview(
  id: string,
  due: Date,
  stability: number,
  difficulty: number,
  elapsed_days: number,
  scheduled_days: number,
  reps: number,
  lapses: number,
  state: State,
  rating: number
): void {
  const database = getDb();

  database.prepare(`
    UPDATE cards SET
      due = ?,
      stability = ?,
      difficulty = ?,
      elapsed_days = ?,
      scheduled_days = ?,
      reps = ?,
      lapses = ?,
      state = ?,
      last_review = datetime('now')
    WHERE id = ?
  `).run(
    due.toISOString(),
    stability,
    difficulty,
    elapsed_days,
    scheduled_days,
    reps,
    lapses,
    state,
    id
  );

  database.prepare(`
    INSERT INTO reviews (card_id, rating) VALUES (?, ?)
  `).run(id, rating);
}

export function getStats(): ReviewStats {
  const database = getDb();

  const totalReviews = database.prepare("SELECT COUNT(*) as count FROM reviews").get() as any;

  const byState = database.prepare(`
    SELECT state, COUNT(*) as count FROM cards GROUP BY state
  `).all() as any[];

  const stateMap = { new: 0, learning: 0, review: 0, relearning: 0 };
  for (const row of byState) {
    switch (row.state) {
      case State.New: stateMap.new = row.count; break;
      case State.Learning: stateMap.learning = row.count; break;
      case State.Review: stateMap.review = row.count; break;
      case State.Relearning: stateMap.relearning = row.count; break;
    }
  }

  // Calculate streak (consecutive days with reviews)
  const recentReviews = database.prepare(`
    SELECT DATE(reviewed_at) as date
    FROM reviews
    GROUP BY DATE(reviewed_at)
    ORDER BY date DESC
    LIMIT 30
  `).all() as any[];

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;

  for (const row of recentReviews) {
    if (row.date === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  // Calculate retention (% of reviews rated Good or Easy)
  const retentionQuery = database.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as passed
    FROM reviews
    WHERE reviewed_at >= datetime('now', '-30 days')
  `).get() as any;

  const retention = retentionQuery.total > 0
    ? Math.round((retentionQuery.passed / retentionQuery.total) * 100)
    : 0;

  return {
    total_reviews: totalReviews.count,
    streak,
    retention,
    by_state: stateMap
  };
}

export function getCardCountsByDeck(): Record<string, { total: number; due: number; byState: Record<string, number> }> {
  const database = getDb();
  const now = new Date().toISOString();

  const counts = database.prepare(`
    SELECT
      deck,
      COUNT(*) as total,
      SUM(CASE WHEN due <= ? THEN 1 ELSE 0 END) as due,
      SUM(CASE WHEN state = 0 THEN 1 ELSE 0 END) as new,
      SUM(CASE WHEN state = 1 THEN 1 ELSE 0 END) as learning,
      SUM(CASE WHEN state = 2 THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN state = 3 THEN 1 ELSE 0 END) as relearning
    FROM cards
    GROUP BY deck
  `).all(now) as any[];

  const result: Record<string, { total: number; due: number; byState: Record<string, number> }> = {};

  for (const row of counts) {
    result[row.deck] = {
      total: row.total,
      due: row.due,
      byState: {
        new: row.new,
        learning: row.learning,
        review: row.review,
        relearning: row.relearning
      }
    };
  }

  return result;
}

function rowToCard(row: any): Card {
  return {
    id: row.id,
    deck: row.deck,
    front: row.front,
    back: row.back,
    notes: row.notes,
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : null,
    created_at: new Date(row.created_at)
  };
}
