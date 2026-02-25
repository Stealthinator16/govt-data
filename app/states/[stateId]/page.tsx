import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TierBadge } from "@/components/league-table/tier-badge";
import { ScoreBar } from "@/components/league-table/score-bar";
import { CategoryRadar } from "@/components/charts/category-radar";
import type { Metadata } from "next";
import type { Tier } from "@/lib/types";

interface StateData {
  year: number;
  state: {
    id: string;
    name: string;
    type: string;
    region: string;
    population: number;
    area_sq_km: number;
  };
  overall: { score: number; rank: number; tier: string } | null;
  categories: Array<{
    category_id: string;
    score: number;
    rank: number;
    metrics_count: number;
    category_name: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateId: string }>;
}): Promise<Metadata> {
  const { stateId } = await params;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), `public/data/states/${stateId}.json`),
      "utf-8"
    );
    const data = JSON.parse(content) as StateData;
    const desc = data.overall
      ? `${data.state.name} ranks #${data.overall.rank} with a score of ${data.overall.score.toFixed(1)} across 27 categories.`
      : `State profile for ${data.state.name}.`;
    return {
      title: data.state.name,
      description: desc,
      openGraph: { title: data.state.name, description: desc },
    };
  } catch {
    return { title: "State Profile" };
  }
}

export function generateStaticParams() {
  try {
    const states = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data/reference/states.json"),
        "utf-8"
      )
    ) as Array<{ id: string }>;
    return states.map((s) => ({ stateId: s.id }));
  } catch {
    return [];
  }
}

export default async function StateProfilePage({
  params,
}: {
  params: Promise<{ stateId: string }>;
}) {
  const { stateId } = await params;

  let data: StateData | null = null;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), `public/data/states/${stateId}.json`),
      "utf-8"
    );
    data = JSON.parse(content);
  } catch {
    notFound();
  }

  if (!data) notFound();

  const { state, overall, categories } = data;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-2">
            <a
              href="/states"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← All States
            </a>
          </div>

          {/* State Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{state.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{state.type === "ut" ? "Union Territory" : "State"}</span>
                <span>|</span>
                <span>{state.region}</span>
                <span>|</span>
                <span>
                  Pop: {(state.population / 1e7).toFixed(1)} Cr
                </span>
              </div>
            </div>
            {overall && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold tabular-nums">
                    {overall.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rank #{overall.rank}
                  </div>
                </div>
                <TierBadge tier={overall.tier as Tier} />
              </div>
            )}
          </div>

          {/* Radar Chart */}
          {overall && categories.filter((c) => c.score > 0).length >= 3 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Performance Radar</h2>
              <div className="rounded-lg border p-4">
                <CategoryRadar
                  categories={categories.map((c) => ({
                    category_name: c.category_name,
                    score: c.score,
                    rank: c.rank,
                  }))}
                  tierColor={
                    overall.tier === "Champion" ? "#10b981"
                    : overall.tier === "Contender" ? "#3b82f6"
                    : overall.tier === "Rising" ? "#f59e0b"
                    : "#f87171"
                  }
                />
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
            <div className="grid gap-3">
              {categories.map((cat) => (
                <a
                  key={cat.category_id}
                  href={`/rankings/${cat.category_id}`}
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {cat.category_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Rank #{cat.rank} | {cat.metrics_count} metrics
                    </div>
                  </div>
                  <ScoreBar score={cat.score} />
                </a>
              ))}
            </div>
          </div>

          {/* Source attribution */}
          {overall && (
            <p className="mt-6 text-xs text-muted-foreground">
              Data aggregated from multiple government sources.{" "}
              <a href="/about#sources" className="underline hover:text-foreground">
                See individual metrics for specific citations.
              </a>
            </p>
          )}

          {!overall && (
            <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No scores available for this state yet.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
