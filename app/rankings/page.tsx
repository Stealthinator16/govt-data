import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeagueTable } from "@/components/league-table/league-table";

export const metadata: Metadata = {
  title: "Overall Rankings",
  description:
    "All 36 Indian states and union territories ranked by overall development score across 27 categories.",
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

export default function RankingsPage() {
  let data: OverallData | null = null;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), "public/data/overall.json"),
      "utf-8"
    );
    data = JSON.parse(content);
  } catch {}

  const rankings = data?.rankings ?? [];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-bold">Overall Rankings</h1>
          <p className="mt-2 text-muted-foreground">
            All {rankings.length} states and union territories ranked by overall
            development score across 27 categories.
          </p>
          <div className="mt-6 rounded-lg border">
            <LeagueTable rankings={rankings} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
