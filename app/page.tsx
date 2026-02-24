import fs from "fs";
import path from "path";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeagueTable } from "@/components/league-table/league-table";
import { CategoryCard } from "@/components/shared/category-card";
import { LazyIndiaMap } from "@/components/map/lazy-india-map";

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

interface CategoryData {
  year: number;
  category: { id: string; name: string };
  rankings: Array<{
    state_id: string;
    score: number;
    rank: number;
    state_name: string;
  }>;
}

function loadJsonFile<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// Categories to show on homepage
const HOMEPAGE_CATEGORIES = [
  "economy",
  "employment",
  "education",
  "health",
];

export default function Home() {
  const overall = loadJsonFile<OverallData>("public/data/overall.json");

  // Load top state per category for cards
  const categoryCards = loadJsonFile<
    Array<{ id: string; name: string; description: string; icon: string; sort_order: number }>
  >("data/reference/categories.json");

  const categoryTopStates: Record<string, { name: string; score: number }> = {};
  if (categoryCards) {
    for (const cat of categoryCards) {
      const catData = loadJsonFile<CategoryData>(`public/data/categories/${cat.id}.json`);
      if (catData?.rankings?.[0]) {
        categoryTopStates[cat.id] = {
          name: catData.rankings[0].state_name,
          score: catData.rankings[0].score,
        };
      }
    }
  }

  const rankings = overall?.rankings ?? [];
  const year = overall?.year ?? 2023;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h1 className="text-4xl font-bold tracking-tight">
              National Premier League
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              Ranking Indian states across every measurable dimension of human life.
              27 categories, 1000+ metrics, 36 states and UTs.
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Data Year: {year}</span>
              <span>|</span>
              <span>{rankings.length} States & UTs ranked</span>
            </div>
          </div>
        </section>

        {/* India Map */}
        <section className="border-b">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <h2 className="text-xl font-semibold mb-4 text-center">State Performance Map</h2>
            <LazyIndiaMap rankings={rankings} />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* League Table */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Overall Rankings</h2>
                <a
                  href="/rankings"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="rounded-lg border">
                <LeagueTable rankings={rankings} limit={15} />
              </div>
              {rankings.length > 15 && (
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Showing top 15 of {rankings.length} states.{" "}
                  <a href="/rankings" className="underline">
                    See full table
                  </a>
                </p>
              )}
            </div>

            {/* Sidebar: Tier Summary + Featured Categories */}
            <div className="space-y-6">
              {/* Tier Summary */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Tier Summary</h3>
                {(["Champion", "Contender", "Rising", "Developing"] as const).map(
                  (tier) => {
                    const count = rankings.filter((r) => r.tier === tier).length;
                    const colors = {
                      Champion: "bg-emerald-500",
                      Contender: "bg-blue-500",
                      Rising: "bg-amber-500",
                      Developing: "bg-red-400",
                    };
                    return (
                      <div key={tier} className="flex items-center gap-2 mb-2">
                        <div className={`h-3 w-3 rounded-full ${colors[tier]}`} />
                        <span className="text-sm flex-1">{tier}</span>
                        <span className="text-sm font-mono tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Category Cards */}
              <div>
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="grid gap-2">
                  {categoryCards?.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      id={cat.id}
                      name={cat.name}
                      description={cat.description}
                      topState={categoryTopStates[cat.id]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
