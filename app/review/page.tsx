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

  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadCards();
  }, [deck]);

  async function loadCards() {
    setLoading(true);
    try {
      const url = deck ? `/api/cards/due?deck=${deck}` : "/api/cards/due";
      const res = await fetch(url);
      const data = await res.json();
      setCards(data.cards || []);
      setCurrentIndex(0);
      setIsFlipped(false);
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

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        setCards([]);
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

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-2">All done!</h1>
        <p className="text-slate-400 mb-6">No more cards to review right now.</p>
        <a
          href="/"
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Back to Home
        </a>
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
