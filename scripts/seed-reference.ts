/**
 * Seeds the SQLite database with reference data:
 * - Creates schema (tables + indexes)
 * - Inserts states from data/reference/states.json
 * - Inserts categories from data/reference/categories.json
 * - Inserts metrics from data/reference/metrics.json
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA } from "../lib/db";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Remove existing DB to start fresh
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("Removed existing database");
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create schema
console.log("Creating schema...");
db.exec(SCHEMA);

// Load reference data
const statesPath = path.join(process.cwd(), "data", "reference", "states.json");
const categoriesPath = path.join(process.cwd(), "data", "reference", "categories.json");
const metricsPath = path.join(process.cwd(), "data", "reference", "metrics.json");

const states = JSON.parse(fs.readFileSync(statesPath, "utf-8"));
const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));

// Insert states
console.log(`Inserting ${states.length} states...`);
const insertState = db.prepare(`
  INSERT OR REPLACE INTO states (id, name, code_mospi, type, population, area_sq_km, region)
  VALUES (@id, @name, @code_mospi, @type, @population, @area_sq_km, @region)
`);

const insertStates = db.transaction((rows: typeof states) => {
  for (const row of rows) insertState.run(row);
});
insertStates(states);

// Insert categories
console.log(`Inserting ${categories.length} categories...`);
const insertCategory = db.prepare(`
  INSERT OR REPLACE INTO categories (id, name, description, icon, sort_order)
  VALUES (@id, @name, @description, @icon, @sort_order)
`);

const insertCategories = db.transaction((rows: typeof categories) => {
  for (const row of rows) insertCategory.run(row);
});
insertCategories(categories);

// Insert metrics
console.log(`Inserting ${metrics.length} metrics...`);
const insertMetric = db.prepare(`
  INSERT OR REPLACE INTO metrics (id, category_id, name, unit, source, polarity, weight, is_featured, description, source_url)
  VALUES (@id, @category_id, @name, @unit, @source, @polarity, @weight, @is_featured, @description, @source_url)
`);

const insertMetrics = db.transaction((rows: typeof metrics) => {
  for (const row of rows) {
    insertMetric.run({
      ...row,
      is_featured: row.is_featured ? 1 : 0,
      description: row.description ?? null,
      source_url: row.source_url ?? null,
    });
  }
});
insertMetrics(metrics);

// Verify
const stateCount = db.prepare("SELECT COUNT(*) as count FROM states").get() as { count: number };
const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
const metricCount = db.prepare("SELECT COUNT(*) as count FROM metrics").get() as { count: number };

console.log(`\nSeeded successfully:`);
console.log(`  States:     ${stateCount.count}`);
console.log(`  Categories: ${catCount.count}`);
console.log(`  Metrics:    ${metricCount.count}`);

db.close();
