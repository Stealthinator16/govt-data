/**
 * DFI Chart Fetcher
 *
 * Fetches chart data from Data For India (dataforindia.com) via their
 * public Typesense search API and S3 chart storage.
 *
 * Usage: npx tsx scripts/scrape-dfi.ts
 *
 * Output: data/cache/dfi/{slug}/{chartId}/config.json + data.json
 *         data/cache/dfi/manifest.json
 */
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "cache", "dfi");

const TYPESENSE_URL =
  "https://epb7kdvygc3o40wtp-1.a1.typesense.net/collections/ghost-staging/documents/search";
const TYPESENSE_KEY = "3vbg4z7ugEGM4kJ4iJ4XzYxOAjOO40N8";
const S3_BASE = "https://assets.dataforindia.com/charts";

// Dynamically discover all article slugs from Typesense
async function discoverAllSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const perPage = 50;
  while (true) {
    const url = `${TYPESENSE_URL}?q=*&query_by=title&per_page=${perPage}&page=${page}&x-typesense-api-key=${TYPESENSE_KEY}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const json = await res.json();
    const hits = json.hits || [];
    if (hits.length === 0) break;
    for (const h of hits) slugs.push(h.document.slug);
    if (hits.length < perPage) break;
    page++;
  }
  return slugs;
}

const CHART_ID_REGEX = /charts\.dataforindia\.com\/charts\/([a-f0-9]{32})/g;

interface ManifestEntry {
  slug: string;
  chartId: string;
  configPath: string;
  dataPath: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchArticleHtml(slug: string): Promise<string | null> {
  const url = `${TYPESENSE_URL}?q=*&query_by=title&filter_by=slug:${slug}&x-typesense-api-key=${TYPESENSE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Typesense error for ${slug}: ${res.status}`);
    return null;
  }
  const json = await res.json();
  const hits = json.hits;
  if (!hits || hits.length === 0) {
    console.warn(`  No article found for slug: ${slug}`);
    return null;
  }
  return hits[0].document.html || hits[0].document.plaintext || null;
}

function extractChartIds(html: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = CHART_ID_REGEX.exec(html)) !== null) {
    if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

async function fetchChartFile(
  chartId: string,
  file: "config.json" | "data.json"
): Promise<unknown | null> {
  const url = `${S3_BASE}/${chartId}/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Failed to fetch ${file} for ${chartId}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function main() {
  console.log("=== DFI Chart Fetcher ===\n");

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const manifest: ManifestEntry[] = [];
  let totalCharts = 0;

  console.log("Discovering all articles...");
  const allSlugs = await discoverAllSlugs();
  console.log(`Found ${allSlugs.length} articles\n`);

  for (const slug of allSlugs) {
    console.log(`\nArticle: ${slug}`);
    const html = await fetchArticleHtml(slug);
    if (!html) continue;

    const chartIds = extractChartIds(html);
    console.log(`  Found ${chartIds.length} charts`);
    if (chartIds.length === 0) continue;

    const slugDir = path.join(CACHE_DIR, slug);
    fs.mkdirSync(slugDir, { recursive: true });

    for (const chartId of chartIds) {
      const chartDir = path.join(slugDir, chartId);

      // Skip if already cached
      const configPath = path.join(chartDir, "config.json");
      const dataPath = path.join(chartDir, "data.json");
      if (fs.existsSync(configPath) && fs.existsSync(dataPath)) {
        console.log(`  ${chartId} (cached)`);
        manifest.push({
          slug,
          chartId,
          configPath: path.relative(CACHE_DIR, configPath),
          dataPath: path.relative(CACHE_DIR, dataPath),
        });
        totalCharts++;
        continue;
      }

      fs.mkdirSync(chartDir, { recursive: true });

      const config = await fetchChartFile(chartId, "config.json");
      await sleep(200);
      const data = await fetchChartFile(chartId, "data.json");
      await sleep(200);

      if (!config || !data) {
        console.log(`  ${chartId} (failed)`);
        continue;
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log(`  ${chartId} (fetched)`);

      manifest.push({
        slug,
        chartId,
        configPath: path.relative(CACHE_DIR, configPath),
        dataPath: path.relative(CACHE_DIR, dataPath),
      });
      totalCharts++;
    }
  }

  // Write manifest
  const manifestPath = path.join(CACHE_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n=== Done: ${totalCharts} charts from ${allSlugs.length} articles ===`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch(console.error);
