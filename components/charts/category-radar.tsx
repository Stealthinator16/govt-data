"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useChartColors } from "@/lib/use-chart-colors";

interface CategoryEntry {
  category_name: string;
  score: number;
  rank: number;
}

interface CategoryRadarProps {
  categories: CategoryEntry[];
  tierColor: string; // hex color
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { fullName: string; score: number; rank: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{d.fullName}</p>
      <p className="text-muted-foreground">
        Score: {d.score.toFixed(1)} &middot; Rank #{d.rank}
      </p>
    </div>
  );
}

export function CategoryRadar({ categories, tierColor }: CategoryRadarProps) {
  const { grid, tick } = useChartColors();

  const data = categories
    .filter((c) => c.score > 0)
    .map((c) => ({
      name: truncate(c.category_name, 15),
      fullName: c.category_name,
      score: c.score,
      rank: c.rank,
    }));

  if (data.length < 3) return null;

  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke={grid} />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: tick }}
          />
          <Radar
            dataKey="score"
            stroke={tierColor}
            fill={tierColor}
            fillOpacity={0.3}
          />
          <Tooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
