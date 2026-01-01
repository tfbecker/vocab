import { NextRequest, NextResponse } from "next/server";
import { updateCardWithVersion, getCardById, generateCardId, getDb, ChangeType } from "@/lib/db";

interface UpdateCardRequest {
  id?: string;
  deck?: string;
  front?: string;
  back?: string;
  notes?: string;
  changeType?: ChangeType;
  changeReason?: string;
  triggeredByCommentId?: number;
}

interface BulkUpdateRequest {
  cards: Array<{
    id?: string;
    deck?: string;
    front?: string;
    back?: string;
    notes?: string;
    changeType?: ChangeType;
    changeReason?: string;
    triggeredByCommentId?: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    getDb(); // Ensure DB is initialized

    const body = await request.json();

    // Handle bulk update
    if (body.cards && Array.isArray(body.cards)) {
      const bulkReq = body as BulkUpdateRequest;
      let updated = 0;
      const errors: string[] = [];

      for (const card of bulkReq.cards) {
        let cardId = card.id;

        // If no ID provided, generate from deck + front
        if (!cardId && card.front) {
          const deck = card.deck || "english-german";
          cardId = generateCardId(deck, card.front);
        }

        if (!cardId) {
          errors.push(`Card missing id or front: ${JSON.stringify(card)}`);
          continue;
        }

        const updates: { back?: string; notes?: string } = {};
        if (card.back !== undefined) updates.back = card.back;
        if (card.notes !== undefined) updates.notes = card.notes;

        if (Object.keys(updates).length > 0) {
          const success = updateCardWithVersion(
            cardId,
            updates,
            card.changeType || 'claude_edit',
            card.changeReason,
            card.triggeredByCommentId
          );
          if (success) {
            updated++;
          } else {
            errors.push(`Card not found: ${cardId} (front: ${card.front})`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updated} card(s)`,
        updated,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // Handle single update
    const { id, deck, front, back, notes, changeType, changeReason, triggeredByCommentId } = body as UpdateCardRequest;

    let cardId = id;
    if (!cardId && front) {
      const deckName = deck || "english-german";
      cardId = generateCardId(deckName, front);
    }

    if (!cardId) {
      return NextResponse.json(
        { error: "Required: id or front" },
        { status: 400 }
      );
    }

    // Verify card exists
    const existingCard = getCardById(cardId);
    if (!existingCard) {
      return NextResponse.json(
        { error: `Card not found: ${cardId}` },
        { status: 404 }
      );
    }

    const updates: { back?: string; notes?: string } = {};
    if (back !== undefined) updates.back = back;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update. Provide back or notes." },
        { status: 400 }
      );
    }

    updateCardWithVersion(
      cardId,
      updates,
      changeType || 'claude_edit',
      changeReason,
      triggeredByCommentId
    );

    return NextResponse.json({
      success: true,
      message: `Updated card "${existingCard.front}"`,
      card: {
        id: cardId,
        front: existingCard.front,
        ...updates
      }
    });
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
