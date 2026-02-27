/**
 * DFI JSON→CSV Transformer
 *
 * Config-driven script that reads cached DFI chart JSON (columnar format)
 * and outputs standard wide CSV files for ingest-csv.ts.
 *
 * Usage: npx tsx scripts/transform-dfi.ts
 *
 * DFI data format: { data: { fieldName: [...values] }, value_labels: { field: { code: label } } }
 */
import fs from "fs";
import path from "path";
import { resolveStateId } from "../lib/state-names";

const CACHE_DIR = path.join(process.cwd(), "data", "cache", "dfi");
const RAW_DIR = path.join(process.cwd(), "data", "raw");

interface ChartMapping {
  chartId: string;
  articleSlug: string;
  metricId: string;
  stateField: string;
  valueField: string;
  /** For time-series charts: extract only rows matching this year */
  yearFilter?: { field: string; value: string };
  /** Filter rows by a category field (e.g., sector=Rural) */
  categoryFilter?: { field: string; value: string };
  /** For asset-type charts where rows are pivoted by a category */
  assetFilter?: { field: string; value: string };
  sourceRef: string;
  /** Period label for provenance (e.g., "NFHS-5 2019-21") */
  period: string;
}

// ─── Chart Mappings ─────────────────────────────────────────────────────────

const MAPPINGS: ChartMapping[] = [
  // --- Fertility ---
  {
    chartId: "34107c248d914a2ebd512916d7d69fb1",
    articleSlug: "fertility",
    metricId: "dem-tfr",
    stateField: "dfi_1_location",
    valueField: "dfi_565_tfr",
    yearFilter: { field: "dfi_3_year", value: "2020" },
    sourceRef: "SRS / Data For India",
    period: "2020",
  },

  // --- Anaemia ---
  {
    chartId: "53424c68b2a9421c9905533d5537d8df",
    articleSlug: "anaemia-in-india",
    metricId: "hlt-anaemia-women",
    stateField: "rec01_v024",
    valueField: "0 - dfi_4_counreco",
    sourceRef: "NFHS-5 / Data For India",
    period: "2019-21",
  },
  {
    chartId: "82ee31e197ca45e3aff9e60cd836f1d1",
    articleSlug: "anaemia-in-india",
    metricId: "cyd-anaemia-children",
    stateField: "rech0_hv024",
    valueField: "2 - dfi_4_counreco",
    sourceRef: "NFHS-5 / Data For India",
    period: "2019-21",
  },

  // --- Sanitation ---
  {
    chartId: "976695ffb4d84943bda18ccedbbbd7d6",
    articleSlug: "sanitation",
    metricId: "urb-sanitation-coverage",
    stateField: "state",
    valueField: "flush_toilets",
    sourceRef: "NFHS-5 / Data For India",
    period: "2019-21",
  },

  // --- Drinking Water (Rural piped water %) ---
  {
    chartId: "630dd2fb37ae4931a34fef36ab9412f7",
    articleSlug: "access-to-drinking-water",
    metricId: "inf-piped-water",
    stateField: "dfi_94_state",
    valueField: "3 - dfi_4_counreco",
    categoryFilter: { field: "sec", value: "1" }, // Rural only
    sourceRef: "NSS 79th Round / Data For India",
    period: "2022-23",
  },

  // --- Housing ---
  {
    chartId: "3f6934028f0c4def935e6ab0bfaba0b0",
    articleSlug: "housing",
    metricId: "inf-durable-housing",
    stateField: "hv024",
    valueField: "0 - dfi_4_counreco",
    sourceRef: "NFHS-5 / Data For India",
    period: "2019-21",
  },

  // --- Banking ---
  {
    chartId: "676c2ec2a52741bf8fc602b787f08184",
    articleSlug: "access-to-banking",
    metricId: "fin-bank-account-women",
    stateField: "dfi_88_stmaco",
    valueField: "1 - 1 - dfi_4_counreco",
    sourceRef: "PLFS / Data For India",
    period: "2022-23",
  },

  // --- Computers ---
  {
    chartId: "62522a50a74348a8b503bff688fc0804",
    articleSlug: "computers",
    metricId: "dig-computer-literacy",
    stateField: "dfi_88_stmaco",
    valueField: "1 - dfi_3_counreco",
    sourceRef: "NSS CAMS / Data For India",
    period: "2022-23",
  },

  // --- ICT Skills (send messages as proxy for digital literacy) ---
  {
    chartId: "77ef37704db64916b164e4fcaf1329a6",
    articleSlug: "ict-skills",
    metricId: "dig-ict-skills",
    stateField: "dfi_1_state",
    valueField: "dfi_6_smeoms",
    sourceRef: "NSS CAMS / Data For India",
    period: "2022-23",
  },

  // --- Household Assets (TV ownership as proxy) ---
  {
    chartId: "4d78050bfdd84358a2e3d6deb10e1002",
    articleSlug: "households-assets",
    metricId: "inf-tv-ownership",
    stateField: "dfi_5_state",
    valueField: "dfi_4_shofho",
    assetFilter: { field: "dfi_2_asset", value: "Television" },
    sourceRef: "HCES 2023-24 / Data For India",
    period: "2023-24",
  },
  {
    chartId: "4d78050bfdd84358a2e3d6deb10e1002",
    articleSlug: "households-assets",
    metricId: "inf-refrigerator-ownership",
    stateField: "dfi_5_state",
    valueField: "dfi_4_shofho",
    assetFilter: { field: "dfi_2_asset", value: "Refrigerator" },
    sourceRef: "HCES 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- Vehicle Ownership ---
  {
    chartId: "25d9564f8fc644d1adf2090227963d71",
    articleSlug: "vehicle-ownership",
    metricId: "trn-two-wheeler-ownership",
    stateField: "dfi_1_state",
    valueField: "2W - dfi_3_hh",
    sourceRef: "HCES 2022-23 / Data For India",
    period: "2022-23",
  },
  {
    chartId: "25d9564f8fc644d1adf2090227963d71",
    articleSlug: "vehicle-ownership",
    metricId: "trn-car-ownership",
    stateField: "dfi_1_state",
    valueField: "4W - dfi_3_hh",
    sourceRef: "HCES 2022-23 / Data For India",
    period: "2022-23",
  },

  // --- Household Assets (continued) ---
  {
    chartId: "4d78050bfdd84358a2e3d6deb10e1002",
    articleSlug: "households-assets",
    metricId: "inf-washing-machine",
    stateField: "dfi_5_state",
    valueField: "dfi_4_shofho",
    assetFilter: { field: "dfi_2_asset", value: "Washing machine" },
    sourceRef: "HCES 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- ICT Skills (additional) ---
  {
    chartId: "77ef37704db64916b164e4fcaf1329a6",
    articleSlug: "ict-skills",
    metricId: "dig-internet-banking",
    stateField: "dfi_1_state",
    valueField: "dfi_8_doinba",
    sourceRef: "NSS CAMS / Data For India",
    period: "2022-23",
  },

  // --- Age Distribution ---
  {
    chartId: "de0865db2cbe49fcb11638d47e8904d4",
    articleSlug: "age-distribution-states",
    metricId: "eld-dependency-ratio",
    stateField: "dfi_72_statname",
    valueField: "dfi_4_drtyao",
    yearFilter: { field: "dfi_2_year", value: "2021" },
    sourceRef: "Census Projections / Data For India",
    period: "2021",
  },

  // --- Self-Employment (PLFS 2024) ---
  {
    chartId: "412b78678b984f878f7cba578846fc60",
    articleSlug: "self-employment",
    metricId: "emp-self-employed",
    stateField: "dfi_276_state",
    valueField: "5 - dfi_3_counreco",
    sourceRef: "PLFS 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- Graduate Employment (PLFS 2024) ---
  {
    chartId: "c15024f3c29547bfa4a90425ee71a5e3",
    articleSlug: "graduate-employment",
    metricId: "edu-graduate-workforce",
    stateField: "dfi_276_state",
    valueField: "1 - dfi_3_counreco",
    sourceRef: "PLFS 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- Women in Manufacturing (PLFS 2024) ---
  {
    chartId: "bfd5835f029648e68df2271a35553df1",
    articleSlug: "women-in-manufacturing",
    metricId: "wgn-women-manufacturing",
    stateField: "dfi_276_state",
    valueField: "1 - dfi_3_counreco",
    sourceRef: "PLFS 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- Inflation ---
  {
    chartId: "09a757b7b9b3453ebac8685471cdcf64",
    articleSlug: "inflation",
    metricId: "prices-avg-inflation",
    stateField: "dfi_2_state",
    valueField: "dfi_3_averinfl",
    sourceRef: "MoSPI CPI / Data For India",
    period: "2014-2024",
  },

  // --- Crude Death Rate (SRS 2023) ---
  {
    chartId: "1144c934396b4674aaecd47775d44f7b",
    articleSlug: "population-mortality",
    metricId: "hlt-crude-death-rate",
    stateField: "dfi_1_location",
    valueField: "dfi_11_dr",
    sourceRef: "SRS 2023 / Data For India",
    period: "2023",
  },

  // --- Malaria Incidence (GBD 2020) ---
  {
    chartId: "cbc7b91621cd462f93b46dbd77d99e8d",
    articleSlug: "malaria-in-india",
    metricId: "hlt-malaria-incidence",
    stateField: "dfi_2_locaname",
    valueField: "dfi_16_value",
    sourceRef: "GBD / IHME / Data For India",
    period: "2020",
  },

  // --- Meat/Non-veg Consumption (NFHS-5) ---
  {
    chartId: "504d550795534604a832283fa513ca70",
    articleSlug: "meat-consumption",
    metricId: "hlt-nonveg-consumption",
    stateField: "dfi_2_state",
    valueField: "dfi_3_eefcm",
    sourceRef: "NFHS-5 / Data For India",
    period: "2019-21",
  },

  // --- Unorganised Manufacturing (ASUSE 2024) ---
  {
    chartId: "70490e7530fb49d68c1352b2ba664c4e",
    articleSlug: "unorganised-manufacturing",
    metricId: "ind-unorganised-enterprises",
    stateField: "dfi_1_state",
    valueField: "dfi_2_noume",
    sourceRef: "ASUSE 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- Casual Worker Share (PLFS 2024) ---
  {
    chartId: "8bbaeefb1c0047fb801b2c5f9d2b021c",
    articleSlug: "salaried-jobs",
    metricId: "emp-casual-worker-share",
    stateField: "dfi_276_state",
    valueField: "0 - dfi_3_counreco",
    sourceRef: "PLFS 2023-24 / Data For India",
    period: "2023-24",
  },

  // --- Dairy Consumption (NFHS-5) ---
  {
    chartId: "6d82704b68f34034baa6f60b03c09611",
    articleSlug: "dairy-consumption",
    metricId: "hlt-dairy-consumption",
    stateField: "dfi_3_state",
    valueField: "0 - dfi_5_counreco",
    categoryFilter: { field: "dfi_2_gender", value: "Overall" },
    sourceRef: "NFHS-5 / Data For India",
    period: "2019-21",
  },

  // --- Road Accident Deaths ---
  {
    chartId: "a957a54a25294be2a6307b9470d1bd05",
    articleSlug: "road-accident-deaths",
    metricId: "trn-road-deaths-per-lakh",
    stateField: "dfi_1_state",
    valueField: "dfi_4_tnopaplp",
    sourceRef: "MoRTH / Data For India",
    period: "2022",
  },

  // --- State Economies: Relative Income & GDP Share ---
  {
    chartId: "4f00aa70a70c490f9d184ebbc103d049",
    articleSlug: "state-economies",
    metricId: "eco-relative-income",
    stateField: "dfi_2_state",
    valueField: "dfi_4_repecain",
    yearFilter: { field: "dfi_1_year", value: "2021" },
    sourceRef: "MoSPI NAS / Data For India",
    period: "2021",
  },
  {
    chartId: "3db011fcdc1a4f56b343d4bd0ad812ac",
    articleSlug: "state-economies",
    metricId: "eco-national-gdp-share",
    stateField: "dfi_2_state",
    valueField: "dfi_3_shinnaec",
    yearFilter: { field: "dfi_1_year", value: "2021" },
    sourceRef: "MoSPI NAS / Data For India",
    period: "2021",
  },

  // --- GSDP Sector Shares (state-economies) ---
  {
    chartId: "cfee3f5c942d424aa89bcab82f68d751",
    articleSlug: "state-economies",
    metricId: "eco-agriculture-share",
    stateField: "dfi_1_statname",
    valueField: "0 - dfi_8_nsvacurr",
    sourceRef: "MoSPI NAS / Data For India",
    period: "2022",
  },
  {
    chartId: "cfee3f5c942d424aa89bcab82f68d751",
    articleSlug: "state-economies",
    metricId: "eco-industry-share",
    stateField: "dfi_1_statname",
    valueField: "1 - dfi_8_nsvacurr",
    sourceRef: "MoSPI NAS / Data For India",
    period: "2022",
  },
  {
    chartId: "cfee3f5c942d424aa89bcab82f68d751",
    articleSlug: "state-economies",
    metricId: "eco-services-share",
    stateField: "dfi_1_statname",
    valueField: "2 - dfi_8_nsvacurr",
    sourceRef: "MoSPI NAS / Data For India",
    period: "2022",
  },
];

// ─── Core Transform Logic ───────────────────────────────────────────────────

interface ChartData {
  data: Record<string, (string | number)[]>;
  value_labels?: Record<string, Record<string, string>>;
  num_rows: number;
}

function loadChart(slug: string, chartId: string): ChartData | null {
  const dataPath = path.join(CACHE_DIR, slug, chartId, "data.json");
  if (!fs.existsSync(dataPath)) {
    console.warn(`  Missing: ${dataPath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

/**
 * Resolve a state value from chart data.
 * Handles both plain names and coded values (via value_labels).
 */
function resolveState(
  rawValue: string | number,
  field: string,
  valueLabels: Record<string, Record<string, string>> | undefined
): string | null {
  let name: string;
  const vl = valueLabels?.[field];
  if (vl && vl[String(rawValue)]) {
    name = vl[String(rawValue)];
  } else {
    name = String(rawValue);
  }
  return resolveStateId(name);
}

function extractRows(
  chart: ChartData,
  mapping: ChartMapping
): { stateId: string; value: number }[] {
  const stateCol = chart.data[mapping.stateField];
  const valueCol = chart.data[mapping.valueField];
  if (!stateCol || !valueCol) {
    console.warn(`  Missing field: ${mapping.stateField} or ${mapping.valueField}`);
    return [];
  }

  const results: { stateId: string; value: number }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < chart.num_rows; i++) {
    // Apply year filter
    if (mapping.yearFilter) {
      const yearVal = chart.data[mapping.yearFilter.field]?.[i];
      if (String(yearVal) !== mapping.yearFilter.value) continue;
    }

    // Apply category filter
    if (mapping.categoryFilter) {
      const catVal = chart.data[mapping.categoryFilter.field]?.[i];
      if (String(catVal) !== mapping.categoryFilter.value) continue;
    }

    // Apply asset filter
    if (mapping.assetFilter) {
      const assetVal = chart.data[mapping.assetFilter.field]?.[i];
      if (String(assetVal) !== mapping.assetFilter.value) continue;
    }

    const stateId = resolveState(stateCol[i], mapping.stateField, chart.value_labels);
    if (!stateId) continue;

    const value = Number(valueCol[i]);
    if (isNaN(value)) continue;

    // Take the first occurrence per state (avoid duplicates)
    if (seen.has(stateId)) continue;
    seen.add(stateId);

    results.push({ stateId, value: Math.round(value * 100) / 100 });
  }

  return results;
}

// ─── Group mappings by output CSV ───────────────────────────────────────────

function main() {
  console.log("=== DFI Transform ===\n");

  // Group by articleSlug to produce one CSV per article
  const bySlug = new Map<string, ChartMapping[]>();
  for (const m of MAPPINGS) {
    const key = m.articleSlug;
    if (!bySlug.has(key)) bySlug.set(key, []);
    bySlug.get(key)!.push(m);
  }

  let totalFiles = 0;
  let totalMetrics = 0;

  for (const [slug, mappings] of bySlug) {
    // Collect all data for this slug
    const allMetricIds = mappings.map((m) => m.metricId);
    const stateData = new Map<string, Record<string, number>>();
    let period = mappings[0].period;

    for (const mapping of mappings) {
      const chart = loadChart(mapping.articleSlug, mapping.chartId);
      if (!chart) continue;

      const rows = extractRows(chart, mapping);
      console.log(`  ${mapping.metricId}: ${rows.length} states from ${mapping.chartId.substring(0, 8)}...`);

      for (const row of rows) {
        if (!stateData.has(row.stateId)) stateData.set(row.stateId, {});
        stateData.get(row.stateId)![mapping.metricId] = row.value;
      }
      totalMetrics++;
    }

    if (stateData.size === 0) {
      console.log(`  SKIP: ${slug} (no data)`);
      continue;
    }

    // Build CSV
    const header = ["state", "year", ...allMetricIds].join(",");
    const rows: string[] = [header];

    // We need state names in the CSV. Build a reverse lookup.
    const stateNames = new Map<string, string>();
    // Use a reference to get nice names
    const statesRef = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "reference", "states.json"), "utf-8")
    );
    for (const s of statesRef) {
      stateNames.set(s.id, s.name);
    }

    for (const [stateId, metrics] of [...stateData.entries()].sort()) {
      const name = stateNames.get(stateId) || stateId;
      const values = allMetricIds.map((id) => {
        const v = metrics[id];
        return v !== undefined ? String(v) : "";
      });
      rows.push([name, period, ...values].join(","));
    }

    const outPath = path.join(RAW_DIR, `dfi-${slug}.csv`);
    fs.writeFileSync(outPath, rows.join("\n") + "\n");
    console.log(`  → ${outPath} (${stateData.size} states)\n`);
    totalFiles++;
  }

  console.log(`=== Done: ${totalMetrics} metrics across ${totalFiles} files ===`);
}

main();
