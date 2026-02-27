"use client";

import dynamic from "next/dynamic";

const CategoryRadar = dynamic(
  () =>
    import("@/components/charts/category-radar").then(
      (mod) => mod.CategoryRadar
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

export function LazyCategoryRadar(
  props: React.ComponentProps<typeof CategoryRadar>
) {
  return <CategoryRadar {...props} />;
}
