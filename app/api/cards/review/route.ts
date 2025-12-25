import { NextRequest, NextResponse } from "next/server";
import { getCardById, updateCardAfterReview } from "@/lib/db";
import { fsrs, formatInterval, stateToString, createEmptyCard, toFsrsRating } from "@/lib/fsrs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, rating } = body as { cardId: string; rating: 1 | 2 | 3 | 4 };

    if (!cardId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json(
        { error: "Invalid request. Required: cardId, rating (1-4)" },
        { status: 400 }
      );
    }

    const card = getCardById(cardId);
    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    // Convert DB card to FSRS card using createEmptyCard and override values
    const fsrsCard = {
      ...createEmptyCard(),
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.last_review || undefined
    };

    // Calculate next review
    const now = new Date();
    const fsrsRating = toFsrsRating(rating);
    const result = fsrs.next(fsrsCard, now, fsrsRating);
    const nextCard = result.card;

    // Calculate interval in days
    const intervalMs = nextCard.due.getTime() - now.getTime();
    const intervalDays = Math.ceil(intervalMs / (1000 * 60 * 60 * 24));

    // Update database
    updateCardAfterReview(
      cardId,
      nextCard.due,
      nextCard.stability,
      nextCard.difficulty,
      nextCard.elapsed_days,
      nextCard.scheduled_days,
      nextCard.reps,
      nextCard.lapses,
      nextCard.state,
      rating
    );

    return NextResponse.json({
      success: true,
      cardId,
      rating,
      nextDue: nextCard.due.toISOString(),
      interval: formatInterval(intervalDays),
      state: stateToString(nextCard.state)
    });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
