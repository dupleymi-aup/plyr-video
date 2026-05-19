"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  activityCount: number;
}

interface ActivityHeatmapProps {
  data: HeatmapCell[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const t = useTranslations("trends");

  const grid = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(`${d.dayOfWeek}-${d.hour}`, d.activityCount);
    }

    const values = Array.from(map.values());
    const maxVal = Math.max(...values, 1);

    return DAYS.map((_, dayIdx) =>
      HOURS.map((hour) => {
        const count = map.get(`${dayIdx}-${hour}`) || 0;
        const intensity = count / maxVal;
        return { dayIdx, hour, count, intensity };
      })
    );
  }, [data]);

  const getColor = (intensity: number): string => {
    if (intensity === 0) return "bg-muted/20";
    if (intensity < 0.2) return "bg-blue-200 dark:bg-blue-900/30";
    if (intensity < 0.4) return "bg-blue-300 dark:bg-blue-800/40";
    if (intensity < 0.6) return "bg-blue-400 dark:bg-blue-700/50";
    if (intensity < 0.8) return "bg-blue-500 dark:bg-blue-600/60";
    return "bg-blue-600 dark:bg-blue-500/70";
  };

  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-12">{t("noData")}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex ml-16 mb-1">
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-center text-xs text-muted-foreground">
              {h % 3 === 0 ? `${h}:00` : ""}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {grid.map((row, dayIdx) => (
          <div key={dayIdx} className="flex items-center mb-0.5">
            <div className="w-16 text-xs text-muted-foreground text-right pr-2">{t(DAYS[dayIdx])}</div>
            <div className="flex flex-1 gap-px">
              {row.map((cell) => (
                <div
                  key={cell.hour}
                  className={`flex-1 aspect-square rounded-sm ${getColor(cell.intensity)}`}
                  title={`${t(DAYS[dayIdx])} ${cell.hour}:00 — ${cell.count} activities`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
