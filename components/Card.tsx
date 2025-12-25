"use client";

import { useState } from "react";

interface CardProps {
  front: string;
  back: string;
  notes?: string | null;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Card({ front, back, notes, isFlipped, onFlip }: CardProps) {
  return (
    <div
      className="w-full max-w-lg mx-auto cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <div
        className={`relative w-full min-h-[300px] transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-x-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateX(180deg)" : "rotateX(0deg)"
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-3xl font-medium text-center text-white">{front}</p>
          <p className="mt-6 text-slate-400 text-sm">Click or press Space to reveal</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          <p className="text-lg text-slate-400 mb-2">{front}</p>
          <div className="w-16 h-px bg-slate-600 my-4" />
          <p className="text-3xl font-medium text-center text-sky-400">{back}</p>
          {notes && (
            <p className="mt-4 text-sm text-slate-500 italic">{notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
