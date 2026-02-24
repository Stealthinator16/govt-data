import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MetricBarChart } from "@/components/charts/metric-bar-chart";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { formatNumber } from "@/lib/format";
import { getTier, TIER_CONFIG } from "@/lib/constants";
import type { Metadata } from "next";
import type { Tier } from "@/lib/types";

interface MetricData {
  year: number;
  metric: {
    id: string;
    name: string;
    unit: string;
    source: string;
    polarity: string;
    category_id: string;
    category_name: string;
    weight: number;
  };
  rankings: Array<{
    state_id: string;
    state_name: string;
    state_type: string;
    raw_value: number;
    norm_score: number;
    rank: number;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metricId: string }>;
}): Promise<Metadata> {
  const { metricId } = await params;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), `public/data/metrics/${metricId}.json`),
      "utf-8"
    );
    const data = JSON.parse(content) as MetricData;
    const desc = `${data.metric.name} (${data.metric.unit}) — Source: ${data.metric.source}. ${data.metric.polarity === "positive" ? "Higher is better" : "Lower is better"}.`;
    return {
      title: data.metric.name,
      description: desc,
      openGraph: { title: data.metric.name, description: desc },
    };
  } catch {
    return { title: "Metric" };
  }
}

export function generateStaticParams() {
  try {
    const metrics = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data/reference/metrics.json"),
        "utf-8"
      )
    ) as Array<{ id: string }>;
    return metrics.map((m) => ({ metricId: m.id }));
  } catch {
    return [];
  }
}

export default async function MetricPage({
  params,
}: {
  params: Promise<{ metricId: string }>;
}) {
  const { metricId } = await params;

  let data: MetricData | null = null;
  try {
    const content = fs.readFileSync(
      path.join(process.cwd(), `public/data/metrics/${metricId}.json`),
      "utf-8"
    );
    data = JSON.parse(content);
  } catch {
    notFound();
  }

  if (!data) notFound();

  const { metric, rankings } = data;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Back link */}
          <div className="mb-2">
            <a
              href={`/rankings/${metric.category_id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; {metric.category_name}
            </a>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold">{metric.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5">{metric.unit}</span>
            <span>Source: {metric.source}</span>
            <span>
              {metric.polarity === "positive" ? "Higher is better" : "Lower is better"}
            </span>
            <span>Weight: {metric.weight}x</span>
          </div>

          {/* Bar chart */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-4">
              State Rankings — {metric.name}
            </h2>
            <div className="rounded-lg border p-4 overflow-x-auto">
              <MetricBarChart rankings={rankings} unit={metric.unit} />
            </div>
          </section>

          {/* Score distribution */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Score Distribution</h2>
            <div className="rounded-lg border p-4">
              <ScoreDistribution
                scores={rankings.map((r) => r.norm_score)}
              />
            </div>
          </section>

          {/* Data table */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Full Rankings</h2>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-3 px-2 text-left w-12">#</th>
                    <th className="py-3 px-2 text-left">State / UT</th>
                    <th className="py-3 px-2 text-right">Value</th>
                    <th className="py-3 px-2 text-left">Score</th>
                    <th className="py-3 px-2 text-left">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => {
                    const tier = getTier(r.norm_score);
                    return (
                      <tr
                        key={r.state_id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-mono text-muted-foreground tabular-nums">
                          {r.rank}
                        </td>
                        <td className="py-3 px-2">
                          <a
                            href={`/states/${r.state_id}`}
                            className="font-medium hover:underline"
                          >
                            {r.state_name}
                          </a>
                          {r.state_type === "ut" && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              (UT)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">
                          {formatNumber(r.raw_value, metric.unit)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`font-mono tabular-nums ${TIER_CONFIG[tier].color}`}
                          >
                            {r.norm_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].color}`}
                          >
                            {tier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
