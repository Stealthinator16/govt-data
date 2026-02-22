/**
 * MoSPI MCP Ingestion Script
 *
 * Connects to the MoSPI MCP server (https://mcp.mospi.gov.in/sse) and fetches
 * data from available datasets using the 4-step workflow:
 * 1. know_about_mospi_api() → dataset list
 * 2. get_indicators(dataset) → indicator list
 * 3. get_metadata(dataset, indicator) → filter values
 * 4. get_data(dataset, filters) → actual data
 *
 * Transforms and inserts data into the SQLite database.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");
const MCP_URL = "https://mcp.mospi.gov.in/sse";

// State name mapping: MoSPI names → our state IDs
const STATE_NAME_MAP: Record<string, string> = {
  "andhra pradesh": "andhra-pradesh",
  "arunachal pradesh": "arunachal-pradesh",
  "assam": "assam",
  "bihar": "bihar",
  "chhattisgarh": "chhattisgarh",
  "goa": "goa",
  "gujarat": "gujarat",
  "haryana": "haryana",
  "himachal pradesh": "himachal-pradesh",
  "jharkhand": "jharkhand",
  "karnataka": "karnataka",
  "kerala": "kerala",
  "madhya pradesh": "madhya-pradesh",
  "maharashtra": "maharashtra",
  "manipur": "manipur",
  "meghalaya": "meghalaya",
  "mizoram": "mizoram",
  "nagaland": "nagaland",
  "odisha": "odisha",
  "orissa": "odisha",
  "punjab": "punjab",
  "rajasthan": "rajasthan",
  "sikkim": "sikkim",
  "tamil nadu": "tamil-nadu",
  "telangana": "telangana",
  "tripura": "tripura",
  "uttar pradesh": "uttar-pradesh",
  "uttarakhand": "uttarakhand",
  "uttaranchal": "uttarakhand",
  "west bengal": "west-bengal",
  "andaman & nicobar islands": "andaman-nicobar",
  "andaman and nicobar islands": "andaman-nicobar",
  "a & n islands": "andaman-nicobar",
  "chandigarh": "chandigarh",
  "dadra & nagar haveli and daman & diu": "dadra-nagar-haveli-daman-diu",
  "dadra and nagar haveli": "dadra-nagar-haveli-daman-diu",
  "daman and diu": "dadra-nagar-haveli-daman-diu",
  "d & n haveli and daman & diu": "dadra-nagar-haveli-daman-diu",
  "nct of delhi": "delhi",
  "delhi": "delhi",
  "jammu & kashmir": "jammu-kashmir",
  "jammu and kashmir": "jammu-kashmir",
  "ladakh": "ladakh",
  "lakshadweep": "lakshadweep",
  "puducherry": "puducherry",
  "pondicherry": "puducherry",
};

function resolveStateId(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  // Direct match
  if (STATE_NAME_MAP[normalized]) return STATE_NAME_MAP[normalized];
  // Fuzzy: try removing extra spaces
  const cleaned = normalized.replace(/\s+/g, " ");
  if (STATE_NAME_MAP[cleaned]) return STATE_NAME_MAP[cleaned];
  // Skip "all india" or aggregate rows
  if (cleaned.includes("all india") || cleaned === "india" || cleaned === "all states") return null;
  console.warn(`  Unknown state name: "${name}"`);
  return null;
}

// Metric mapping: which MoSPI indicators map to our metric IDs
interface MetricMapping {
  metricId: string;
  dataset: string;
  indicator: string;
  filters?: Record<string, string>;
}

const METRIC_MAPPINGS: MetricMapping[] = [
  // NAS (National Accounts Statistics)
  {
    metricId: "eco-gsdp-per-capita",
    dataset: "National Account Statistics",
    indicator: "Per Capita NSDP",
    filters: { "Price Type": "Current Prices" },
  },
  {
    metricId: "eco-gsdp-absolute",
    dataset: "National Account Statistics",
    indicator: "GSDP",
    filters: { "Price Type": "Current Prices" },
  },
  {
    metricId: "eco-gsdp-growth",
    dataset: "National Account Statistics",
    indicator: "Growth Rate of GSDP",
    filters: { "Price Type": "Constant Prices" },
  },
  // PLFS (Periodic Labour Force Survey)
  {
    metricId: "emp-lfpr-total",
    dataset: "Periodic Labour Force Survey",
    indicator: "Labour Force Participation Rate",
    filters: { "Age Group": "15 years & above", "Sex": "Person" },
  },
  {
    metricId: "emp-lfpr-female",
    dataset: "Periodic Labour Force Survey",
    indicator: "Labour Force Participation Rate",
    filters: { "Age Group": "15 years & above", "Sex": "Female" },
  },
  {
    metricId: "emp-unemployment",
    dataset: "Periodic Labour Force Survey",
    indicator: "Unemployment Rate",
    filters: { "Age Group": "15 years & above", "Sex": "Person" },
  },
  {
    metricId: "emp-youth-unemployment",
    dataset: "Periodic Labour Force Survey",
    indicator: "Unemployment Rate",
    filters: { "Age Group": "15-29 years", "Sex": "Person" },
  },
];

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

  try {
    // Connect to MCP server
    console.log("Connecting to MoSPI MCP server...");
    const transport = new SSEClientTransport(new URL(MCP_URL));
    const client = new Client({ name: "npl-ingestion", version: "1.0.0" });
    await client.connect(transport);
    console.log("Connected!\n");

    // Step 1: Discover available datasets
    console.log("Step 1: Discovering datasets...");
    const discovery = await client.callTool({
      name: "1_know_about_mospi_api",
      arguments: {},
    });
    console.log("Available datasets discovered.\n");

    // Process each metric mapping
    for (const mapping of METRIC_MAPPINGS) {
      console.log(`\nFetching: ${mapping.metricId} (${mapping.indicator})`);

      try {
        // Step 2: Get indicators for dataset
        const indicators = await client.callTool({
          name: "2_get_indicators",
          arguments: { dataset: mapping.dataset },
        });

        // Step 3: Get metadata (available states, years, filter values)
        const metadata = await client.callTool({
          name: "3_get_metadata",
          arguments: {
            dataset: mapping.dataset,
            indicator: mapping.indicator,
          },
        });

        // Parse metadata to find available filter values
        const metadataContent = extractTextContent(metadata);

        // Step 4: Get actual data
        const dataResult = await client.callTool({
          name: "4_get_data",
          arguments: {
            dataset: mapping.dataset,
            indicator: mapping.indicator,
            ...(mapping.filters || {}),
          },
        });

        const dataContent = extractTextContent(dataResult);
        const rows = parseDataResponse(dataContent, mapping.metricId);

        // Insert into database
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO data_points
            (metric_id, state_id, year, period, value, gender, sector, age_group, social_group, status, source_ref)
          VALUES
            (@metric_id, @state_id, @year, @period, @value, @gender, @sector, @age_group, @social_group, @status, @source_ref)
        `);

        const insertBatch = db.transaction((dataRows: typeof rows) => {
          let count = 0;
          for (const row of dataRows) {
            if (row.state_id && row.value !== null && !isNaN(row.value)) {
              insertStmt.run(row);
              count++;
            }
          }
          return count;
        });

        const inserted = insertBatch(rows);
        totalRows += inserted;
        console.log(`  Inserted ${inserted} rows`);
      } catch (err) {
        console.error(`  Error fetching ${mapping.metricId}:`, (err as Error).message);
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

  console.log(`\n=== Done: ${totalRows} total rows ingested ===`);
  db.close();
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

function parseDataResponse(
  content: string,
  metricId: string
): Array<{
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
}> {
  const rows: ReturnType<typeof parseDataResponse> = [];

  // Try parsing as JSON first
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      for (const item of data) {
        const stateName = item.State || item.state || item["State/UT"] || item.state_ut || "";
        const stateId = resolveStateId(stateName);
        const year = parseInt(item.Year || item.year || item.period || "0");
        const value = parseFloat(item.Value || item.value || item.data || "0");

        if (year > 0) {
          rows.push({
            metric_id: metricId,
            state_id: stateId,
            year,
            period: item.Period || item.period || null,
            value,
            gender: item.Sex || item.Gender || null,
            sector: item.Sector || item.Area || null,
            age_group: item["Age Group"] || item.age_group || null,
            social_group: item["Social Group"] || null,
            status: "final",
            source_ref: "MoSPI MCP",
          });
        }
      }
      return rows;
    }
  } catch {
    // Not JSON, try parsing as table/text
  }

  // Try parsing as text table (pipe-separated or tab-separated)
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length > 1) {
    const sep = lines[0].includes("|") ? "|" : "\t";
    const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());

    const stateIdx = headers.findIndex((h) =>
      ["state", "state/ut", "state_ut", "states", "region"].includes(h)
    );
    const valueIdx = headers.findIndex((h) => ["value", "data", "figure"].includes(h));
    const yearIdx = headers.findIndex((h) => ["year", "period", "time"].includes(h));

    if (stateIdx >= 0 && (valueIdx >= 0 || headers.length > stateIdx + 1)) {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map((c) => c.trim());
        const stateName = cols[stateIdx] || "";
        const stateId = resolveStateId(stateName);
        const value = parseFloat(cols[valueIdx >= 0 ? valueIdx : stateIdx + 1] || "0");
        const year = yearIdx >= 0 ? parseInt(cols[yearIdx]) : 2023;

        if (!isNaN(value)) {
          rows.push({
            metric_id: metricId,
            state_id: stateId,
            year,
            period: null,
            value,
            gender: null,
            sector: null,
            age_group: null,
            social_group: null,
            status: "final",
            source_ref: "MoSPI MCP",
          });
        }
      }
    }
  }

  return rows;
}

main().catch(console.error);
