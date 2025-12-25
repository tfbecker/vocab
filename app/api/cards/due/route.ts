import { NextRequest, NextResponse } from "next/server";
import { getDueCards } from "@/lib/db";
import { stateToString } from "@/lib/fsrs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deck = searchParams.get("deck") || undefined;

    const cards = getDueCards(deck);

    return NextResponse.json({
      total: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        deck: card.deck,
        front: card.front,
        back: card.back,
        notes: card.notes,
        state: stateToString(card.state),
        reps: card.reps,
        due: card.due.toISOString()
      }))
    });
  } catch (error) {
    console.error("Error fetching due cards:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
