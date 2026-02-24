"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useChartColors } from "@/lib/use-chart-colors";

interface CompareRadarProps {
  categories: Array<{ id: string; name: string; scoreA: number; scoreB: number }>;
  nameA: string;
  nameB: string;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

function RadarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function CompareRadar({ categories, nameA, nameB }: CompareRadarProps) {
  const { grid, tick } = useChartColors();

  const data = categories
    .filter((c) => c.scoreA > 0 || c.scoreB > 0)
    .map((c) => ({
      name: truncate(c.name, 15),
      fullName: c.name,
      [nameA]: c.scoreA,
      [nameB]: c.scoreB,
    }));

  if (data.length < 3) return null;

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={grid} />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: tick }}
          />
          <Radar
            name={nameA}
            dataKey={nameA}
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
          />
          <Radar
            name={nameB}
            dataKey={nameB}
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.2}
          />
          <Tooltip content={<RadarTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
