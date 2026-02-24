"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScoreBar } from "@/components/league-table/score-bar";
import { CompareRadar } from "@/components/charts/compare-radar";
import { CATEGORIES } from "@/lib/constants";

interface CompareData {
  year: number;
  states: Array<{ id: string; name: string; type: string }>;
  scores: Record<string, Record<string, number>>;
}

export default function ComparePage() {
  const [data, setData] = useState<CompareData | null>(null);
  const [stateA, setStateA] = useState("");
  const [stateB, setStateB] = useState("");

  useEffect(() => {
    fetch("/data/compare.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const stateAName = data?.states.find((s) => s.id === stateA)?.name ?? "";
  const stateBName = data?.states.find((s) => s.id === stateB)?.name ?? "";

  const catNameMap = new Map<string, string>(CATEGORIES.map((c) => [c.id, c.name]));

  const categories = stateA && stateB && data
    ? Object.keys(data.scores[stateA] ?? {}).map((catId) => ({
        id: catId,
        name: catNameMap.get(catId) ?? catId.replace(/-/g, " "),
        scoreA: data.scores[stateA]?.[catId] ?? 0,
        scoreB: data.scores[stateB]?.[catId] ?? 0,
      }))
    : [];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-bold">Compare States</h1>
          <p className="mt-2 text-muted-foreground">
            Select two states to compare their scores across all categories.
          </p>

          {!data && (
            <p className="mt-8 text-muted-foreground">Loading comparison data...</p>
          )}

          {data && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">State A</label>
                  <select
                    value={stateA}
                    onChange={(e) => setStateA(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a state...</option>
                    {data.states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">State B</label>
                  <select
                    value={stateB}
                    onChange={(e) => setStateB(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a state...</option>
                    {data.states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {stateA && stateB && categories.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">
                    {stateAName} vs {stateBName}
                  </h2>

                  {/* Radar overlay */}
                  <div className="rounded-lg border p-4 mb-6">
                    <CompareRadar
                      categories={categories}
                      nameA={stateAName}
                      nameB={stateBName}
                    />
                  </div>

                  <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="py-3 px-4 text-left">Category</th>
                          <th className="py-3 px-4 text-left">{stateAName}</th>
                          <th className="py-3 px-4 text-left">{stateBName}</th>
                          <th className="py-3 px-4 text-left">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => {
                          const diff = cat.scoreA - cat.scoreB;
                          return (
                            <tr key={cat.id} className="border-b last:border-0">
                              <td className="py-3 px-4 font-medium">
                                {cat.name}
                              </td>
                              <td className="py-3 px-4">
                                <ScoreBar score={cat.scoreA} />
                              </td>
                              <td className="py-3 px-4">
                                <ScoreBar score={cat.scoreB} />
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={
                                    diff > 0
                                      ? "text-emerald-600"
                                      : diff < 0
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                  }
                                >
                                  {diff > 0 ? "+" : ""}
                                  {diff.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
