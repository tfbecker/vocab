import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment, updateCommentStatus, deleteComment, getCardById } from "@/lib/db";

// GET /api/comments - List comments (optionally filtered by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "open" | "completed" | null;

    const comments = getComments(status || undefined);

    return NextResponse.json({
      success: true,
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/comments - Add a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, content } = body;

    if (!cardId || !content) {
      return NextResponse.json(
        { success: false, error: "cardId and content are required" },
        { status: 400 }
      );
    }

    // Verify card exists
    const card = getCardById(cardId);
    if (!card) {
      return NextResponse.json(
        { success: false, error: "Card not found" },
        { status: 404 }
      );
    }

    const comment = addComment(cardId, content);

    return NextResponse.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/comments - Update comment status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "id and status are required" },
        { status: 400 }
      );
    }

    if (status !== "open" && status !== "completed") {
      return NextResponse.json(
        { success: false, error: "status must be 'open' or 'completed'" },
        { status: 400 }
      );
    }

    const success = updateCommentStatus(id, status);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/comments - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const success = deleteComment(parseInt(id, 10));

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
