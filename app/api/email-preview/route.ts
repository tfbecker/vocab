import { NextResponse } from "next/server";
import { getDueCards, getStats } from "@/lib/db";
import { stateToString } from "@/lib/fsrs";
import { State } from "ts-fsrs";

export async function GET() {
  try {
    const dueCards = getDueCards();
    const stats = getStats();

    // Group cards by state
    const byState = {
      new: dueCards.filter(c => c.state === State.New).length,
      learning: dueCards.filter(c => c.state === State.Learning).length,
      review: dueCards.filter(c => c.state === State.Review).length,
      relearning: dueCards.filter(c => c.state === State.Relearning).length
    };

    // Get preview cards (first 5)
    const previewCards = dueCards.slice(0, 5);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 24px; }
    .section { background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .section-title { font-weight: bold; margin-bottom: 12px; color: #38bdf8; }
    .stat-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .stat-label { color: #94a3b8; }
    .preview-item { padding: 8px 0; border-bottom: 1px solid #334155; }
    .preview-item:last-child { border-bottom: none; }
    .preview-front { font-weight: 500; }
    .preview-arrow { color: #94a3b8; margin: 0 8px; }
    .cta { display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .footer { margin-top: 24px; color: #64748b; font-size: 14px; }
    .streak { color: #f97316; }
    .retention { color: #22c55e; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 Vocab Review</h1>

    <div class="section">
      <div class="section-title">📊 LERNFORTSCHRITT</div>
      <div class="stat-row">
        <span class="stat-label">🆕 Neu:</span>
        <span>${byState.new} Karten</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">📖 Learning:</span>
        <span>${byState.learning} Karten</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🔁 Review:</span>
        <span>${byState.review} Karten</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">⚠️ Relearning:</span>
        <span>${byState.relearning} Karten</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📝 HEUTIGE VORSCHAU (${previewCards.length} von ${dueCards.length})</div>
      ${previewCards.map((card, i) => `
        <div class="preview-item">
          <span class="preview-front">${i + 1}. ${card.front}</span>
          <span class="preview-arrow">→</span>
          <span>???</span>
        </div>
      `).join("")}
    </div>

    <a href="https://vocab.becker.im/review" class="cta">Jetzt reviewen →</a>

    <div class="footer">
      <span class="streak">🔥 Streak: ${stats.streak} Tag${stats.streak !== 1 ? "e" : ""}</span>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span class="retention">📈 Retention: ${stats.retention}%</span>
    </div>
  </div>
</body>
</html>
`;

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
