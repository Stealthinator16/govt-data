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
  // --- Data For India (CC-BY 4.0) ---
  {
    file: "dfi-fertility.csv",
    metrics: ["dem-tfr"],
    sourceRef: "SRS / Data For India",
  },
  {
    file: "dfi-anaemia-in-india.csv",
    metrics: ["hlt-anaemia-women", "cyd-anaemia-children"],
    sourceRef: "NFHS-5 / Data For India",
  },
  {
    file: "dfi-sanitation.csv",
    metrics: ["urb-sanitation-coverage"],
    sourceRef: "NFHS-5 / Data For India",
  },
  {
    file: "dfi-access-to-drinking-water.csv",
    metrics: ["inf-piped-water"],
    sourceRef: "NSS 79th Round / Data For India",
  },
  {
    file: "dfi-housing.csv",
    metrics: ["inf-durable-housing"],
    sourceRef: "NFHS-5 / Data For India",
  },
  {
    file: "dfi-access-to-banking.csv",
    metrics: ["fin-bank-account-women"],
    sourceRef: "PLFS / Data For India",
  },
  {
    file: "dfi-computers.csv",
    metrics: ["dig-computer-literacy"],
    sourceRef: "NSS CAMS / Data For India",
  },
  {
    file: "dfi-ict-skills.csv",
    metrics: ["dig-ict-skills", "dig-internet-banking"],
    sourceRef: "NSS CAMS / Data For India",
  },
  {
    file: "dfi-households-assets.csv",
    metrics: ["inf-tv-ownership", "inf-refrigerator-ownership", "inf-washing-machine"],
    sourceRef: "HCES 2023-24 / Data For India",
  },
  {
    file: "dfi-vehicle-ownership.csv",
    metrics: ["trn-two-wheeler-ownership", "trn-car-ownership"],
    sourceRef: "HCES 2022-23 / Data For India",
  },
  {
    file: "dfi-road-accident-deaths.csv",
    metrics: ["trn-road-deaths-per-lakh"],
    sourceRef: "MoRTH / Data For India",
  },
  {
    file: "dfi-age-distribution-states.csv",
    metrics: ["eld-dependency-ratio"],
    sourceRef: "Census Projections / Data For India",
  },
  {
    file: "dfi-self-employment.csv",
    metrics: ["emp-self-employed"],
    sourceRef: "PLFS 2023-24 / Data For India",
  },
  {
    file: "dfi-graduate-employment.csv",
    metrics: ["edu-graduate-workforce"],
    sourceRef: "PLFS 2023-24 / Data For India",
  },
  {
    file: "dfi-women-in-manufacturing.csv",
    metrics: ["wgn-women-manufacturing"],
    sourceRef: "PLFS 2023-24 / Data For India",
  },
  {
    file: "dfi-inflation.csv",
    metrics: ["prices-avg-inflation"],
    sourceRef: "MoSPI CPI / Data For India",
  },
  {
    file: "dfi-population-mortality.csv",
    metrics: ["hlt-crude-death-rate"],
    sourceRef: "SRS 2023 / Data For India",
  },
  {
    file: "dfi-malaria-in-india.csv",
    metrics: ["hlt-malaria-incidence"],
    sourceRef: "GBD / IHME / Data For India",
  },
  {
    file: "dfi-meat-consumption.csv",
    metrics: ["hlt-nonveg-consumption"],
    sourceRef: "NFHS-5 / Data For India",
  },
  {
    file: "dfi-unorganised-manufacturing.csv",
    metrics: ["ind-unorganised-enterprises"],
    sourceRef: "ASUSE 2023-24 / Data For India",
  },
  // --- Batch 2: New data sources ---
  {
    file: "ncrb-crime-extended.csv",
    metrics: ["crm-total-crime-rate", "crm-chargesheet-rate"],
    sourceRef: "NCRB Crime in India 2022",
  },
  {
    file: "eci-voter-turnout.csv",
    metrics: ["gov-voter-turnout"],
    sourceRef: "ECI Lok Sabha 2024",
  },
  {
    file: "tourism-mot-foreign.csv",
    metrics: ["clt-foreign-tourists"],
    sourceRef: "MoT India Tourism Statistics 2023",
  },
  {
    file: "rbi-bank-branches.csv",
    metrics: ["fin-bank-branches"],
    sourceRef: "RBI BSR March 2024",
  },
  {
    file: "census-disability.csv",
    metrics: ["dis-disability-prevalence"],
    sourceRef: "Census 2011",
  },
  {
    file: "des-irrigation.csv",
    metrics: ["agr-gross-irrigated-area"],
    sourceRef: "DES Land Use Statistics 2022-23",
  },
  // --- Batch 3: DFI GSDP sector shares ---
  {
    file: "dfi-state-economies.csv",
    metrics: [
      "eco-agriculture-share",
      "eco-industry-share",
      "eco-services-share",
      "eco-relative-income",
      "eco-national-gdp-share",
    ],
    sourceRef: "MoSPI NAS / Data For India",
  },
  {
    file: "dfi-salaried-jobs.csv",
    metrics: ["emp-casual-worker-share"],
    sourceRef: "PLFS 2023-24 / Data For India",
  },
  {
    file: "dfi-dairy-consumption.csv",
    metrics: ["hlt-dairy-consumption"],
    sourceRef: "NFHS-5 / Data For India",
  },
  // --- Batch 5: TRAI telecom data (circle→state mapped) ---
  {
    file: "trai-telecom.csv",
    metrics: [
      "tel-wireless-subscribers",
      "dig-internet-subscribers",
      "dig-broadband-subscribers",
    ],
    sourceRef: "TRAI Quarterly Report Q3 FY2024-25",
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

  // med-tv-households is identical to inf-tv-ownership (both from HCES).
  // Copy existing data_points so the media category gets scored.
  const aliasedTv = db
    .prepare(
      `INSERT OR REPLACE INTO data_points
        (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
      SELECT 'med-tv-households', state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref
      FROM data_points WHERE metric_id = 'inf-tv-ownership'`
    )
    .run();
  if (aliasedTv.changes > 0) {
    totalRows += aliasedTv.changes;
    console.log(`Alias: med-tv-households ← inf-tv-ownership (${aliasedTv.changes} rows)`);
  }

  // wat-sanitation-coverage is identical to urb-sanitation-coverage (NFHS-5 flush toilet data).
  // Copy so the water-sanitation category gets scored immediately.
  const aliasedSanitation = db
    .prepare(
      `INSERT OR REPLACE INTO data_points
        (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
      SELECT 'wat-sanitation-coverage', state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref
      FROM data_points WHERE metric_id = 'urb-sanitation-coverage'`
    )
    .run();
  if (aliasedSanitation.changes > 0) {
    totalRows += aliasedSanitation.changes;
    console.log(`Alias: wat-sanitation-coverage ← urb-sanitation-coverage (${aliasedSanitation.changes} rows)`);
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
