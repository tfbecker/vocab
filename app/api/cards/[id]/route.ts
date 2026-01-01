import { NextRequest, NextResponse } from "next/server";
import { getCardWithMeta, updateCardWithVersion, deleteCardById, getCommentsForCard, getDb, ChangeType } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single card with metadata
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    getDb(); // Ensure DB is initialized
    const { id } = await params;

    const card = getCardWithMeta(id);
    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    const comments = getCommentsForCard(id);

    return NextResponse.json({
      card,
      comments
    });
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - update card with version tracking
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    getDb(); // Ensure DB is initialized
    const { id } = await params;
    const body = await request.json();

    const existingCard = getCardWithMeta(id);
    if (!existingCard) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    const updates: { back?: string; notes?: string } = {};
    if (body.back !== undefined) updates.back = body.back;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update. Provide back or notes." },
        { status: 400 }
      );
    }

    // Extract version tracking info
    const changeType: ChangeType = body.changeType || 'user_edit';
    const changeReason: string | undefined = body.changeReason;
    const triggeredByCommentId: number | undefined = body.triggeredByCommentId;

    const success = updateCardWithVersion(
      id,
      updates,
      changeType,
      changeReason,
      triggeredByCommentId
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update card" },
        { status: 500 }
      );
    }

    const updatedCard = getCardWithMeta(id);

    return NextResponse.json({
      success: true,
      card: updatedCard
    });
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    getDb(); // Ensure DB is initialized
    const { id } = await params;

    const existingCard = getCardWithMeta(id);
    if (!existingCard) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    const success = deleteCardById(id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete card" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted card "${existingCard.front}"`
    });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
