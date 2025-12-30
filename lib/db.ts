import Database from "better-sqlite3";
import path from "path";
import { State, createEmptyCard } from "ts-fsrs";
import type { Card, CardRow, DeckRow, DeckMetadata, ReviewStats, CardStateCount } from "./types";
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

  // Create cards table
  database.prepare(`
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
    )
  `).run();

  database.prepare("CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due)").run();
  database.prepare("CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck)").run();
  database.prepare("CREATE INDEX IF NOT EXISTS idx_cards_state ON cards(state)").run();

  // Create reviews table
  database.prepare(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `).run();

  database.prepare("CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(reviewed_at)").run();

  // Create decks table
  database.prepare(`
    CREATE TABLE IF NOT EXISTS decks (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      language_from TEXT NOT NULL DEFAULT 'en',
      language_to TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // Create card_comments table for feedback on cards
  database.prepare(`
    CREATE TABLE IF NOT EXISTS card_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `).run();

  database.prepare("CREATE INDEX IF NOT EXISTS idx_comments_card ON card_comments(card_id)").run();
  database.prepare("CREATE INDEX IF NOT EXISTS idx_comments_status ON card_comments(status)").run();
}

export function generateCardId(deck: string, front: string): string {
  return crypto.createHash("md5").update(`${deck}:${front}`).digest("hex").slice(0, 12);
}

// Deck functions
export function upsertDeck(
  slug: string,
  name: string,
  description?: string,
  language_from: string = "en",
  language_to: string = "en"
): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO decks (slug, name, description, language_from, language_to)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      language_from = excluded.language_from,
      language_to = excluded.language_to
  `).run(slug, name, description || null, language_from, language_to);
}

export function getDeckBySlug(slug: string): DeckMetadata | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM decks WHERE slug = ?").get(slug) as DeckRow | undefined;
  if (!row) return null;
  return {
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    language_from: row.language_from,
    language_to: row.language_to,
  };
}

export function getAllDecksFromDb(): DeckMetadata[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM decks ORDER BY created_at DESC").all() as DeckRow[];
  return rows.map(row => ({
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    language_from: row.language_from,
    language_to: row.language_to,
  }));
}

export function ensureDeckExists(slug: string): void {
  const existing = getDeckBySlug(slug);
  if (!existing) {
    // Auto-create deck with slug as name
    const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    upsertDeck(slug, name, `Auto-created deck: ${name}`);
  }
}

export function deleteDeck(slug: string): number {
  const database = getDb();
  // Delete cards first
  database.prepare("DELETE FROM cards WHERE deck = ?").run(slug);
  // Delete deck
  const result = database.prepare("DELETE FROM decks WHERE slug = ?").run(slug);
  return result.changes;
}

// Card functions
export function upsertCard(deck: string, front: string, back: string, notes: string | null): void {
  const database = getDb();
  const id = generateCardId(deck, front);
  const emptyCard = createEmptyCard();

  // Ensure deck exists
  ensureDeckExists(deck);

  database.prepare(`
    INSERT INTO cards (id, deck, front, back, notes, due, stability, difficulty, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET back = excluded.back, notes = excluded.notes
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
  const row = database.prepare("SELECT * FROM cards WHERE id = ?").get(id) as CardRow | undefined;
  if (!row) return null;
  return rowToCard(row);
}

export function getDueCards(deckSlug?: string): Card[] {
  const database = getDb();
  const now = new Date().toISOString();

  let query = "SELECT * FROM cards WHERE due <= ?";
  const params: (string | number)[] = [now];

  if (deckSlug) {
    query += " AND deck = ?";
    params.push(deckSlug);
  }

  query += " ORDER BY due ASC";

  const rows = database.prepare(query).all(...params) as CardRow[];
  return rows.map(rowToCard);
}

export function getAllCards(deckSlug?: string): Card[] {
  const database = getDb();

  let query = "SELECT * FROM cards";
  const params: string[] = [];

  if (deckSlug) {
    query += " WHERE deck = ?";
    params.push(deckSlug);
  }

  query += " ORDER BY created_at DESC";

  const rows = database.prepare(query).all(...params) as CardRow[];
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

interface CountRow { count: number }
interface StateCountRow { state: number; count: number }
interface DateRow { date: string }
interface RetentionRow { total: number; passed: number }

export function getStats(): ReviewStats {
  const database = getDb();

  const totalReviews = database.prepare("SELECT COUNT(*) as count FROM reviews").get() as CountRow;

  const byState = database.prepare(`
    SELECT state, COUNT(*) as count FROM cards GROUP BY state
  `).all() as StateCountRow[];

  const stateMap: CardStateCount = { new: 0, learning: 0, review: 0, relearning: 0 };
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
  `).all() as DateRow[];

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
  `).get() as RetentionRow;

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

interface DeckCountRow {
  deck: string;
  total: number;
  due: number;
  new: number;
  learning: number;
  review: number;
  relearning: number;
}

export function getCardCountsByDeck(): Record<string, { total: number; due: number; byState: CardStateCount }> {
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
  `).all(now) as DeckCountRow[];

  const result: Record<string, { total: number; due: number; byState: CardStateCount }> = {};

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

export function updateCardNotes(id: string, notes: string | null): boolean {
  const database = getDb();
  const result = database.prepare(`
    UPDATE cards SET notes = ? WHERE id = ?
  `).run(notes, id);
  return result.changes > 0;
}

export function updateCardById(id: string, updates: { back?: string; notes?: string }): boolean {
  const database = getDb();
  const setClauses: string[] = [];
  const params: (string | null)[] = [];

  if (updates.back !== undefined) {
    setClauses.push("back = ?");
    params.push(updates.back);
  }
  if (updates.notes !== undefined) {
    setClauses.push("notes = ?");
    params.push(updates.notes ?? null);
  }

  if (setClauses.length === 0) return false;

  params.push(id);
  const result = database.prepare(`
    UPDATE cards SET ${setClauses.join(", ")} WHERE id = ?
  `).run(...params);
  return result.changes > 0;
}

export function deleteAllCards(deckSlug?: string): number {
  const database = getDb();

  if (deckSlug) {
    const result = database.prepare("DELETE FROM cards WHERE deck = ?").run(deckSlug);
    return result.changes;
  } else {
    const result = database.prepare("DELETE FROM cards").run();
    database.prepare("DELETE FROM reviews").run();
    return result.changes;
  }
}

function rowToCard(row: CardRow): Card {
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

// Activity tracking for streak visualization
interface DailyActivity {
  date: string;
  count: number;
}

export function getReviewActivity(days: number = 140): DailyActivity[] {
  const database = getDb();

  const activity = database.prepare(`
    SELECT DATE(reviewed_at) as date, COUNT(*) as count
    FROM reviews
    WHERE reviewed_at >= datetime('now', '-${days} days')
    GROUP BY DATE(reviewed_at)
    ORDER BY date DESC
  `).all() as DailyActivity[];

  return activity;
}

// Comment management
export interface CardComment {
  id: number;
  card_id: string;
  content: string;
  status: 'open' | 'completed';
  created_at: string;
  completed_at: string | null;
  // Joined card data
  card_front?: string;
  card_back?: string;
  card_deck?: string;
}

interface CommentRow {
  id: number;
  card_id: string;
  content: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  card_front?: string;
  card_back?: string;
  card_deck?: string;
}

export function addComment(cardId: string, content: string): CardComment {
  const database = getDb();

  const result = database.prepare(`
    INSERT INTO card_comments (card_id, content)
    VALUES (?, ?)
  `).run(cardId, content);

  return {
    id: result.lastInsertRowid as number,
    card_id: cardId,
    content,
    status: 'open',
    created_at: new Date().toISOString(),
    completed_at: null
  };
}

export function getComments(status?: 'open' | 'completed'): CardComment[] {
  const database = getDb();

  let query = `
    SELECT cc.*, c.front as card_front, c.back as card_back, c.deck as card_deck
    FROM card_comments cc
    LEFT JOIN cards c ON cc.card_id = c.id
  `;

  if (status) {
    query += ` WHERE cc.status = ?`;
  }

  query += ` ORDER BY cc.created_at DESC`;

  const rows = status
    ? database.prepare(query).all(status) as CommentRow[]
    : database.prepare(query).all() as CommentRow[];

  return rows.map(row => ({
    id: row.id,
    card_id: row.card_id,
    content: row.content,
    status: row.status as 'open' | 'completed',
    created_at: row.created_at,
    completed_at: row.completed_at,
    card_front: row.card_front,
    card_back: row.card_back,
    card_deck: row.card_deck
  }));
}

export function getCommentsForCard(cardId: string): CardComment[] {
  const database = getDb();

  const rows = database.prepare(`
    SELECT * FROM card_comments
    WHERE card_id = ?
    ORDER BY created_at DESC
  `).all(cardId) as CommentRow[];

  return rows.map(row => ({
    id: row.id,
    card_id: row.card_id,
    content: row.content,
    status: row.status as 'open' | 'completed',
    created_at: row.created_at,
    completed_at: row.completed_at
  }));
}

export function updateCommentStatus(id: number, status: 'open' | 'completed'): boolean {
  const database = getDb();

  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  const result = database.prepare(`
    UPDATE card_comments
    SET status = ?, completed_at = ?
    WHERE id = ?
  `).run(status, completedAt, id);

  return result.changes > 0;
}

export function deleteComment(id: number): boolean {
  const database = getDb();

  const result = database.prepare(`
    DELETE FROM card_comments WHERE id = ?
  `).run(id);

  return result.changes > 0;
}
