import { NextResponse } from "next/server";
import { getStats, getCardCountsByDeck, getReviewActivity } from "@/lib/db";

export async function GET() {
  try {
    const stats = getStats();
    const deckCounts = getCardCountsByDeck();
    const activity = getReviewActivity(140); // Last 20 weeks (140 days)

    return NextResponse.json({
      ...stats,
      decks: deckCounts,
      activity
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
