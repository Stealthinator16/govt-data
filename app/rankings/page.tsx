import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { LeagueTable } from "@/components/league-table/league-table";

export const metadata: Metadata = {
  title: "Overall Rankings",
  description:
    "All 36 Indian states and union territories ranked by overall development score across 30 categories.",
};

interface OverallData {
  year: number;
  rankings: Array<{
    state_id: string;
    score: number;
    rank: number;
    tier: string;
    state_name: string;
    state_type: string;
    region: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function RankingsPage() {
  let data: OverallData | null = null;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), "public/data/overall.json"),
      "utf-8"
    );
    data = JSON.parse(content);
  } catch {}

  const categories = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data/reference/categories.json"), "utf-8")
  ) as Category[];

  const rankings = data?.rankings ?? [];

  return (
    <>
      <h1 className="text-3xl font-bold">Overall Rankings</h1>
      <p className="mt-2 text-muted-foreground">
        All {rankings.length} states and union territories ranked by overall
        development score across 30 categories.
      </p>
      <div className="mt-6 rounded-lg border">
        <LeagueTable rankings={rankings} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Browse by Category</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/rankings/${cat.id}`}
              className="flex flex-col rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-sm">{cat.name}</span>
              {cat.description && (
                <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {cat.description}
                </span>
              )}
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
