"use client";

import dynamic from "next/dynamic";

const ScoreDistribution = dynamic(
  () =>
    import("@/components/charts/score-distribution").then(
      (mod) => mod.ScoreDistribution
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

export function LazyScoreDistribution(
  props: React.ComponentProps<typeof ScoreDistribution>
) {
  return <ScoreDistribution {...props} />;
}
