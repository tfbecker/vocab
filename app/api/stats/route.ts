import { NextResponse } from "next/server";
import { getStats, getCardCountsByDeck } from "@/lib/db";

export async function GET() {
  try {
    const stats = getStats();
    const deckCounts = getCardCountsByDeck();

    return NextResponse.json({
      ...stats,
      decks: deckCounts
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
