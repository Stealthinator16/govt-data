"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MetricRanking {
  state_id: string;
  state_name: string;
  state_type: string;
  raw_value: number;
  norm_score: number;
  rank: number;
}

interface MetricBarChartProps {
  rankings: MetricRanking[];
  unit: string;
}

function getTierColor(score: number): string {
  if (score >= 75) return "#10b981"; // emerald-500
  if (score >= 60) return "#3b82f6"; // blue-500
  if (score >= 45) return "#f59e0b"; // amber-500
  return "#f87171"; // red-400
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MetricRanking }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{d.state_name}</p>
      <p className="text-muted-foreground">
        Rank #{d.rank} &middot; Score {d.norm_score.toFixed(1)}
      </p>
      <p className="font-mono tabular-nums">{d.raw_value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export function MetricBarChart({ rankings, unit }: MetricBarChartProps) {
  // Sort by rank (best first)
  const data = [...rankings].sort((a, b) => a.rank - b.rank);

  // Chart height scales with number of states
  const chartHeight = Math.max(400, data.length * 28);

  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            label={{ value: unit, position: "insideBottomRight", offset: -5, fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="state_name"
            width={160}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="raw_value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry) => (
              <Cell key={entry.state_id} fill={getTierColor(entry.norm_score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
