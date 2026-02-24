import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeagueTable } from "@/components/league-table/league-table";

interface CategoryData {
  year: number;
  category: { id: string; name: string };
  rankings: Array<{
    state_id: string;
    score: number;
    rank: number;
    metrics_count: number;
    state_name: string;
    state_type: string;
  }>;
  metrics?: Array<{
    id: string;
    name: string;
    unit: string;
    polarity: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), `public/data/categories/${categoryId}.json`),
      "utf-8"
    );
    const data = JSON.parse(content) as CategoryData;
    const desc = `${data.rankings.length} states ranked by ${data.category.name.toLowerCase()} metrics.`;
    return {
      title: `${data.category.name} Rankings`,
      description: desc,
      openGraph: { title: `${data.category.name} Rankings`, description: desc },
    };
  } catch {
    return { title: "Category Rankings" };
  }
}

// Pre-render all category pages
export function generateStaticParams() {
  try {
    const categories = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data/reference/categories.json"),
        "utf-8"
      )
    ) as Array<{ id: string }>;
    return categories.map((c) => ({ categoryId: c.id }));
  } catch {
    return [];
  }
}

export default async function CategoryRankingsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  let data: CategoryData | null = null;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), `public/data/categories/${categoryId}.json`),
      "utf-8"
    );
    data = JSON.parse(content);
  } catch {
    notFound();
  }

  if (!data) notFound();

  // Add tier info for display
  const rankings = data.rankings.map((r) => ({
    ...r,
    tier:
      r.score >= 75
        ? "Champion"
        : r.score >= 60
          ? "Contender"
          : r.score >= 45
            ? "Rising"
            : "Developing",
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-2">
            <a
              href="/rankings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← All Rankings
            </a>
          </div>
          <h1 className="text-3xl font-bold">{data.category.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {rankings.length} states ranked by {data.category.name.toLowerCase()} metrics.
          </p>
          <div className="mt-6 rounded-lg border">
            <LeagueTable rankings={rankings} />
          </div>

          {data.metrics && data.metrics.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Metrics in this category</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.metrics.map((m) => (
                  <a
                    key={m.id}
                    href={`/metrics/${m.id}`}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.unit}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
