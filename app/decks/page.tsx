"use client";

import { useEffect, useState } from "react";
import DeckList from "@/components/DeckList";

interface Deck {
  slug: string;
  name: string;
  description: string;
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

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDecks() {
      try {
        const res = await fetch("/api/decks");
        const data = await res.json();
        setDecks(data.decks || []);
      } catch (error) {
        console.error("Failed to load decks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDecks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400">Loading decks...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Decks</h1>
      <DeckList decks={decks} />
    </div>
  );
}
