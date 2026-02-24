/**
 * MoSPI MCP Ingestion Script
 *
 * Connects to the MoSPI MCP server (https://mcp.mospi.gov.in/) using
 * streamable-http transport and fetches state-level data via the 4-step workflow:
 * 1. know_about_mospi_api() → dataset list
 * 2. get_indicators(dataset) → indicator list
 * 3. get_metadata(dataset, indicator_code) → filter code maps
 * 4. get_data(dataset, filters) → actual data
 *
 * Fetches state-level data from:
 * - PLFS (employment): LFPR, WPR, unemployment, wages, worker distribution
 * - CPI (prices): General Consumer Price Index by state
 * - ASI (industry): Factories, workers, Gross Value Added by state
 *
 * Datasets without state-level data: NAS, IIP, WPI, ENERGY (all national-only).
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { resolveStateId } from "../lib/state-names";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");
const MCP_URL = "https://mcp.mospi.gov.in/";
const CACHE_DIR = path.join(process.cwd(), "data", "cache", "mospi");
const CALL_DELAY_MS = 500;
const PAGE_LIMIT = 500; // Fetch up to 500 rows per call to get all states

// Each metric mapping specifies exact filter codes from the MoSPI API metadata.
// These codes come from 3_get_metadata() responses.
interface MetricMapping {
  metricId: string;
  dataset: string;
  filters: Record<string, string>;
  // Which parser to use (default: "plfs")
  parser?: "plfs" | "cpi" | "asi";
}

// PLFS filter code reference (from 3_get_metadata responses):
// indicator_code: 1=LFPR, 2=WPR, 3=UR, 4=worker_distribution, 5=employment_conditions, 6=regular_wage, 7=casual_wage, 8=self_employment_earnings
// frequency_code: 1=Annual, 2=Quarterly, 3=Monthly
// age_code: 1="15 years and above", 2="15-29 years", 3="15-59 years", 4="all"
// gender_code: 1=male, 2=female, 3=person
// sector_code: 1=rural, 2=urban, 3="rural + urban"
// education_code: 10="all"
// religion_code: 1="all"
// social_category_code: 1="all"
// broad_status_employment_code: 1=self-employed OAW, 2=self-employed helper, 3=all self-employed, 4=regular_wage/salary, 5=casual_labour, 6=all

const METRIC_MAPPINGS: MetricMapping[] = [
  // PLFS: Labour Force Participation Rate — Person, 15+, rural+urban
  {
    metricId: "emp-lfpr-total",
    dataset: "PLFS",
    filters: {
      indicator_code: "1",
      frequency_code: "1",
      age_code: "1",
      gender_code: "3",
      sector_code: "3",
      education_code: "10",
      religion_code: "1",
      social_category_code: "1",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Labour Force Participation Rate — Female, 15+
  {
    metricId: "emp-lfpr-female",
    dataset: "PLFS",
    filters: {
      indicator_code: "1",
      frequency_code: "1",
      age_code: "1",
      gender_code: "2",
      sector_code: "3",
      education_code: "10",
      religion_code: "1",
      social_category_code: "1",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Unemployment Rate — Person, 15+
  {
    metricId: "emp-unemployment",
    dataset: "PLFS",
    filters: {
      indicator_code: "3",
      frequency_code: "1",
      age_code: "1",
      gender_code: "3",
      sector_code: "3",
      education_code: "10",
      religion_code: "1",
      social_category_code: "1",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Youth Unemployment Rate — Person, 15-29
  {
    metricId: "emp-youth-unemployment",
    dataset: "PLFS",
    filters: {
      indicator_code: "3",
      frequency_code: "1",
      age_code: "2",
      gender_code: "3",
      sector_code: "3",
      education_code: "10",
      religion_code: "1",
      social_category_code: "1",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Worker distribution — regular wage/salary, person
  // indicator_code=4, broad_status_employment_code=4 (regular wage/salary)
  {
    metricId: "emp-regular-salaried",
    dataset: "PLFS",
    filters: {
      indicator_code: "4",
      frequency_code: "1",
      broad_status_employment_code: "4",
      gender_code: "3",
      sector_code: "3",
      broad_industry_work_code: "4",
      enterprise_type_code: "9",
      enterprise_size_code: "6",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Average daily wage from casual labour — person, rural+urban
  // indicator_code=7, gender_code=3, sector_code=3
  {
    metricId: "emp-avg-daily-wage",
    dataset: "PLFS",
    filters: {
      indicator_code: "7",
      frequency_code: "1",
      gender_code: "3",
      sector_code: "3",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Worker Population Ratio — Person, 15+, rural+urban
  {
    metricId: "emp-wpr-total",
    dataset: "PLFS",
    filters: {
      indicator_code: "2",
      frequency_code: "1",
      age_code: "1",
      gender_code: "3",
      sector_code: "3",
      education_code: "10",
      religion_code: "1",
      social_category_code: "1",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  // PLFS: Average monthly earnings from regular wage/salary employment — Person
  {
    metricId: "emp-regular-wage",
    dataset: "PLFS",
    filters: {
      indicator_code: "6",
      frequency_code: "1",
      gender_code: "3",
      sector_code: "3",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },

  // === CPI (Consumer Price Index) ===
  // base_year=2012, series=Current, sector_code=3 (Combined), group_code=0 (General)
  // CPI uses a different response format: { state, year, month, index, inflation }
  {
    metricId: "prices-cpi-general",
    dataset: "CPI",
    parser: "cpi",
    filters: {
      base_year: "2012",
      series: "Current",
      month_code: "12", // December (annual snapshot)
      sector_code: "3",
      group_code: "0",
      subgroup_code: "0.99",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },

  // === ASI (Annual Survey of Industries) ===
  // classification_year=2008, sector_code=Combined, nic_code=99999 (all industries), nic_type=2-digit
  // ASI uses a different response format: { state, year, indicator, value }
  {
    metricId: "ind-factories",
    dataset: "ASI",
    parser: "asi",
    filters: {
      classification_year: "2008",
      sector_code: "Combined",
      indicator_code: "1", // Number of Factories
      nic_code: "99999",
      nic_type: "2-digit",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  {
    metricId: "ind-factory-workers",
    dataset: "ASI",
    parser: "asi",
    filters: {
      classification_year: "2008",
      sector_code: "Combined",
      indicator_code: "32", // Total Number of Workers
      nic_code: "99999",
      nic_type: "2-digit",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
  {
    metricId: "ind-factory-gva",
    dataset: "ASI",
    parser: "asi",
    filters: {
      classification_year: "2008",
      sector_code: "Combined",
      indicator_code: "19", // Gross Value Added
      nic_code: "99999",
      nic_type: "2-digit",
      Format: "JSON",
      limit: String(PAGE_LIMIT),
    },
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cacheWrite(name: string, data: string) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  fs.writeFileSync(path.join(CACHE_DIR, `${safeName}.json`), data, "utf-8");
}

function extractTextContent(result: unknown): string {
  const r = result as { content?: Array<{ type: string; text?: string }> };
  if (r?.content) {
    return r.content
      .filter((c) => c.type === "text")
      .map((c) => c.text || "")
      .join("\n");
  }
  return JSON.stringify(result);
}

interface DataRow {
  metric_id: string;
  state_id: string | null;
  year: number;
  period: string | null;
  value: number;
  gender: string | null;
  sector: string | null;
  age_group: string | null;
  social_group: string | null;
  status: string;
  source_ref: string;
}

function parseYear(yearStr: string): number {
  // Handle "2023-24" format → 2023
  const match = yearStr.match(/^(\d{4})/);
  return match ? parseInt(match[1]) : 0;
}

function parsePLFSResponse(content: string, metricId: string): DataRow[] {
  const rows: DataRow[] = [];

  try {
    const parsed = JSON.parse(content);
    const data = parsed.data || parsed;
    if (!Array.isArray(data)) return rows;

    for (const item of data) {
      const stateName = item.state || item.State || item["State/UT"] || "";
      const stateId = resolveStateId(stateName);
      if (!stateId) continue; // Skip "All India" and unknown states

      const yearStr = item.year || item.Year || "";
      const year = parseYear(yearStr);
      if (year === 0) continue;

      const rawVal = item.value ?? item.Value;
      if (rawVal == null || rawVal === "") continue;
      const value = parseFloat(rawVal);
      if (isNaN(value)) continue;

      rows.push({
        metric_id: metricId,
        state_id: stateId,
        year,
        period: yearStr,
        value,
        gender: item.gender || item.Gender || null,
        sector: item.sector || item.Sector || null,
        age_group: item.AgeGroup || item.age_group || null,
        social_group: item.socialGroup || null,
        status: "final",
        source_ref: "MoSPI PLFS",
      });
    }
  } catch {
    console.warn(`    Failed to parse response as JSON`);
  }

  return rows;
}

// CPI response: { baseyear, year, month, state, sector, group, subgroup, index, inflation, status }
// We use the "index" field as the value.
function parseCPIResponse(content: string, metricId: string): DataRow[] {
  const rows: DataRow[] = [];

  try {
    const parsed = JSON.parse(content);
    const data = parsed.data || parsed;
    if (!Array.isArray(data)) return rows;

    for (const item of data) {
      const stateName = item.state || "";
      const stateId = resolveStateId(stateName);
      if (!stateId) continue;

      const year = typeof item.year === "number" ? item.year : parseInt(item.year);
      if (!year || isNaN(year)) continue;

      if (item.index == null || item.index === "") continue;
      const value = parseFloat(item.index);
      if (isNaN(value)) continue;

      rows.push({
        metric_id: metricId,
        state_id: stateId,
        year,
        period: `${year}-${item.month || ""}`.trim(),
        value,
        gender: null,
        sector: item.sector || null,
        age_group: null,
        social_group: null,
        status: item.status === "F" ? "final" : "provisional",
        source_ref: "MoSPI CPI",
      });
    }
  } catch {
    console.warn(`    Failed to parse CPI response as JSON`);
  }

  return rows;
}

// ASI response: { nic_classification, year, state, sector, indicator, nic_code, nic_description, nic_type, value, unit }
function parseASIResponse(content: string, metricId: string): DataRow[] {
  const rows: DataRow[] = [];

  try {
    const parsed = JSON.parse(content);
    const data = parsed.data || parsed;
    if (!Array.isArray(data)) return rows;

    for (const item of data) {
      const stateName = item.state || "";
      const stateId = resolveStateId(stateName);
      if (!stateId) continue;

      const yearStr = item.year || "";
      const year = parseYear(yearStr);
      if (year === 0) continue;

      if (item.value == null || item.value === "") continue;
      const value = parseFloat(item.value);
      if (isNaN(value)) continue;

      rows.push({
        metric_id: metricId,
        state_id: stateId,
        year,
        period: yearStr,
        value,
        gender: null,
        sector: item.sector || null,
        age_group: null,
        social_group: null,
        status: "final",
        source_ref: "MoSPI ASI",
      });
    }
  } catch {
    console.warn(`    Failed to parse ASI response as JSON`);
  }

  return rows;
}

function parseResponse(content: string, metricId: string, parser: string): DataRow[] {
  switch (parser) {
    case "cpi": return parseCPIResponse(content, metricId);
    case "asi": return parseASIResponse(content, metricId);
    default: return parsePLFSResponse(content, metricId);
  }
}

async function main() {
  console.log("=== MoSPI MCP Ingestion ===\n");

  // Open database
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Log ingestion start
  const log = db.prepare(
    "INSERT INTO ingestion_log (source, status) VALUES ('mospi-mcp', 'running')"
  ).run();
  const logId = log.lastInsertRowid;

  let totalRows = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Connect to MCP server
    console.log("Connecting to MoSPI MCP server...");
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    const client = new Client({ name: "npl-ingestion", version: "1.0.0" });
    await client.connect(transport);
    console.log("Connected!\n");

    // Step 1: Discover (required by API before other calls)
    console.log("Step 1: Discovering datasets...");
    const discovery = await client.callTool({
      name: "1_know_about_mospi_api",
      arguments: {},
    });
    cacheWrite("1_discovery", extractTextContent(discovery));
    console.log("Datasets discovered.\n");
    await delay(CALL_DELAY_MS);

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO data_points
        (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
      VALUES
        (@metric_id, @state_id, @year, @period, @value, @gender, @sector, @age_group, @social_group, @status, @source_ref)
    `);

    const insertBatch = db.transaction((dataRows: DataRow[]) => {
      let count = 0;
      for (const row of dataRows) {
        if (row.state_id && row.value !== null && !isNaN(row.value)) {
          insertStmt.run(row);
          count++;
        }
      }
      return count;
    });

    // Fetch all years for each metric to get a time series
    for (const mapping of METRIC_MAPPINGS) {
      console.log(`\nFetching: ${mapping.metricId}`);
      console.log(`  Filters: ${JSON.stringify(mapping.filters)}`);

      try {
        const dataResult = await client.callTool({
          name: "4_get_data",
          arguments: {
            dataset: mapping.dataset,
            filters: mapping.filters,
          },
        });
        const dataContent = extractTextContent(dataResult);
        cacheWrite(`data_${mapping.metricId}`, dataContent);
        await delay(CALL_DELAY_MS);

        const rows = parseResponse(dataContent, mapping.metricId, mapping.parser || "plfs");
        const inserted = insertBatch(rows);
        totalRows += inserted;
        succeeded++;
        console.log(`  Parsed ${rows.length} rows, inserted ${inserted} (with valid state IDs)`);
      } catch (err) {
        console.error(`  Error: ${(err as Error).message}`);
        failed++;
      }
    }

    await client.close();
    console.log("\nMCP connection closed.");
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error("Fatal error:", errorMsg);
    db.prepare(
      "UPDATE ingestion_log SET status = 'error', error = ?, completed_at = datetime('now') WHERE id = ?"
    ).run(errorMsg, logId);
    db.close();
    process.exit(1);
  }

  // Update log
  db.prepare(
    "UPDATE ingestion_log SET status = 'completed', rows_added = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(totalRows, logId);

  console.log(`\n=== Done: ${totalRows} total rows ingested (${succeeded} metrics ok, ${failed} failed) ===`);
  db.close();
}

main().catch(console.error);
