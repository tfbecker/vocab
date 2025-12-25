"use client";

interface DeckStats {
  total: number;
  due: number;
  byState: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
}

interface Deck {
  slug: string;
  name: string;
  description: string;
  stats: DeckStats;
}

interface DeckListProps {
  decks: Deck[];
}

export default function DeckList({ decks }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>No decks found.</p>
        <p className="text-sm mt-2">Add vocabulary files to data/decks/</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {decks.map((deck) => (
        <a
          key={deck.slug}
          href={`/review?deck=${deck.slug}`}
          className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-white">{deck.name}</h3>
              {deck.description && (
                <p className="text-slate-400 mt-1">{deck.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-sky-400">{deck.stats.due}</div>
              <div className="text-sm text-slate-400">due today</div>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <span className="text-slate-400">
              <span className="text-green-400">{deck.stats.byState.new}</span> new
            </span>
            <span className="text-slate-400">
              <span className="text-yellow-400">{deck.stats.byState.learning}</span> learning
            </span>
            <span className="text-slate-400">
              <span className="text-blue-400">{deck.stats.byState.review}</span> review
            </span>
            <span className="text-slate-400">
              Total: {deck.stats.total}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
