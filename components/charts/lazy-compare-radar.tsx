"use client";

import dynamic from "next/dynamic";

const CompareRadar = dynamic(
  () =>
    import("@/components/charts/compare-radar").then(
      (mod) => mod.CompareRadar
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

export function LazyCompareRadar(
  props: React.ComponentProps<typeof CompareRadar>
) {
  return <CompareRadar {...props} />;
}
