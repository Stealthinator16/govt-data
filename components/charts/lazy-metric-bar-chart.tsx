"use client";

import dynamic from "next/dynamic";

const MetricBarChart = dynamic(
  () =>
    import("@/components/charts/metric-bar-chart").then(
      (mod) => mod.MetricBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Loading chart...
      </div>
    ),
  }
);

export function LazyMetricBarChart(
  props: React.ComponentProps<typeof MetricBarChart>
) {
  return <MetricBarChart {...props} />;
}
