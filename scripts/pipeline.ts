/**
 * Pipeline Orchestrator
 *
 * Runs the full data pipeline in order:
 * 1. Seed reference data
 * 2. Ingest from MoSPI MCP
 * 3. Compute scores
 * 4. Validate data
 * 5. Generate JSON bundles
 */
import { execSync } from "child_process";

const steps = [
  { name: "Seed Reference Data", script: "scripts/seed-reference.ts" },
  { name: "Ingest MoSPI Data", script: "scripts/ingest-mospi.ts" },
  { name: "Compute Scores", script: "scripts/compute-scores.ts" },
  { name: "Validate Data", script: "scripts/validate-data.ts" },
  { name: "Generate JSON", script: "scripts/generate-json.ts" },
];

async function main() {
  console.log("╔══════════════════════════════════╗");
  console.log("║   NPL Data Pipeline              ║");
  console.log("╚══════════════════════════════════╝\n");

  const startTime = Date.now();

  for (const step of steps) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`▶ ${step.name}`);
    console.log(`${"─".repeat(50)}\n`);

    try {
      execSync(`npx tsx ${step.script}`, {
        stdio: "inherit",
        timeout: 300000, // 5 min timeout per step
      });
    } catch (err) {
      console.error(`\n✗ FAILED: ${step.name}`);
      console.error((err as Error).message);
      process.exit(1);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(50)}`);
  console.log(`✓ Pipeline complete in ${elapsed}s`);
  console.log(`${"═".repeat(50)}`);
}

main();
