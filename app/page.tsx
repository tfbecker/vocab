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

interface TodayStats {
  reviews_today: number;
  daily_goal: number;
  goal_completed: boolean;
  xp_today: number;
  total_xp: number;
}

interface Stats {
  total_reviews: number;
  streak: number;
  retention: number;
  today?: TodayStats;
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
  const today = stats?.today;
  const dailyGoal = today?.daily_goal || 10;
  const reviewsToday = today?.reviews_today || 0;
  const goalCompleted = today?.goal_completed || false;
  const progressPercent = Math.min((reviewsToday / dailyGoal) * 100, 100);
  const cardsNeededForGoal = Math.max(0, dailyGoal - reviewsToday);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak & XP Header */}
      <div className="flex items-center justify-between">
        <a href="/stats" className="flex items-center gap-3 bg-slate-800 hover:bg-slate-750 rounded-xl px-4 py-3 transition-colors">
          <div className="text-3xl">🔥</div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{stats?.streak || 0}</div>
            <div className="text-xs text-slate-400">day streak</div>
          </div>
        </a>
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
          <div className="text-3xl">⚡</div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{today?.total_xp || 0}</div>
            <div className="text-xs text-slate-400">total XP</div>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl transition-colors disabled:opacity-50"
          title="Sync vocabulary"
        >
          {syncing ? "..." : "🔄"}
        </button>
      </div>

      {/* Daily Goal Card */}
      <div className={`rounded-2xl p-6 ${goalCompleted ? "bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700" : "bg-gradient-to-br from-orange-900/50 to-slate-800 border border-orange-700/50"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Daily Goal</h2>
            <p className="text-sm text-slate-400">
              {goalCompleted ? "Completed! Streak safe" : `${cardsNeededForGoal} more to maintain streak`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{reviewsToday}/{dailyGoal}</div>
            <div className="text-xs text-slate-400">cards today</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${goalCompleted ? "bg-green-500" : "bg-orange-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action buttons */}
        {!goalCompleted && totalDue > 0 ? (
          <a
            href={`/review?limit=${cardsNeededForGoal}`}
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl text-center text-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            Start Daily Goal ({Math.min(cardsNeededForGoal, totalDue)} cards)
          </a>
        ) : goalCompleted ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-semibold py-4">
            <span className="text-2xl">✓</span>
            <span>Goal achieved! +{today?.xp_today || 0} XP earned today</span>
          </div>
        ) : (
          <div className="text-center text-slate-400 py-4">
            No cards due right now
          </div>
        )}
      </div>

      {/* Full Review Option */}
      {totalDue > 0 && (
        <a
          href="/review"
          className="block bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-500 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors"
        >
          Full Review ({totalDue} cards due)
        </a>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-sky-400">{totalDue}</div>
          <div className="text-xs text-slate-400">Due Today</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats?.retention || 0}%</div>
          <div className="text-xs text-slate-400">Retention</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats?.total_reviews || 0}</div>
          <div className="text-xs text-slate-400">All Time</div>
        </div>
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
