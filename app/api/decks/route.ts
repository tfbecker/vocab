import { NextResponse } from "next/server";
import { getAllDecks } from "@/lib/markdown";
import { getCardCountsByDeck } from "@/lib/db";

export async function GET() {
  try {
    const decks = getAllDecks();
    const counts = getCardCountsByDeck();

    const result = decks.map(deck => ({
      slug: deck.slug,
      name: deck.name,
      description: deck.description,
      language_from: deck.language_from,
      language_to: deck.language_to,
      stats: counts[deck.slug] || { total: 0, due: 0, byState: { new: 0, learning: 0, review: 0, relearning: 0 } }
    }));

    return NextResponse.json({ decks: result });
  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
