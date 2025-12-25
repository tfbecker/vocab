import { FSRS, Rating, State, createEmptyCard, type Card as FSRSCard, type Grade } from "ts-fsrs";

// Create FSRS instance with default parameters
const fsrs = new FSRS({});

// Map our 1-4 rating to ts-fsrs Rating enum
export function toFsrsRating(rating: 1 | 2 | 3 | 4): Grade {
  switch (rating) {
    case 1: return Rating.Again;
    case 2: return Rating.Hard;
    case 3: return Rating.Good;
    case 4: return Rating.Easy;
  }
}

export { fsrs, Rating, State, createEmptyCard };
export type { FSRSCard, Grade };

export function formatInterval(days: number): string {
  if (days < 1) return "<1d";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

export function stateToString(state: State): string {
  switch (state) {
    case State.New: return "New";
    case State.Learning: return "Learning";
    case State.Review: return "Review";
    case State.Relearning: return "Relearning";
    default: return "Unknown";
  }
}
