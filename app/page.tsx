"use client";

import { useEffect, useState } from "react";

interface DeckStats {
  slug: string;
  name: string;
  stats: {
    total: number;
    due: number;
    byState: {
      new: number;
      learning: number;
      review: number;
      relearning: number;
    };
  };
}

interface Stats {
  total_reviews: number;
  streak: number;
  retention: number;
}

export default function Home() {
  const [decks, setDecks] = useState<DeckStats[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [decksRes, statsRes] = await Promise.all([
        fetch("/api/decks"),
        fetch("/api/stats")
      ]);
      const decksData = await decksRes.json();
      const statsData = await statsRes.json();
      setDecks(decksData.decks || []);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }

  const totalDue = decks.reduce((sum, d) => sum + d.stats.due, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-sky-400">{totalDue}</div>
          <div className="text-slate-400 mt-1">Due Today</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-orange-400">{stats?.streak || 0}</div>
          <div className="text-slate-400 mt-1">🔥 Streak</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-green-400">{stats?.retention || 0}%</div>
          <div className="text-slate-400 mt-1">Retention</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        {totalDue > 0 ? (
          <a
            href="/review"
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-colors"
          >
            Start Review ({totalDue} cards)
          </a>
        ) : (
          <div className="flex-1 bg-slate-700 text-slate-400 font-semibold py-4 px-6 rounded-xl text-center text-lg">
            No cards due — come back later!
          </div>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "🔄 Sync"}
        </button>
      </div>

      {/* Decks Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Decks</h2>
        {decks.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400">
            <p>No decks found.</p>
            <p className="text-sm mt-2">Click "Sync" to import vocabulary from markdown files.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => (
              <a
                key={deck.slug}
                href={`/review?deck=${deck.slug}`}
                className="block bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-500 rounded-xl p-4 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-white">{deck.name}</h3>
                    <div className="flex gap-3 text-sm text-slate-400 mt-1">
                      <span><span className="text-green-400">{deck.stats.byState.new}</span> new</span>
                      <span><span className="text-yellow-400">{deck.stats.byState.learning}</span> learning</span>
                      <span><span className="text-blue-400">{deck.stats.byState.review}</span> review</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-sky-400">{deck.stats.due}</div>
                    <div className="text-xs text-slate-400">due</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
