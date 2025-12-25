"use client";

import { useEffect, useState } from "react";

interface Stats {
  total_reviews: number;
  streak: number;
  retention: number;
  by_state: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  decks: Record<string, {
    total: number;
    due: number;
    byState: Record<string, number>;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Loading stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-slate-400">
        No stats available yet. Start reviewing to see your progress!
      </div>
    );
  }

  const totalCards = stats.by_state.new + stats.by_state.learning + stats.by_state.review + stats.by_state.relearning;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Statistics</h1>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white">{stats.total_reviews}</div>
          <div className="text-slate-400 mt-1">Total Reviews</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-orange-400">{stats.streak}</div>
          <div className="text-slate-400 mt-1">🔥 Day Streak</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-green-400">{stats.retention}%</div>
          <div className="text-slate-400 mt-1">Retention Rate</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-sky-400">{totalCards}</div>
          <div className="text-slate-400 mt-1">Total Cards</div>
        </div>
      </div>

      {/* Card States */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Card States</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">🆕 New</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${totalCards ? (stats.by_state.new / totalCards) * 100 : 0}%` }}
                />
              </div>
              <span className="text-white w-8 text-right">{stats.by_state.new}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">📖 Learning</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${totalCards ? (stats.by_state.learning / totalCards) * 100 : 0}%` }}
                />
              </div>
              <span className="text-white w-8 text-right">{stats.by_state.learning}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">🔁 Review</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${totalCards ? (stats.by_state.review / totalCards) * 100 : 0}%` }}
                />
              </div>
              <span className="text-white w-8 text-right">{stats.by_state.review}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">⚠️ Relearning</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${totalCards ? (stats.by_state.relearning / totalCards) * 100 : 0}%` }}
                />
              </div>
              <span className="text-white w-8 text-right">{stats.by_state.relearning}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-400">
        <p>📊 Retention is calculated from the last 30 days of reviews.</p>
        <p className="mt-1">🔥 Streak counts consecutive days with at least one review.</p>
      </div>
    </div>
  );
}
