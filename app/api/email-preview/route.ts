import { NextResponse } from "next/server";
import { getDueCards, getStats } from "@/lib/db";
import { generateEmailHTML } from "@/lib/email";

export async function GET() {
  try {
    const dueCards = getDueCards();
    const stats = getStats();
    const html = generateEmailHTML({ dueCards, stats });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error("Error generating email preview:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
