/**
 * DFI Chart Inspector
 *
 * Examines cached chart data to understand its structure.
 * Usage: npx tsx scripts/dfi-inspect.ts <chartId>
 *        npx tsx scripts/dfi-inspect.ts --all   (list all cached charts)
 */
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "cache", "dfi");

function inspectChart(chartDir: string, chartId: string) {
  const configPath = path.join(chartDir, "config.json");
  const dataPath = path.join(chartDir, "data.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`No data.json found for ${chartId}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : null;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`Chart: ${chartId}`);
  if (config?.title) console.log(`Title: ${config.title}`);
  if (config?.subtitle) console.log(`Subtitle: ${config.subtitle}`);
  console.log(`${"═".repeat(60)}`);

  // Data structure
  const fields = data.fields || [];
  const rows = data.rows || [];
  const labels = data.labels || {};
  const valueLabels = data.value_labels || {};

  console.log(`\nFields (${fields.length}):`);
  for (const f of fields) {
    const label = labels[f] || "";
    const hasVL = valueLabels[f] ? ` [${Object.keys(valueLabels[f]).length} value labels]` : "";
    console.log(`  ${f} — ${label}${hasVL}`);
  }

  console.log(`\nRows: ${rows.length}`);

  // Sample rows
  const sample = rows.slice(0, 3);
  if (sample.length > 0) {
    console.log(`\nSample rows:`);
    for (const row of sample) {
      const parts = fields.map(
        (f: string) => `${f}=${row[f]}`
      );
      console.log(`  { ${parts.join(", ")} }`);
    }
  }

  // Show value labels for coded fields
  for (const [field, vlMap] of Object.entries(valueLabels)) {
    const vl = vlMap as Record<string, string>;
    const entries = Object.entries(vl);
    if (entries.length > 0 && entries.length <= 40) {
      console.log(`\nValue labels for ${field}:`);
      for (const [code, label] of entries) {
        console.log(`  ${code} → ${label}`);
      }
    }
  }
}

function findChartDir(chartId: string): string | null {
  // Search all slug dirs
  if (!fs.existsSync(CACHE_DIR)) return null;
  for (const slug of fs.readdirSync(CACHE_DIR)) {
    const slugDir = path.join(CACHE_DIR, slug);
    if (!fs.statSync(slugDir).isDirectory()) continue;
    const chartDir = path.join(slugDir, chartId);
    if (fs.existsSync(chartDir)) return chartDir;
  }
  return null;
}

function listAll() {
  const manifestPath = path.join(CACHE_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("No manifest.json found. Run scrape-dfi.ts first.");
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`\n${manifest.length} cached charts:\n`);
  for (const entry of manifest) {
    const configPath = path.join(CACHE_DIR, entry.configPath);
    let title = "";
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      title = config.title || "";
    }
    console.log(`  ${entry.slug}/${entry.chartId}  ${title}`);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npx tsx scripts/dfi-inspect.ts <chartId|--all>");
  process.exit(1);
}

if (arg === "--all") {
  listAll();
} else {
  const dir = findChartDir(arg);
  if (!dir) {
    console.error(`Chart ${arg} not found in cache.`);
    process.exit(1);
  }
  inspectChart(dir, arg);
}
