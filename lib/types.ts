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

export interface Deck {
  slug: string;
  name: string;
  description: string;
  language_from: string;
  language_to: string;
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
