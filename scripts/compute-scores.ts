/**
 * Scoring Engine
 *
 * Reads data_points from SQLite, computes normalized scores per metric,
 * aggregates into category scores and overall scores, then writes results
 * back to the scoring tables.
 */
import Database from "better-sqlite3";
import path from "path";
import { capOutliers, normalize, weightedAverage } from "../lib/scoring";
import { getTier } from "../lib/constants";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");

function main() {
  console.log("=== Computing Scores ===\n");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Pick the year with the most metric coverage (not just max year)
  const yearRow = db
    .prepare(
      `SELECT year, COUNT(DISTINCT metric_id) as metric_count
       FROM data_points
       GROUP BY year
       ORDER BY metric_count DESC, year DESC
       LIMIT 1`
    )
    .get() as { year: number; metric_count: number } | null;

  if (!yearRow) {
    console.log("No data found in data_points. Run ingestion first.");
    db.close();
    return;
  }

  const year = yearRow.year;
  console.log(`Computing scores for year: ${year}\n`);

  // Clear existing scores for this year
  db.prepare("DELETE FROM metric_scores WHERE year = ?").run(year);
  db.prepare("DELETE FROM category_scores WHERE year = ?").run(year);
  db.prepare("DELETE FROM overall_scores WHERE year = ?").run(year);

  // Get all metrics that have data
  const metrics = db
    .prepare(
      `SELECT DISTINCT m.id, m.category_id, m.polarity, m.weight
       FROM metrics m
       JOIN data_points dp ON dp.metric_id = m.id
       WHERE dp.year = ?`
    )
    .all(year) as Array<{
    id: string;
    category_id: string;
    polarity: "positive" | "negative";
    weight: number;
  }>;

  console.log(`Found ${metrics.length} metrics with data\n`);

  // ─── Step 1: Compute metric scores ───
  console.log("Step 1: Computing metric scores...");

  const insertMetricScore = db.prepare(`
    INSERT INTO metric_scores (metric_id, state_id, year, raw_value, norm_score, rank)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Track per-state, per-category metric scores for aggregation
  const stateMetricScores: Record<string, Record<string, { score: number; weight: number }[]>> = {};

  for (const metric of metrics) {
    // Get one value per state for this metric.
    // Prefer rows with null disaggregation fields; fall back to "Combined"/"Person" aggregates.
    // Use GROUP BY to deduplicate, picking MIN(value) as a stable tiebreaker.
    const dataPoints = db
      .prepare(
        `SELECT state_id, value FROM (
           SELECT state_id, value,
             ROW_NUMBER() OVER (
               PARTITION BY state_id
               ORDER BY
                 CASE WHEN gender IS NULL AND sector IS NULL AND age_group IS NULL AND social_group IS NULL THEN 0 ELSE 1 END,
                 ROWID DESC
             ) AS rn
           FROM data_points
           WHERE metric_id = ? AND year = ?
         ) WHERE rn = 1
         ORDER BY state_id`
      )
      .all(metric.id, year) as Array<{ state_id: string; value: number }>;

    if (dataPoints.length < 2) continue; // Need at least 2 states to rank

    const values = dataPoints.map((dp) => dp.value);
    const { capped, min, max } = capOutliers(values);

    // Compute scores and ranks
    const scored = dataPoints.map((dp, i) => ({
      stateId: dp.state_id,
      rawValue: dp.value,
      score: normalize(capped[i], min, max, metric.polarity),
    }));

    // Sort by score descending for ranking
    scored.sort((a, b) => b.score - a.score);

    const insertBatch = db.transaction(() => {
      scored.forEach((s, idx) => {
        const rank = idx + 1;
        insertMetricScore.run(metric.id, s.stateId, year, s.rawValue, s.score, rank);

        // Accumulate for category aggregation
        if (!stateMetricScores[s.stateId]) stateMetricScores[s.stateId] = {};
        if (!stateMetricScores[s.stateId][metric.category_id]) {
          stateMetricScores[s.stateId][metric.category_id] = [];
        }
        stateMetricScores[s.stateId][metric.category_id].push({
          score: s.score,
          weight: metric.weight,
        });
      });
    });
    insertBatch();
  }

  console.log("  Done.\n");

  // ─── Step 2: Compute category scores ───
  console.log("Step 2: Computing category scores...");

  const insertCategoryScore = db.prepare(`
    INSERT INTO category_scores (category_id, state_id, year, score, rank, metrics_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const categories = db
    .prepare("SELECT id FROM categories ORDER BY sort_order")
    .all() as Array<{ id: string }>;

  // Track per-state overall scores
  const stateCategoryScores: Record<string, { score: number; categoryId: string }[]> = {};

  for (const cat of categories) {
    const categoryStateScores: Array<{
      stateId: string;
      score: number;
      metricsCount: number;
    }> = [];

    for (const [stateId, catScores] of Object.entries(stateMetricScores)) {
      const metricScores = catScores[cat.id];
      if (!metricScores || metricScores.length === 0) continue;

      const score = weightedAverage(metricScores);
      categoryStateScores.push({
        stateId,
        score,
        metricsCount: metricScores.length,
      });
    }

    // Sort by score descending
    categoryStateScores.sort((a, b) => b.score - a.score);

    const insertBatch = db.transaction(() => {
      categoryStateScores.forEach((s, idx) => {
        const rank = idx + 1;
        insertCategoryScore.run(cat.id, s.stateId, year, s.score, rank, s.metricsCount);

        if (!stateCategoryScores[s.stateId]) stateCategoryScores[s.stateId] = [];
        stateCategoryScores[s.stateId].push({ score: s.score, categoryId: cat.id });
      });
    });
    insertBatch();
  }

  console.log("  Done.\n");

  // ─── Step 3: Compute overall scores ───
  console.log("Step 3: Computing overall scores...");

  const insertOverallScore = db.prepare(`
    INSERT INTO overall_scores (state_id, year, score, rank, tier)
    VALUES (?, ?, ?, ?, ?)
  `);

  const overallScores: Array<{ stateId: string; score: number }> = [];

  for (const [stateId, catScores] of Object.entries(stateCategoryScores)) {
    if (catScores.length === 0) continue;
    // Equal weight across categories
    const avg =
      catScores.reduce((sum, c) => sum + c.score, 0) / catScores.length;
    const score = Math.round(avg * 100) / 100;
    overallScores.push({ stateId, score });
  }

  overallScores.sort((a, b) => b.score - a.score);

  const insertOverallBatch = db.transaction(() => {
    overallScores.forEach((s, idx) => {
      const rank = idx + 1;
      const tier = getTier(s.score);
      insertOverallScore.run(s.stateId, year, s.score, rank, tier);
    });
  });
  insertOverallBatch();

  console.log("  Done.\n");

  // Summary
  const metricScoreCount = db
    .prepare("SELECT COUNT(*) as count FROM metric_scores WHERE year = ?")
    .get(year) as { count: number };
  const catScoreCount = db
    .prepare("SELECT COUNT(*) as count FROM category_scores WHERE year = ?")
    .get(year) as { count: number };
  const overallCount = db
    .prepare("SELECT COUNT(*) as count FROM overall_scores WHERE year = ?")
    .get(year) as { count: number };

  console.log("=== Scoring Complete ===");
  console.log(`  Metric scores:   ${metricScoreCount.count}`);
  console.log(`  Category scores: ${catScoreCount.count}`);
  console.log(`  Overall scores:  ${overallCount.count}`);

  // Show top 5
  const top5 = db
    .prepare(
      `SELECT o.rank, s.name, o.score, o.tier
       FROM overall_scores o JOIN states s ON s.id = o.state_id
       WHERE o.year = ? ORDER BY o.rank LIMIT 5`
    )
    .all(year) as Array<{ rank: number; name: string; score: number; tier: string }>;

  if (top5.length > 0) {
    console.log("\nTop 5:");
    for (const s of top5) {
      console.log(`  #${s.rank} ${s.name}: ${s.score.toFixed(1)} (${s.tier})`);
    }
  }

  db.close();
}

main();
