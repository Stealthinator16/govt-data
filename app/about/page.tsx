import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-3xl font-bold">About</h1>

          <div className="mt-8 space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">What is the National Premier League?</h2>
              <p className="text-muted-foreground">
                The National Premier League (NPL) ranks and compares all 36 Indian states and
                union territories across 27 categories and 1000+ metrics of human development
                and governance. Think of it as a Premier League table for states — making
                lagging states visible, celebrating leading ones, and driving public awareness
                through data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Methodology</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Normalization:</strong> Each metric is
                  normalized to a 0-100 scale using min-max normalization. Values are capped at
                  the 2nd and 98th percentile to handle outliers. A score of 100 means best
                  performance; 0 means worst.
                </p>
                <p>
                  <strong className="text-foreground">Polarity:</strong> Metrics where higher
                  values are better (e.g., literacy rate) use positive polarity. Metrics where
                  lower values are better (e.g., infant mortality) use negative polarity, so the
                  scale is inverted.
                </p>
                <p>
                  <strong className="text-foreground">Category Scores:</strong> Weighted average
                  of all metric scores within the category. Weights reflect relative importance
                  (e.g., IMR weighted higher than hospital beds).
                </p>
                <p>
                  <strong className="text-foreground">Overall Score:</strong> Equal-weight
                  average across all 27 categories. This ensures no single domain dominates.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Tiers</h2>
              <div className="grid gap-2">
                {[
                  { tier: "Champion", range: "75-100", color: "bg-emerald-500", desc: "Top-performing states with strong outcomes across most metrics" },
                  { tier: "Contender", range: "60-74", color: "bg-blue-500", desc: "Above-average states steadily improving" },
                  { tier: "Rising", range: "45-59", color: "bg-amber-500", desc: "States making progress but with significant gaps" },
                  { tier: "Developing", range: "0-44", color: "bg-red-400", desc: "States needing focused attention and investment" },
                ].map((t) => (
                  <div key={t.tier} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className={`mt-0.5 h-3 w-3 rounded-full ${t.color}`} />
                    <div>
                      <div className="font-medium">
                        {t.tier}{" "}
                        <span className="text-muted-foreground font-normal">({t.range})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="sources">
              <h2 className="text-xl font-semibold mb-3">Data Sources</h2>
              <div className="text-muted-foreground space-y-1">
                {[
                  "Ministry of Statistics (MoSPI) — National Accounts, PLFS, CPI, IIP, ASI",
                  "National Family Health Survey (NFHS) — Health, Nutrition, Women, Children",
                  "Census of India / SRS — Demographics, Literacy, Mortality",
                  "National Crime Records Bureau (NCRB) — Crime, Police, Prisons",
                  "UDISE+ / AISHE — School and Higher Education",
                  "Reserve Bank of India (RBI) — Banking, Finance, State Budgets",
                  "TRAI — Telecom and Internet",
                  "Ministry of Road Transport — Roads, Vehicles",
                  "Central Electricity Authority — Power, Renewables",
                  "NITI Aayog — SDG Index, Multidimensional Poverty Index",
                ].map((source) => (
                  <p key={source}>• {source}</p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitations</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  • Data availability varies across states and metrics. Small UTs may have fewer
                  data points.
                </p>
                <p>
                  • Data is typically 1-2 years old due to publication lag by government agencies.
                </p>
                <p>
                  • Rankings simplify complex realities. Use them as a starting point for deeper
                  analysis, not as definitive judgments.
                </p>
                <p>
                  • Currently showing sample data during development. Real data integration is
                  in progress.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
