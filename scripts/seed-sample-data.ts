/**
 * Seeds sample data into data_points for development.
 * Uses realistic ranges for each metric based on publicly known statistics.
 * This allows UI development while real data ingestion is being set up.
 *
 * IMPORTANT: This generates plausible but FAKE data.
 * Replace with real data via ingest-mospi.ts and ingest-csv.ts before launch.
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");
const YEAR = 2023;

// Seed for reproducible "random" numbers
let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function randomInRange(min: number, max: number): number {
  return min + seededRandom() * (max - min);
}

// State development tiers (approximate, for generating realistic distributions)
// Higher tier = generally better scores
const STATE_DEV_TIER: Record<string, number> = {
  // High development
  "goa": 0.9, "delhi": 0.88, "chandigarh": 0.92, "kerala": 0.87,
  "sikkim": 0.78, "puducherry": 0.76, "himachal-pradesh": 0.77,
  "tamil-nadu": 0.75, "telangana": 0.74, "karnataka": 0.73,
  "maharashtra": 0.72, "haryana": 0.70, "gujarat": 0.71,
  "andaman-nicobar": 0.72, "lakshadweep": 0.68,
  // Medium development
  "punjab": 0.67, "uttarakhand": 0.66, "andhra-pradesh": 0.62,
  "mizoram": 0.65, "manipur": 0.55, "nagaland": 0.56,
  "tripura": 0.58, "meghalaya": 0.54, "west-bengal": 0.57,
  "rajasthan": 0.52, "chhattisgarh": 0.50, "odisha": 0.51,
  "arunachal-pradesh": 0.53, "assam": 0.49, "jammu-kashmir": 0.55,
  "ladakh": 0.60, "dadra-nagar-haveli-daman-diu": 0.62,
  // Lower development
  "madhya-pradesh": 0.47, "jharkhand": 0.44, "uttar-pradesh": 0.42,
  "bihar": 0.38,
};

// Realistic ranges for each metric [min, max]
// The actual value generated will be biased by the state's dev tier
const METRIC_RANGES: Record<string, { min: number; max: number; noise: number }> = {
  "eco-gsdp-per-capita": { min: 40000, max: 450000, noise: 0.15 },
  "eco-gsdp-growth": { min: 2, max: 14, noise: 0.3 },
  "eco-gsdp-absolute": { min: 20000, max: 3500000, noise: 0.2 },
  "eco-agriculture-share": { min: 2, max: 35, noise: 0.2 }, // Inverse polarity - high dev = low agri share
  "eco-industry-share": { min: 15, max: 55, noise: 0.2 },
  "eco-services-share": { min: 30, max: 75, noise: 0.15 },
  "eco-poverty-headcount": { min: 1, max: 35, noise: 0.2 }, // Inverse
  "eco-fiscal-deficit": { min: 1, max: 6, noise: 0.3 }, // Inverse
  "eco-debt-gsdp": { min: 15, max: 45, noise: 0.25 }, // Inverse
  "eco-own-tax-revenue": { min: 3, max: 12, noise: 0.2 },
  "eco-capital-expenditure": { min: 10, max: 35, noise: 0.25 },
  "eco-gst-per-capita": { min: 2000, max: 35000, noise: 0.2 },
  "eco-credit-deposit": { min: 30, max: 120, noise: 0.2 },
  "eco-per-capita-consumption": { min: 1500, max: 8000, noise: 0.15 },
  "eco-gini": { min: 0.25, max: 0.45, noise: 0.2 }, // Inverse
  "emp-lfpr-total": { min: 35, max: 65, noise: 0.2 },
  "emp-lfpr-female": { min: 10, max: 55, noise: 0.25 },
  "emp-unemployment": { min: 1, max: 12, noise: 0.3 }, // Inverse
  "emp-youth-unemployment": { min: 5, max: 30, noise: 0.25 }, // Inverse
  "emp-regular-salaried": { min: 15, max: 55, noise: 0.2 },
  "emp-avg-daily-wage": { min: 200, max: 600, noise: 0.2 },
  "edu-literacy-total": { min: 60, max: 97, noise: 0.1 },
  "edu-ger-secondary": { min: 50, max: 100, noise: 0.15 },
  "edu-ger-higher": { min: 10, max: 50, noise: 0.2 },
  "edu-pupil-teacher": { min: 15, max: 45, noise: 0.2 }, // Inverse
  "edu-female-literacy": { min: 45, max: 96, noise: 0.12 },
  "hlt-imr": { min: 4, max: 40, noise: 0.15 }, // Inverse
  "hlt-mmr": { min: 30, max: 200, noise: 0.2 }, // Inverse
  "hlt-life-expectancy": { min: 62, max: 77, noise: 0.1 },
  "hlt-stunting": { min: 15, max: 45, noise: 0.15 }, // Inverse
  "hlt-institutional-delivery": { min: 65, max: 100, noise: 0.1 },
  "hlt-hospital-beds": { min: 0.3, max: 3.5, noise: 0.2 },
};

function generateValue(
  metricId: string,
  devTier: number
): number {
  const range = METRIC_RANGES[metricId];
  if (!range) return 0;

  // For negative polarity metrics (lower is better for developed states),
  // invert the development tier influence
  const isInverse = [
    "eco-agriculture-share", "eco-poverty-headcount", "eco-fiscal-deficit",
    "eco-debt-gsdp", "eco-gini", "emp-unemployment", "emp-youth-unemployment",
    "edu-pupil-teacher", "hlt-imr", "hlt-mmr", "hlt-stunting",
  ].includes(metricId);

  const effectiveTier = isInverse ? 1 - devTier : devTier;

  // Base value from tier
  const base = range.min + (range.max - range.min) * effectiveTier;

  // Add noise
  const noise = (seededRandom() - 0.5) * 2 * range.noise * (range.max - range.min);
  const value = Math.max(range.min, Math.min(range.max, base + noise));

  // Round appropriately
  if (range.max > 1000) return Math.round(value);
  if (range.max > 100) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

function main() {
  console.log("=== Seeding Sample Data ===\n");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Clear existing data points
  db.prepare("DELETE FROM data_points").run();

  const states = db.prepare("SELECT id FROM states").all() as Array<{ id: string }>;
  const metrics = db.prepare("SELECT id FROM metrics").all() as Array<{ id: string }>;

  const insert = db.prepare(`
    INSERT INTO data_points (metric_id, state_id, year, value, status, source_ref)
    VALUES (?, ?, ?, ?, 'sample', 'seed-sample-data')
  `);

  let count = 0;
  const insertAll = db.transaction(() => {
    for (const state of states) {
      const devTier = STATE_DEV_TIER[state.id] ?? 0.5;
      for (const metric of metrics) {
        const value = generateValue(metric.id, devTier);
        if (value > 0) {
          insert.run(metric.id, state.id, YEAR, value);
          count++;
        }
      }
    }
  });

  insertAll();

  console.log(`Inserted ${count} data points for ${states.length} states × ${metrics.length} metrics`);
  console.log(`Year: ${YEAR}`);

  db.close();
}

main();
