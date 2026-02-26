import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Methodology, data sources, and limitations behind the National Premier League state rankings.",
};

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
              <div className="space-y-5 text-muted-foreground">
                <p>
                  Scores are computed in three stages: metric normalization, category aggregation,
                  and overall ranking. The goal is to produce a single comparable score (0–100) for
                  every state across every dimension.
                </p>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Step 1: Metric Normalization
                  </h3>
                  <p>
                    Each metric is normalized to a 0–100 scale using min-max normalization. Before
                    normalizing, values are capped at the 2nd and 98th percentile to prevent extreme
                    outliers (e.g., a tiny UT with an anomalous value) from compressing the scale for
                    all other states.
                  </p>
                  <div className="mt-2 rounded border bg-muted/50 px-3 py-2 font-mono text-xs">
                    <p>capped_value = clamp(value, P2, P98)</p>
                    <p className="mt-1">score = (capped_value − P2) / (P98 − P2) × 100</p>
                    <p className="mt-1 text-muted-foreground">
                      If polarity is negative (lower is better), the score is inverted: score = 100 − score
                    </p>
                  </div>
                  <p className="mt-2">
                    A score of 100 means the state is at or above the 98th percentile (best performer).
                    A score of 0 means it is at or below the 2nd percentile. Metrics need at least 2
                    states with data to be scored.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Step 2: Category Scores
                  </h3>
                  <p>
                    Each category score is a weighted average of all metric scores within that category.
                    Weights range from 0.3x to 1.5x and reflect the relative importance and reliability
                    of each metric.
                  </p>
                  <div className="mt-2 rounded border bg-muted/50 px-3 py-2 font-mono text-xs">
                    <p>category_score = Σ(metric_score × weight) / Σ(weight)</p>
                  </div>
                  <p className="mt-2">
                    For example, in the Health category, IMR and MMR carry 1.5x weight because they are
                    the most critical health outcomes, while non-veg consumption carries 0.3x as a
                    dietary indicator with indirect health relevance. A state is only scored in a
                    category if it has data for at least one metric in that category.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Step 3: Overall Score
                  </h3>
                  <p>
                    The overall score is a weighted average across all categories where the state has
                    data. Categories are weighted by their importance to human development:
                  </p>
                  <div className="mt-2 rounded border bg-muted/50 px-3 py-2 font-mono text-xs">
                    <p>overall_score = Σ(category_score × category_weight) / Σ(category_weight)</p>
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <p><strong className="text-foreground">1.5x</strong> — Economy, Employment, Education, Health</p>
                    <p><strong className="text-foreground">1.2x</strong> — Women &amp; Gender, Children &amp; Youth, Infrastructure, Crime &amp; Justice</p>
                    <p><strong className="text-foreground">1.0x</strong> — Prices, Agriculture, Energy &amp; Environment, Governance, Financial Inclusion, Demographics, Digital &amp; Tech</p>
                    <p><strong className="text-foreground">0.8x</strong> — Elderly, Industry, Transport, Urban Quality, Mental Health</p>
                    <p><strong className="text-foreground">0.7x</strong> — Disability, Telecom</p>
                    <p><strong className="text-foreground">0.5x</strong> — Sports, Culture &amp; Tourism, Media, Migration, Civil Society</p>
                  </div>
                  <p className="mt-2">
                    States are then ranked by overall score and assigned a tier based on their score.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Weight Rationale
                  </h3>
                  <p>
                    Metric weights are assigned based on three factors: (1) how directly the metric
                    measures the category&apos;s core outcome, (2) reliability and coverage of the data
                    source, and (3) policy significance. Core outcome indicators (e.g., GSDP per
                    capita for economy, IMR for health, unemployment rate for employment) receive
                    1.2x–1.5x weight. Supplementary or proxy indicators (e.g., TV ownership for
                    infrastructure, heritage sites for culture) receive 0.3x–0.8x weight. Standard
                    indicators receive 1.0x.
                  </p>
                </div>
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
                  "Data For India (dataforindia.com) — Curated government datasets, CC-BY 4.0",
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
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
