/**
 * Cached MoSPI Ingestion Script
 *
 * Reads previously cached MoSPI JSON responses (from data/cache/mospi/data_*.json)
 * and inserts into SQLite. No MCP connection needed.
 *
 * Handles 3 data formats: PLFS, CPI, ASI.
 * For each metric, takes the latest year per state.
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { resolveStateId } from "../lib/state-names";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");
const CACHE_DIR = path.join(process.cwd(), "data", "cache", "mospi");

// Use same SCORE_YEAR as ingest-csv for consistency
const SCORE_YEAR = 2021;

interface CachedMetric {
  metricId: string;
  file: string; // filename in cache dir
  parser: "plfs" | "cpi" | "asi";
  sourceRef: string;
}

const CACHED_METRICS: CachedMetric[] = [
  // --- PLFS (Employment) ---
  { metricId: "emp-lfpr-total", file: "data_emp-lfpr-total.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-lfpr-female", file: "data_emp-lfpr-female.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-unemployment", file: "data_emp-unemployment.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-youth-unemployment", file: "data_emp-youth-unemployment.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-regular-salaried", file: "data_emp-regular-salaried.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-avg-daily-wage", file: "data_emp-avg-daily-wage.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-wpr-total", file: "data_emp-wpr-total.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  { metricId: "emp-regular-wage", file: "data_emp-regular-wage.json", parser: "plfs", sourceRef: "MoSPI PLFS" },
  // --- CPI (Prices) ---
  { metricId: "prices-cpi-general", file: "data_prices-cpi-general.json", parser: "cpi", sourceRef: "MoSPI CPI" },
  // --- ASI (Industry) ---
  { metricId: "ind-factories", file: "data_ind-factories.json", parser: "asi", sourceRef: "MoSPI ASI" },
  { metricId: "ind-factory-workers", file: "data_ind-factory-workers.json", parser: "asi", sourceRef: "MoSPI ASI" },
  { metricId: "ind-factory-gva", file: "data_ind-factory-gva.json", parser: "asi", sourceRef: "MoSPI ASI" },
];

/** Parse fiscal year "2023-24" → 2023 */
function parseYear(yearStr: string | number): number {
  const s = String(yearStr);
  const match = s.match(/^(\d{4})/);
  return match ? parseInt(match[1]) : 0;
}

interface StateValue {
  value: number;
  year: number;
  period: string;
}

// Quarter ordering for fiscal year (APR-JUN=1 … JAN-MAR=4)
const QUARTER_ORDER: Record<string, number> = {
  "APR-JUN": 1,
  "JUL-SEP": 2,
  "OCT-DEC": 3,
  "JAN-MAR": 4,
  all: 5, // annual > quarterly
};

/** Extract latest-year-per-state from PLFS data */
function parsePLFS(data: any[]): Map<string, StateValue> {
  const best = new Map<string, { value: number; year: number; period: string; qOrder: number }>();

  for (const item of data) {
    const stateName = item.state || item.State || "";
    const stateId = resolveStateId(stateName);
    if (!stateId) continue;

    const year = parseYear(item.year || item.Year || "");
    if (year === 0) continue;

    const rawVal = item.value ?? item.Value;
    if (rawVal == null || rawVal === "") continue;
    const value = parseFloat(rawVal);
    if (isNaN(value)) continue;

    const quarter = item.quarter || "all";
    const qOrder = QUARTER_ORDER[quarter] ?? 0;

    const prev = best.get(stateId);
    if (!prev || year > prev.year || (year === prev.year && qOrder > prev.qOrder)) {
      best.set(stateId, { value, year, period: String(item.year || item.Year), qOrder });
    }
  }

  // Convert to StateValue
  const result = new Map<string, StateValue>();
  for (const [stateId, sv] of best) {
    result.set(stateId, { value: sv.value, year: sv.year, period: sv.period });
  }
  return result;
}

/** Extract latest December CPI index per state */
function parseCPI(data: any[]): Map<string, StateValue> {
  const best = new Map<string, StateValue>();

  for (const item of data) {
    const stateName = item.state || "";
    const stateId = resolveStateId(stateName);
    if (!stateId) continue;

    const year = typeof item.year === "number" ? item.year : parseInt(item.year);
    if (!year || isNaN(year)) continue;

    if (item.index == null || item.index === "") continue;
    const value = parseFloat(item.index);
    if (isNaN(value)) continue;

    const prev = best.get(stateId);
    if (!prev || year > prev.year) {
      best.set(stateId, { value, year, period: `${year}-December` });
    }
  }

  return best;
}

/** Extract latest-year-per-state from ASI data */
function parseASI(data: any[]): Map<string, StateValue> {
  const best = new Map<string, StateValue>();

  for (const item of data) {
    const stateName = item.state || "";
    const stateId = resolveStateId(stateName);
    if (!stateId) continue;

    const year = parseYear(item.year || "");
    if (year === 0) continue;

    if (item.value == null || item.value === "") continue;
    const value = parseFloat(item.value);
    if (isNaN(value)) continue;

    const prev = best.get(stateId);
    if (!prev || year > prev.year) {
      best.set(stateId, { value, year, period: String(item.year) });
    }
  }

  return best;
}

function main() {
  console.log("=== MoSPI Cached Data Ingestion ===\n");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const log = db
    .prepare("INSERT INTO ingestion_log (source, status) VALUES ('mospi-cached', 'running')")
    .run();
  const logId = log.lastInsertRowid;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO data_points
      (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
    VALUES
      (@metric_id, @state_id, @year, @period, @value, @gender, @sector, @age_group, @social_group, @status, @source_ref)
  `);

  let totalRows = 0;
  let metricsProcessed = 0;
  let metricsSkipped = 0;

  for (const metric of CACHED_METRICS) {
    const filePath = path.join(CACHE_DIR, metric.file);

    if (!fs.existsSync(filePath)) {
      console.log(`SKIP: ${metric.file} (not found)`);
      metricsSkipped++;
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const data = raw.data || raw;
    if (!Array.isArray(data)) {
      console.log(`SKIP: ${metric.metricId} (data is not an array)`);
      metricsSkipped++;
      continue;
    }

    let stateValues: Map<string, StateValue>;
    switch (metric.parser) {
      case "cpi":
        stateValues = parseCPI(data);
        break;
      case "asi":
        stateValues = parseASI(data);
        break;
      default:
        stateValues = parsePLFS(data);
    }

    const insertBatch = db.transaction(() => {
      let count = 0;
      for (const [stateId, sv] of stateValues) {
        insertStmt.run({
          metric_id: metric.metricId,
          state_id: stateId,
          year: SCORE_YEAR,
          period: sv.period,
          value: sv.value,
          gender: null,
          sector: null,
          age_group: null,
          social_group: null,
          status: "final",
          source_ref: metric.sourceRef,
        });
        count++;
      }
      return count;
    });

    const inserted = insertBatch();
    totalRows += inserted;
    metricsProcessed++;
    console.log(`${metric.metricId}: ${inserted} states (latest year per state)`);
  }

  db.prepare(
    "UPDATE ingestion_log SET status = 'completed', rows_added = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(totalRows, logId);

  console.log(
    `\n=== Done: ${totalRows} rows from ${metricsProcessed} metrics (${metricsSkipped} skipped) ===`
  );
  db.close();
}

main();
