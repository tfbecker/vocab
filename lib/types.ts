import { State } from "ts-fsrs";

export interface Card {
  id: string;
  deck: string;
  front: string;
  back: string;
  notes: string | null;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review: Date | null;
  created_at: Date;
}

/** Database row for cards table */
export interface CardRow {
  id: string;
  deck: string;
  front: string;
  back: string;
  notes: string | null;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  created_at: string;
}

/** Database row for decks table */
export interface DeckRow {
  slug: string;
  name: string;
  description: string | null;
  language_from: string;
  language_to: string;
  created_at: string;
}

/** Deck metadata (from database) */
export interface DeckMetadata {
  slug: string;
  name: string;
  description: string;
  language_from: string;
  language_to: string;
}

/** Deck with cards (from markdown import) */
export interface Deck extends DeckMetadata {
  cards: VocabEntry[];
}

export interface VocabEntry {
  front: string;
  back: string;
  notes?: string;
}

export interface DeckStats {
  slug: string;
  name: string;
  total: number;
  new: number;
  learning: number;
  review: number;
  relearning: number;
  due: number;
}

export interface ReviewStats {
  total_reviews: number;
  streak: number;
  retention: number;
  by_state: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
}

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

/** Card state counts */
export interface CardStateCount {
  new: number;
  learning: number;
  review: number;
  relearning: number;
}
