import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://npl.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE_URL}/rankings`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/states`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/compare`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Category pages
  try {
    const categories = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/reference/categories.json"), "utf-8")
    ) as Array<{ id: string }>;
    for (const c of categories) {
      entries.push({
        url: `${BASE_URL}/rankings/${c.id}`,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch {}

  // State pages
  try {
    const states = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/reference/states.json"), "utf-8")
    ) as Array<{ id: string }>;
    for (const s of states) {
      entries.push({
        url: `${BASE_URL}/states/${s.id}`,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch {}

  // Metric pages
  try {
    const metrics = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/reference/metrics.json"), "utf-8")
    ) as Array<{ id: string }>;
    for (const m of metrics) {
      entries.push({
        url: `${BASE_URL}/metrics/${m.id}`,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {}

  return entries;
}
