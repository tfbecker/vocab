import { NextResponse } from "next/server";
import { getAllCards } from "@/lib/db";
import { State } from "ts-fsrs";

export async function GET() {
  try {
    const cards = getAllCards();

    // Group by deck
    const decks: Record<string, typeof cards> = {};
    for (const card of cards) {
      if (!decks[card.deck]) decks[card.deck] = [];
      decks[card.deck].push(card);
    }

    // Generate markdown for each deck
    const markdown: Record<string, string> = {};

    for (const [deckSlug, deckCards] of Object.entries(decks)) {
      const lines = [
        "---",
        `name: ${deckSlug}`,
        `description: Exported from Vocab App`,
        "language_from: en",
        "language_to: de",
        "---",
        "",
        "## Vokabeln",
        "",
        "| front | back | notes |",
        "|-------|------|-------|",
      ];

      for (const card of deckCards) {
        const notes = card.notes || "";
        lines.push(`| ${card.front} | ${card.back} | ${notes} |`);
      }

      markdown[deckSlug] = lines.join("\n");
    }

    // Generate stats summary
    const stats = {
      total_cards: cards.length,
      by_state: {
        new: cards.filter(c => c.state === State.New).length,
        learning: cards.filter(c => c.state === State.Learning).length,
        review: cards.filter(c => c.state === State.Review).length,
        relearning: cards.filter(c => c.state === State.Relearning).length,
      },
      decks: Object.entries(decks).map(([slug, cards]) => ({
        slug,
        count: cards.length
      }))
    };

    return NextResponse.json({
      success: true,
      stats,
      markdown,
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
