import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "npl.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: false });
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function getReadonlyDb(): Database.Database {
  return new Database(DB_PATH, { readonly: true });
}

export const SCHEMA = `
-- Reference tables
CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code_mospi TEXT,
  type TEXT NOT NULL CHECK(type IN ('state', 'ut')),
  population INTEGER,
  area_sq_km REAL,
  region TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  unit TEXT,
  source TEXT,
  polarity TEXT NOT NULL CHECK(polarity IN ('positive', 'negative')) DEFAULT 'positive',
  weight REAL NOT NULL DEFAULT 1.0,
  disaggregations TEXT, -- JSON
  is_featured INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  source_url TEXT
);

-- Data
CREATE TABLE IF NOT EXISTS data_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_id TEXT NOT NULL REFERENCES metrics(id),
  state_id TEXT NOT NULL REFERENCES states(id),
  year INTEGER NOT NULL,
  period TEXT,
  value REAL NOT NULL,
  gender TEXT,
  sector TEXT,
  age_group TEXT,
  social_group TEXT,
  status TEXT DEFAULT 'final',
  source_ref TEXT,
  UNIQUE(metric_id, state_id, year, period, gender, sector, age_group, social_group)
);

CREATE INDEX IF NOT EXISTS idx_dp_metric_state_year ON data_points(metric_id, state_id, year);
CREATE INDEX IF NOT EXISTS idx_dp_state_year ON data_points(state_id, year);
CREATE INDEX IF NOT EXISTS idx_dp_metric_year ON data_points(metric_id, year);

-- Computed scores
CREATE TABLE IF NOT EXISTS metric_scores (
  metric_id TEXT NOT NULL REFERENCES metrics(id),
  state_id TEXT NOT NULL REFERENCES states(id),
  year INTEGER NOT NULL,
  raw_value REAL NOT NULL,
  norm_score REAL NOT NULL,
  rank INTEGER NOT NULL,
  PRIMARY KEY (metric_id, state_id, year)
);

CREATE TABLE IF NOT EXISTS category_scores (
  category_id TEXT NOT NULL REFERENCES categories(id),
  state_id TEXT NOT NULL REFERENCES states(id),
  year INTEGER NOT NULL,
  score REAL NOT NULL,
  rank INTEGER NOT NULL,
  metrics_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, state_id, year)
);

CREATE TABLE IF NOT EXISTS overall_scores (
  state_id TEXT NOT NULL REFERENCES states(id),
  year INTEGER NOT NULL,
  score REAL NOT NULL,
  rank INTEGER NOT NULL,
  tier TEXT NOT NULL,
  PRIMARY KEY (state_id, year)
);

-- Pipeline tracking
CREATE TABLE IF NOT EXISTS ingestion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  rows_added INTEGER DEFAULT 0,
  error TEXT
);
`;
