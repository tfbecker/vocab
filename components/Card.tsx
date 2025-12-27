"use client";

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
      className="w-full max-w-lg mx-auto cursor-pointer"
      onClick={onFlip}
    >
      <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
        {!isFlipped ? (
          <>
            <p className="text-3xl font-medium text-center text-white">{front}</p>
            <p className="mt-6 text-slate-400 text-sm">Click or press Space to reveal</p>
          </>
        ) : (
          <>
            <p className="text-lg text-slate-400 mb-2">{front}</p>
            <div className="w-16 h-px bg-slate-600 my-4" />
            <p className="text-3xl font-medium text-center text-sky-400">{back}</p>
            {notes && (
              <p className="mt-4 text-sm text-slate-500 italic text-center">{notes}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
