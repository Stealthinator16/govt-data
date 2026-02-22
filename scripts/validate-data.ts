/**
 * Data Validation
 *
 * Checks data quality:
 * - States with no data
 * - Metrics with insufficient coverage
 * - Score distribution sanity checks
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");

function main() {
  console.log("=== Data Validation ===\n");

  const db = new Database(DB_PATH, { readonly: true });
  let warnings = 0;

  const yearRow = db
    .prepare("SELECT MAX(year) as year FROM data_points")
    .get() as { year: number | null };

  if (!yearRow?.year) {
    console.log("ERROR: No data found.");
    db.close();
    process.exit(1);
  }

  const year = yearRow.year;

  // Check 1: States with data
  const statesWithData = db
    .prepare(
      `SELECT COUNT(DISTINCT state_id) as count FROM data_points WHERE year = ?`
    )
    .get(year) as { count: number };
  console.log(`States with data: ${statesWithData.count}/36`);
  if (statesWithData.count < 20) {
    console.log("  WARNING: Less than 20 states have data");
    warnings++;
  }

  // Check 2: Metrics with data
  const metricsWithData = db
    .prepare(
      `SELECT COUNT(DISTINCT metric_id) as count FROM data_points WHERE year = ?`
    )
    .get(year) as { count: number };
  const totalMetrics = db
    .prepare("SELECT COUNT(*) as count FROM metrics")
    .get() as { count: number };
  console.log(`Metrics with data: ${metricsWithData.count}/${totalMetrics.count}`);

  // Check 3: Data coverage per metric
  const lowCoverage = db
    .prepare(
      `SELECT m.id, m.name, COUNT(DISTINCT dp.state_id) as state_count
       FROM metrics m
       LEFT JOIN data_points dp ON dp.metric_id = m.id AND dp.year = ?
       GROUP BY m.id
       HAVING state_count < 10 AND state_count > 0
       ORDER BY state_count`
    )
    .all(year) as Array<{ id: string; name: string; state_count: number }>;

  if (lowCoverage.length > 0) {
    console.log(`\nMetrics with low coverage (<10 states):`);
    for (const m of lowCoverage) {
      console.log(`  ${m.name}: ${m.state_count} states`);
      warnings++;
    }
  }

  // Check 4: Score distribution
  const scoreDist = db
    .prepare(
      `SELECT tier, COUNT(*) as count FROM overall_scores WHERE year = ? GROUP BY tier`
    )
    .all(year) as Array<{ tier: string; count: number }>;

  if (scoreDist.length > 0) {
    console.log(`\nScore distribution:`);
    for (const d of scoreDist) {
      console.log(`  ${d.tier}: ${d.count}`);
    }
  }

  // Check 5: Extreme scores
  const extremes = db
    .prepare(
      `SELECT s.name, o.score, o.tier
       FROM overall_scores o JOIN states s ON s.id = o.state_id
       WHERE o.year = ? AND (o.score > 95 OR o.score < 5)
       ORDER BY o.score`
    )
    .all(year) as Array<{ name: string; score: number; tier: string }>;

  if (extremes.length > 0) {
    console.log(`\nWARNING: Extreme scores detected:`);
    for (const e of extremes) {
      console.log(`  ${e.name}: ${e.score.toFixed(1)}`);
      warnings++;
    }
  }

  console.log(`\n=== Validation complete: ${warnings} warnings ===`);
  db.close();

  if (warnings > 10) {
    console.log("Too many warnings. Review data quality.");
    process.exit(1);
  }
}

main();
