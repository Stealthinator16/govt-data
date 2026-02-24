"use client";

import { useEffect, useState } from "react";

interface ChartColors {
  grid: string;
  tick: string;
}

const LIGHT_DEFAULTS: ChartColors = { grid: "#e5e7eb", tick: "#6b7280" };

function resolve(): ChartColors {
  if (typeof window === "undefined") return LIGHT_DEFAULTS;
  const style = getComputedStyle(document.documentElement);
  const border = style.getPropertyValue("--border").trim();
  const muted = style.getPropertyValue("--muted-foreground").trim();
  // CSS variables may be in oklch/hsl — wrap in color() if needed, but
  // Recharts accepts any CSS color string including oklch().
  if (!border && !muted) return LIGHT_DEFAULTS;
  return {
    grid: border ? `oklch(${border})` : LIGHT_DEFAULTS.grid,
    tick: muted ? `oklch(${muted})` : LIGHT_DEFAULTS.tick,
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(LIGHT_DEFAULTS);

  useEffect(() => {
    setColors(resolve());
  }, []);

  return colors;
}
