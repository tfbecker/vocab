import { NextResponse } from "next/server";
import { getAllCards, getDeckBySlug } from "@/lib/db";
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
      // Get deck metadata from DB
      const deckMeta = getDeckBySlug(deckSlug);
      const name = deckMeta?.name || deckSlug;
      const description = deckMeta?.description || "Exported from Vocab App";
      const langFrom = deckMeta?.language_from || "en";
      const langTo = deckMeta?.language_to || "en";

      const lines = [
        "---",
        `name: ${name}`,
        `description: ${description}`,
        `language_from: ${langFrom}`,
        `language_to: ${langTo}`,
        "---",
        "",
        "## Cards",
        "",
        "| front | back | notes |",
        "|-------|------|-------|",
      ];

      for (const card of deckCards) {
        // Escape pipe characters in content
        const front = (card.front || "").replace(/\|/g, "\\|");
        const back = (card.back || "").replace(/\|/g, "\\|");
        const notes = (card.notes || "").replace(/\|/g, "\\|");
        lines.push(`| ${front} | ${back} | ${notes} |`);
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
