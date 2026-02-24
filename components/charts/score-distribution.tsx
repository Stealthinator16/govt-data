"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useChartColors } from "@/lib/use-chart-colors";

interface ScoreDistributionProps {
  scores: number[]; // normalized scores (0-100)
}

function getTierColor(score: number): string {
  if (score >= 75) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 45) return "#f59e0b";
  return "#f87171";
}

function DistTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { range: string; count: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border bg-popover px-3 py-2 text-sm shadow-md">
      <p>Score {d.range}</p>
      <p className="font-medium">{d.count} states</p>
    </div>
  );
}

export function ScoreDistribution({ scores }: ScoreDistributionProps) {
  const { grid, tick } = useChartColors();

  // Bucket scores into 10-point bins
  const bins = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}`,
    range: `${i * 10}-${i * 10 + 10}`,
    count: 0,
    midpoint: i * 10 + 5,
  }));

  for (const s of scores) {
    const idx = Math.min(Math.floor(s / 10), 9);
    bins[idx].count++;
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={bins} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: tick }} label={{ value: "Score", position: "insideBottomRight", offset: -5, fontSize: 11, fill: tick }} />
          <YAxis tick={{ fontSize: 11, fill: tick }} allowDecimals={false} label={{ value: "States", angle: -90, position: "insideLeft", fontSize: 11, fill: tick }} />
          <Tooltip content={<DistTooltip />} />
          <ReferenceLine x={`${Math.floor(mean / 10) * 10}`} stroke={grid} strokeDasharray="4 4" label={{ value: `Avg ${mean.toFixed(0)}`, position: "top", fontSize: 11, fill: tick }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {bins.map((bin) => (
              <Cell key={bin.label} fill={getTierColor(bin.midpoint)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
