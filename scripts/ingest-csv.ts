/**
 * CSV Ingestion Script
 *
 * Config-driven ingestion of manually curated CSV files from
 * government publications (RBI, Census, NFHS, UDISE, etc.).
 *
 * CSV convention — wide format:
 *   state,year,metric-id-1,metric-id-2,...
 *   Andhra Pradesh,2022,12345,67.8
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { resolveStateId } from "../lib/state-names";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");
const RAW_DIR = path.join(process.cwd(), "data", "raw");

// All CSV data is cross-sectional (comparing states at a point in time).
// Different sources use different survey years (2011, 2020, 2022-23, etc.)
// but we need a single year for the scoring engine to aggregate across metrics.
// SCORE_YEAR normalizes all CSV data to a common year for scoring.
const SCORE_YEAR = 2021;

interface CsvSource {
  file: string; // relative to data/raw/
  metrics: string[]; // metric IDs matching CSV column headers
  sourceRef: string; // provenance string
  stateColumn?: string; // default: "state"
  yearColumn?: string; // default: "year"
}

const CSV_SOURCES: CsvSource[] = [
  {
    file: "mospi-gsdp.csv",
    metrics: [
      "eco-gsdp-per-capita",
      "eco-gsdp-growth",
      "eco-gsdp-absolute",
      "eco-agriculture-share",
      "eco-industry-share",
      "eco-services-share",
    ],
    sourceRef: "MoSPI SDP / data.gov.in",
  },
  {
    file: "niti-mpi.csv",
    metrics: ["eco-poverty-headcount"],
    sourceRef: "NITI Aayog MPI 2023",
  },
  {
    file: "rbi-state-finances.csv",
    metrics: [
      "eco-fiscal-deficit",
      "eco-debt-gsdp",
      "eco-own-tax-revenue",
      "eco-capital-expenditure",
    ],
    sourceRef: "RBI State Finances",
  },
  {
    file: "rbi-banking.csv",
    metrics: ["eco-credit-deposit"],
    sourceRef: "RBI Banking Statistics",
  },
  {
    file: "gst-collections.csv",
    metrics: ["eco-gst-per-capita"],
    sourceRef: "GST Council",
  },
  {
    file: "mospi-hces.csv",
    metrics: ["eco-per-capita-consumption"],
    sourceRef: "MoSPI HCES 2022-23",
  },
  {
    file: "census-literacy.csv",
    metrics: ["edu-literacy-total", "edu-female-literacy"],
    sourceRef: "Census 2011 / NFHS-5",
  },
  {
    file: "udise-aishe.csv",
    metrics: ["edu-ger-secondary", "edu-ger-higher", "edu-pupil-teacher"],
    sourceRef: "UDISE+ / AISHE",
  },
  {
    file: "health-srs-nfhs.csv",
    metrics: [
      "hlt-imr",
      "hlt-mmr",
      "hlt-life-expectancy",
      "hlt-stunting",
      "hlt-institutional-delivery",
      "hlt-hospital-beds",
    ],
    sourceRef: "SRS / NFHS-5 / NHP",
  },
  {
    file: "ncrb-crime.csv",
    metrics: [
      "crm-murder-rate",
      "crm-police-strength",
      "wgn-crimes-against-women",
      "mhl-suicide-rate",
    ],
    sourceRef: "NCRB Crime in India 2022 / BPR&D",
  },
  {
    file: "nfhs5-women-children.csv",
    metrics: [
      "wgn-sex-ratio",
      "cyd-child-marriage",
      "cyd-u5-mortality",
      "cyd-full-immunization",
    ],
    sourceRef: "NFHS-5 (2019-21)",
  },
  {
    file: "census-demographics.csv",
    metrics: ["dem-urbanization", "dem-population-density", "dem-decadal-growth"],
    sourceRef: "Census 2011",
  },
  {
    file: "morth-transport.csv",
    metrics: ["trn-vehicle-density", "trn-road-accidents", "trn-nh-length"],
    sourceRef: "MoRTH / NHAI 2022",
  },
  {
    file: "cea-energy-fsi.csv",
    metrics: ["ene-per-capita-electricity", "ene-forest-cover"],
    sourceRef: "CEA / FSI ISFR 2021",
  },
  {
    file: "agriculture-moafw.csv",
    metrics: ["agr-food-grain-production", "agr-farmer-income"],
    sourceRef: "MoA&FW / NSO SAS 2019",
  },
  {
    file: "tourism-mot.csv",
    metrics: ["clt-domestic-tourists", "clt-heritage-sites"],
    sourceRef: "MoT / ASI 2023",
  },
  {
    file: "dpiit-startups.csv",
    metrics: ["dig-startup-density"],
    sourceRef: "DPIIT Startup India 2023",
  },
  {
    file: "financial-inclusion.csv",
    metrics: ["fin-jan-dhan-accounts"],
    sourceRef: "PMJDY 2023",
  },
  {
    file: "infrastructure-jjm-saubhagya.csv",
    metrics: ["inf-household-electricity", "inf-household-tap-water"],
    sourceRef: "JJM / Saubhagya / NFHS-5",
  },
  {
    file: "srs-elderly.csv",
    metrics: ["eld-life-expectancy-60"],
    sourceRef: "SRS Abridged Life Tables 2016-20",
  },
  {
    file: "eci-women-elected.csv",
    metrics: ["wgn-women-elected"],
    sourceRef: "ECI / PRS India",
  },
];

function main() {
  console.log("=== CSV Data Ingestion ===\n");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const log = db
    .prepare(
      "INSERT INTO ingestion_log (source, status) VALUES ('csv-files', 'running')"
    )
    .run();
  const logId = log.lastInsertRowid;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO data_points
      (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
    VALUES
      (@metric_id, @state_id, @year, @period, @value, @gender, @sector, @age_group, @social_group, @status, @source_ref)
  `);

  let totalRows = 0;
  let filesProcessed = 0;
  let filesSkipped = 0;

  for (const source of CSV_SOURCES) {
    const filePath = path.join(RAW_DIR, source.file);

    if (!fs.existsSync(filePath)) {
      console.log(`SKIP: ${source.file} (not found)`);
      filesSkipped++;
      continue;
    }

    console.log(`Processing: ${source.file}`);
    const csvText = fs.readFileSync(filePath, "utf-8");
    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.warn(`  Parse warnings: ${errors.length}`);
    }

    const stateCol = source.stateColumn || "state";
    const yearCol = source.yearColumn || "year";
    let fileRows = 0;

    const insertBatch = db.transaction(() => {
      for (const row of data) {
        const stateName = row[stateCol];
        if (!stateName) continue;
        const stateId = resolveStateId(stateName);
        if (!stateId) continue;

        const yearStr = row[yearCol];
        if (!yearStr) continue;

        for (const metricId of source.metrics) {
          const raw = row[metricId];
          if (raw == null || raw.trim() === "" || raw === "NA" || raw === "-")
            continue;

          const value = parseFloat(raw.replace(/,/g, ""));
          if (isNaN(value)) continue;

          insertStmt.run({
            metric_id: metricId,
            state_id: stateId,
            year: SCORE_YEAR,
            period: yearStr,
            value,
            gender: null,
            sector: null,
            age_group: null,
            social_group: null,
            status: "final",
            source_ref: source.sourceRef,
          });
          fileRows++;
        }
      }
    });

    insertBatch();
    totalRows += fileRows;
    filesProcessed++;
    console.log(`  Inserted ${fileRows} rows`);
  }

  // --- Metric aliases ---
  // wgn-female-lfpr is identical to emp-lfpr-female (both from PLFS).
  // Copy existing data_points so the women-gender category gets scored.
  const aliased = db
    .prepare(
      `INSERT OR REPLACE INTO data_points
        (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
      SELECT 'wgn-female-lfpr', state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref
      FROM data_points WHERE metric_id = 'emp-lfpr-female'`
    )
    .run();
  if (aliased.changes > 0) {
    totalRows += aliased.changes;
    console.log(`\nAlias: wgn-female-lfpr ← emp-lfpr-female (${aliased.changes} rows)`);
  }

  db.prepare(
    "UPDATE ingestion_log SET status = 'completed', rows_added = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(totalRows, logId);

  console.log(
    `\n=== Done: ${totalRows} rows from ${filesProcessed} files (${filesSkipped} skipped) ===`
  );
  db.close();
}

main();
