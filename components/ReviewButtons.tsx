"use client";

interface ReviewButtonsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}

const buttons = [
  { rating: 1 as const, label: "Again", shortcut: "1", color: "bg-red-500 hover:bg-red-600", interval: "<1d" },
  { rating: 2 as const, label: "Hard", shortcut: "2", color: "bg-orange-500 hover:bg-orange-600", interval: "1d" },
  { rating: 3 as const, label: "Good", shortcut: "3", color: "bg-green-500 hover:bg-green-600", interval: "3d" },
  { rating: 4 as const, label: "Easy", shortcut: "4", color: "bg-blue-500 hover:bg-blue-600", interval: "7d" },
];

export default function ReviewButtons({ onRate, disabled }: ReviewButtonsProps) {
  return (
    <div className="flex gap-3 justify-center mt-8">
      {buttons.map(({ rating, label, shortcut, color, interval }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className={`${color} text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center min-w-[80px]`}
        >
          <span>{label}</span>
          <span className="text-xs opacity-75 mt-1">{interval}</span>
          <span className="text-xs opacity-50 mt-1">({shortcut})</span>
        </button>
      ))}
    </div>
  );
}
