"use client";

interface DailyActivity {
  date: string;
  count: number;
}

interface ActivityGridProps {
  activity: DailyActivity[];
}

export default function ActivityGrid({ activity }: ActivityGridProps) {
  // Create a map of date -> count for quick lookup
  const activityMap = new Map(activity.map(a => [a.date, a.count]));

  // Generate last 140 days (20 weeks)
  const days = Array.from({ length: 140 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    const count = activityMap.get(dateStr) || 0;

    // Adjust day of week to start with Monday (0 = Monday, 6 = Sunday)
    let dayOfWeek = date.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return { date, dateStr, count, dayOfWeek };
  });

  // Get intensity level (0-4) based on count
  function getIntensity(count: number): number {
    if (count === 0) return 0;
    if (count <= 5) return 1;
    if (count <= 15) return 2;
    if (count <= 30) return 3;
    return 4;
  }

  const intensityColors = [
    "bg-slate-700", // 0 - no activity
    "bg-sky-900",   // 1 - light
    "bg-sky-700",   // 2 - medium
    "bg-sky-500",   // 3 - high
    "bg-sky-400",   // 4 - very high
  ];

  const weekDays = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Review Activity</h2>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-2 text-xs text-slate-500">
          {weekDays.map((day, i) => (
            <div key={i} className="h-[10px] flex items-center">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-[2px]" style={{ width: "fit-content" }}>
            {days.reverse().map(({ dateStr, count, dayOfWeek, date }) => (
              <div
                key={dateStr}
                className={`w-[10px] h-[10px] rounded-[2px] ${intensityColors[getIntensity(count)]} transition-colors hover:ring-1 hover:ring-slate-400`}
                style={{ gridRow: dayOfWeek + 1 }}
                title={`${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${count} reviews`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-400">
        <span>Less</span>
        {intensityColors.map((color, i) => (
          <div
            key={i}
            className={`w-[10px] h-[10px] rounded-[2px] ${color}`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
