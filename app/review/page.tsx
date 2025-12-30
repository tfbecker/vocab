"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Card from "@/components/Card";
import ReviewButtons from "@/components/ReviewButtons";

interface CardData {
  id: string;
  deck: string;
  front: string;
  back: string;
  notes: string | null;
  state: string;
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const deck = searchParams.get("deck");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : null;
  const isDailyGoal = limit !== null;

  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    loadCards();
  }, [deck, limit]);

  async function loadCards() {
    setLoading(true);
    try {
      const url = deck ? `/api/cards/due?deck=${deck}` : "/api/cards/due";
      const res = await fetch(url);
      const data = await res.json();
      let loadedCards = data.cards || [];

      // Limit cards if daily goal mode
      if (limit && loadedCards.length > limit) {
        loadedCards = loadedCards.slice(0, limit);
      }

      setCards(loadedCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionComplete(false);
      setReviewedCount(0);
    } catch (error) {
      console.error("Failed to load cards:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (!cards[currentIndex] || reviewing) return;

    setReviewing(true);
    try {
      await fetch("/api/cards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: cards[currentIndex].id,
          rating
        })
      });

      setReviewedCount(prev => prev + 1);

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        setSessionComplete(true);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setReviewing(false);
    }
  }, [cards, currentIndex, reviewing]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped && !reviewing) {
        if (e.key === "1") handleRate(1);
        else if (e.key === "2") handleRate(2);
        else if (e.key === "3") handleRate(3);
        else if (e.key === "4") handleRate(4);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleRate, reviewing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Loading cards...</div>
      </div>
    );
  }

  // Session complete celebration
  if (sessionComplete || cards.length === 0) {
    const xpEarned = reviewedCount * 10;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        {/* Celebration animation */}
        <div className="relative mb-6">
          <div className="text-8xl animate-bounce">
            {isDailyGoal ? "🔥" : "🎉"}
          </div>
          {isDailyGoal && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              +{xpEarned} XP
            </div>
          )}
        </div>

        {isDailyGoal ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">Daily Goal Complete!</h1>
            <p className="text-xl text-orange-400 font-semibold mb-2">
              Streak maintained!
            </p>
            <p className="text-slate-400 mb-6">
              You reviewed {reviewedCount} cards and earned {xpEarned} XP
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">All done!</h1>
            <p className="text-slate-400 mb-2">
              {reviewedCount > 0 ? `You reviewed ${reviewedCount} cards` : "No more cards to review right now."}
            </p>
            {reviewedCount > 0 && (
              <p className="text-green-400 font-semibold mb-4">+{xpEarned} XP</p>
            )}
          </>
        )}

        <div className="flex gap-4">
          <a
            href="/"
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Back to Home
          </a>
          {isDailyGoal && (
            <a
              href="/review"
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Continue Reviewing
            </a>
          )}
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{currentIndex + 1} / {cards.length}</span>
          <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <Card
        id={currentCard.id}
        front={currentCard.front}
        back={currentCard.back}
        notes={currentCard.notes}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
      />

      {/* Rating buttons (only show when flipped) */}
      {isFlipped && (
        <ReviewButtons onRate={handleRate} disabled={reviewing} />
      )}

      {/* Hint */}
      {!isFlipped && (
        <p className="text-center text-slate-500 mt-8 text-sm">
          Press Space or click the card to reveal
        </p>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
