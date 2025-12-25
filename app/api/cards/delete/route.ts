import { NextRequest, NextResponse } from "next/server";
import { deleteAllCards } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deck = searchParams.get("deck");

    const deleted = deleteAllCards(deck || undefined);

    return NextResponse.json({
      success: true,
      message: deck
        ? `Deleted ${deleted} card(s) from deck "${deck}"`
        : `Deleted ${deleted} card(s) from all decks`,
      deleted
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete cards" },
      { status: 500 }
    );
  }
}
