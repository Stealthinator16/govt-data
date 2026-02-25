/**
 * JSON Bundle Export
 *
 * Exports pre-computed data from SQLite to JSON files in public/data/
 * for client-side consumption (comparison tool, charts, etc.)
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");
const OUTPUT_DIR = path.join(process.cwd(), "public", "data");

function main() {
  console.log("=== Generating JSON Bundles ===\n");

  const db = new Database(DB_PATH, { readonly: true });

  // Ensure output directories exist
  fs.mkdirSync(path.join(OUTPUT_DIR, "categories"), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, "states"), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, "metrics"), { recursive: true });

  const yearRow = db
    .prepare("SELECT MAX(year) as year FROM overall_scores")
    .get() as { year: number | null };

  if (!yearRow?.year) {
    console.log("No scores found. Run compute-scores first.");
    db.close();
    return;
  }

  const year = yearRow.year;

  // 1. Overall rankings
  console.log("Exporting overall rankings...");
  const overall = db
    .prepare(
      `SELECT o.state_id, o.score, o.rank, o.tier, s.name as state_name, s.type as state_type, s.region
       FROM overall_scores o JOIN states s ON s.id = o.state_id
       WHERE o.year = ? ORDER BY o.rank`
    )
    .all(year);

  writeJson(path.join(OUTPUT_DIR, "overall.json"), { year, rankings: overall });

  // 2. Per-category rankings
  console.log("Exporting category rankings...");
  const categories = db
    .prepare("SELECT id, name FROM categories ORDER BY sort_order")
    .all() as Array<{ id: string; name: string }>;

  for (const cat of categories) {
    const rankings = db
      .prepare(
        `SELECT cs.state_id, cs.score, cs.rank, cs.metrics_count,
                s.name as state_name, s.type as state_type
         FROM category_scores cs JOIN states s ON s.id = cs.state_id
         WHERE cs.category_id = ? AND cs.year = ? ORDER BY cs.rank`
      )
      .all(cat.id, year);

    if (rankings.length > 0) {
      writeJson(path.join(OUTPUT_DIR, "categories", `${cat.id}.json`), {
        year,
        category: cat,
        rankings,
      });
    }
  }

  // 3. Per-state profiles
  console.log("Exporting state profiles...");
  const states = db
    .prepare("SELECT id, name, type, region, population, area_sq_km FROM states ORDER BY name")
    .all() as Array<{
    id: string;
    name: string;
    type: string;
    region: string;
    population: number;
    area_sq_km: number;
  }>;

  for (const state of states) {
    const overallScore = db
      .prepare("SELECT score, rank, tier FROM overall_scores WHERE state_id = ? AND year = ?")
      .get(state.id, year) as { score: number; rank: number; tier: string } | undefined;

    const categoryScores = db
      .prepare(
        `SELECT cs.category_id, cs.score, cs.rank, cs.metrics_count, c.name as category_name
         FROM category_scores cs JOIN categories c ON c.id = cs.category_id
         WHERE cs.state_id = ? AND cs.year = ? ORDER BY c.sort_order`
      )
      .all(state.id, year);

    writeJson(path.join(OUTPUT_DIR, "states", `${state.id}.json`), {
      year,
      state,
      overall: overallScore || null,
      categories: categoryScores,
    });
  }

  // 4. Comparison dataset (lightweight)
  console.log("Exporting comparison dataset...");
  const compareData: Record<string, Record<string, number>> = {};

  for (const state of states) {
    const scores = db
      .prepare(
        `SELECT cs.category_id, cs.score
         FROM category_scores cs
         WHERE cs.state_id = ? AND cs.year = ?`
      )
      .all(state.id, year) as Array<{ category_id: string; score: number }>;

    compareData[state.id] = {};
    for (const s of scores) {
      compareData[state.id][s.category_id] = s.score;
    }
  }

  writeJson(path.join(OUTPUT_DIR, "compare.json"), {
    year,
    states: states.map((s) => ({ id: s.id, name: s.name, type: s.type })),
    scores: compareData,
  });

  // 5. Per-metric rankings
  console.log("Exporting per-metric rankings...");
  const metrics = db
    .prepare(
      `SELECT m.id, m.name, m.unit, m.source, m.polarity, m.category_id, m.weight,
              m.description, m.source_url, c.name as category_name
       FROM metrics m JOIN categories c ON c.id = m.category_id
       ORDER BY c.sort_order, m.id`
    )
    .all() as Array<{
    id: string;
    name: string;
    unit: string;
    source: string;
    polarity: string;
    category_id: string;
    weight: number;
    description: string | null;
    source_url: string | null;
    category_name: string;
  }>;

  let metricCount = 0;
  for (const metric of metrics) {
    const rankings = db
      .prepare(
        `SELECT ms.state_id, s.name as state_name, s.type as state_type,
                ms.raw_value, ms.norm_score, ms.rank
         FROM metric_scores ms JOIN states s ON s.id = ms.state_id
         WHERE ms.metric_id = ? AND ms.year = ?
         ORDER BY ms.rank`
      )
      .all(metric.id, year);

    if (rankings.length > 0) {
      writeJson(path.join(OUTPUT_DIR, "metrics", `${metric.id}.json`), {
        year,
        metric: {
          id: metric.id,
          name: metric.name,
          unit: metric.unit,
          source: metric.source,
          polarity: metric.polarity,
          category_id: metric.category_id,
          category_name: metric.category_name,
          weight: metric.weight,
          description: metric.description,
          source_url: metric.source_url,
        },
        rankings,
      });
      metricCount++;
    }
  }
  console.log(`  Exported ${metricCount} metric files`);

  // 6. Extend category JSONs with metrics list
  console.log("Adding metrics lists to category JSONs...");
  for (const cat of categories) {
    const catFilePath = path.join(OUTPUT_DIR, "categories", `${cat.id}.json`);
    if (!fs.existsSync(catFilePath)) continue;

    const catData = JSON.parse(fs.readFileSync(catFilePath, "utf-8"));
    const catMetrics = metrics
      .filter((m) => m.category_id === cat.id)
      .map((m) => ({ id: m.id, name: m.name, unit: m.unit, polarity: m.polarity, source: m.source, source_url: m.source_url, description: m.description }));

    catData.metrics = catMetrics;
    writeJson(catFilePath, catData);
  }

  console.log("\n=== JSON export complete ===");
  db.close();
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

main();
