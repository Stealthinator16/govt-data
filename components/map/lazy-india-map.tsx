"use client";

import dynamic from "next/dynamic";

const IndiaMap = dynamic(
  () => import("@/components/map/india-map").then((mod) => mod.IndiaMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Loading map...
      </div>
    ),
  }
);

export function LazyIndiaMap(props: React.ComponentProps<typeof IndiaMap>) {
  return <IndiaMap {...props} />;
}
