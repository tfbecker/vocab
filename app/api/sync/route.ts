import { NextResponse } from "next/server";
import { getAllDecks } from "@/lib/markdown";
import { upsertCard, upsertDeck, getDb } from "@/lib/db";

export async function POST() {
  try {
    // Ensure DB is initialized
    getDb();

    const decks = getAllDecks();
    let synced = 0;

    for (const deck of decks) {
      // Create/update deck in DB with proper metadata
      upsertDeck(
        deck.slug,
        deck.name,
        deck.description,
        deck.language_from,
        deck.language_to
      );

      // Import cards
      for (const card of deck.cards) {
        upsertCard(deck.slug, card.front, card.back, card.notes || null);
        synced++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} cards from ${decks.length} deck(s)`,
      decks: decks.map(d => ({ slug: d.slug, name: d.name, cards: d.cards.length }))
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
