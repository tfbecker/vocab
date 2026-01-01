import { NextRequest, NextResponse } from "next/server";
import { getCardList, getAllDecksFromDb, getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    getDb(); // Ensure DB is initialized

    const { searchParams } = new URL(request.url);
    const deck = searchParams.get("deck") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sortBy = (searchParams.get("sortBy") as "created" | "due" | "front") || "created";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const result = getCardList({
      deck,
      search,
      page,
      limit: Math.min(limit, 100), // Cap at 100
      sortBy,
      sortOrder
    });

    // Also get list of decks for filtering
    const decks = getAllDecksFromDb();

    return NextResponse.json({
      ...result,
      decks: decks.map(d => ({ slug: d.slug, name: d.name }))
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
