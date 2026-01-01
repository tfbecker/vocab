import { NextRequest, NextResponse } from "next/server";
import { getCardVersions, getCardById, getDb } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    getDb(); // Ensure DB is initialized
    const { id } = await params;

    const card = getCardById(id);
    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    const versions = getCardVersions(id);

    return NextResponse.json({
      card_id: id,
      versions
    });
  } catch (error) {
    console.error("Error fetching card history:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
