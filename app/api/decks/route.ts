import { NextResponse } from "next/server";
import { getAllDecksFromDb, getCardCountsByDeck, upsertDeck } from "@/lib/db";

export async function GET() {
  try {
    const decks = getAllDecksFromDb();
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, description, language_from, language_to } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "Missing required fields: slug and name" },
        { status: 400 }
      );
    }

    upsertDeck(slug, name, description, language_from || "en", language_to || "en");

    return NextResponse.json({
      success: true,
      message: `Deck "${name}" created/updated`,
      deck: { slug, name, description, language_from: language_from || "en", language_to: language_to || "en" }
    });
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
