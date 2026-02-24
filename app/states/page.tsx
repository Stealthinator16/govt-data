import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TierBadge } from "@/components/league-table/tier-badge";
import type { Tier } from "@/lib/types";

export const metadata: Metadata = {
  title: "All States & UTs",
  description:
    "Browse all 36 Indian states and union territories grouped by region, with scores and tier rankings.",
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

export default function StatesPage() {
  let data: OverallData | null = null;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), "public/data/overall.json"),
      "utf-8"
    );
    data = JSON.parse(content);
  } catch {}

  const rankings = data?.rankings ?? [];

  // Group by region
  const byRegion: Record<string, typeof rankings> = {};
  for (const r of rankings) {
    const region = r.region || "Other";
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(r);
  }

  const regionOrder = ["North", "South", "East", "West", "Central", "Northeast", "Islands"];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-3xl font-bold">All States & UTs</h1>
          <p className="mt-2 text-muted-foreground">
            {rankings.length} states and union territories across India.
          </p>

          {regionOrder.map((region) => {
            const states = byRegion[region];
            if (!states?.length) return null;
            return (
              <div key={region} className="mt-8">
                <h2 className="text-lg font-semibold mb-3">{region}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {states
                    .sort((a, b) => a.rank - b.rank)
                    .map((s) => (
                      <Link key={s.state_id} href={`/states/${s.state_id}`}>
                        <div className="rounded-lg border p-4 hover:border-foreground/20 hover:bg-muted/50 transition-all">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{s.state_name}</span>
                              {s.state_type === "ut" && (
                                <span className="ml-1.5 text-xs text-muted-foreground">
                                  (UT)
                                </span>
                              )}
                            </div>
                            <TierBadge tier={s.tier as Tier} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Rank #{s.rank}</span>
                            <span>|</span>
                            <span>Score: {s.score.toFixed(1)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
