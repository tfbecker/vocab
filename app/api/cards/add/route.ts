import { NextRequest, NextResponse } from "next/server";
import { upsertCard, getDb } from "@/lib/db";

interface AddCardRequest {
  deck?: string;
  front: string;
  back: string;
  notes?: string;
}

interface BulkAddRequest {
  deck?: string;
  cards: Array<{ front: string; back: string; notes?: string }>;
}

export async function POST(request: NextRequest) {
  try {
    getDb(); // Ensure DB is initialized

    const body = await request.json();
    const deck = body.deck || "english-german";

    // Handle bulk add
    if (body.cards && Array.isArray(body.cards)) {
      const bulkReq = body as BulkAddRequest;
      let added = 0;

      for (const card of bulkReq.cards) {
        if (card.front && card.back) {
          upsertCard(deck, card.front.trim(), card.back.trim(), card.notes?.trim() || null);
          added++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Added ${added} card(s) to deck "${deck}"`,
        deck,
        count: added
      });
    }

    // Handle single add
    const { front, back, notes } = body as AddCardRequest;

    if (!front || !back) {
      return NextResponse.json(
        { error: "Required: front, back" },
        { status: 400 }
      );
    }

    upsertCard(deck, front.trim(), back.trim(), notes?.trim() || null);

    return NextResponse.json({
      success: true,
      message: `Added "${front}" to deck "${deck}"`,
      card: { deck, front, back, notes }
    });
  } catch (error) {
    console.error("Add card error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
