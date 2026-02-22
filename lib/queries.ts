import { getReadonlyDb } from "./db";
import type {
  State,
  Category,
  Metric,
  CategoryScore,
  OverallScore,
  MetricScore,
} from "./types";

// ─── State Queries ───

export function getAllStates(): State[] {
  const db = getReadonlyDb();
  try {
    return db.prepare("SELECT * FROM states ORDER BY name").all() as State[];
  } finally {
    db.close();
  }
}

export function getStateById(id: string): State | undefined {
  const db = getReadonlyDb();
  try {
    return db.prepare("SELECT * FROM states WHERE id = ?").get(id) as State | undefined;
  } finally {
    db.close();
  }
}

// ─── Category Queries ───

export function getAllCategories(): Category[] {
  const db = getReadonlyDb();
  try {
    return db.prepare("SELECT * FROM categories ORDER BY sort_order").all() as Category[];
  } finally {
    db.close();
  }
}

export function getCategoryById(id: string): Category | undefined {
  const db = getReadonlyDb();
  try {
    return db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Category | undefined;
  } finally {
    db.close();
  }
}

// ─── Metric Queries ───

export function getMetricsByCategory(categoryId: string): Metric[] {
  const db = getReadonlyDb();
  try {
    return db
      .prepare("SELECT * FROM metrics WHERE category_id = ? ORDER BY weight DESC, name")
      .all(categoryId) as Metric[];
  } finally {
    db.close();
  }
}

export function getFeaturedMetrics(): Metric[] {
  const db = getReadonlyDb();
  try {
    return db
      .prepare("SELECT * FROM metrics WHERE is_featured = 1 ORDER BY category_id, name")
      .all() as Metric[];
  } finally {
    db.close();
  }
}

// ─── Score Queries ───

export function getOverallRankings(year?: number): (OverallScore & { state_name: string; state_type: string })[] {
  const db = getReadonlyDb();
  try {
    const targetYear = year ?? getLatestYear(db);
    if (!targetYear) return [];
    return db
      .prepare(
        `SELECT o.*, s.name as state_name, s.type as state_type
         FROM overall_scores o
         JOIN states s ON s.id = o.state_id
         WHERE o.year = ?
         ORDER BY o.rank`
      )
      .all(targetYear) as (OverallScore & { state_name: string; state_type: string })[];
  } finally {
    db.close();
  }
}

export function getCategoryRankings(
  categoryId: string,
  year?: number
): (CategoryScore & { state_name: string; state_type: string })[] {
  const db = getReadonlyDb();
  try {
    const targetYear = year ?? getLatestYear(db);
    if (!targetYear) return [];
    return db
      .prepare(
        `SELECT c.*, s.name as state_name, s.type as state_type
         FROM category_scores c
         JOIN states s ON s.id = c.state_id
         WHERE c.category_id = ? AND c.year = ?
         ORDER BY c.rank`
      )
      .all(categoryId, targetYear) as (CategoryScore & {
      state_name: string;
      state_type: string;
    })[];
  } finally {
    db.close();
  }
}

export function getStateScores(
  stateId: string,
  year?: number
): { overall: OverallScore | undefined; categories: (CategoryScore & { category_name: string })[] } {
  const db = getReadonlyDb();
  try {
    const targetYear = year ?? getLatestYear(db);
    if (!targetYear) return { overall: undefined, categories: [] };

    const overall = db
      .prepare("SELECT * FROM overall_scores WHERE state_id = ? AND year = ?")
      .get(stateId, targetYear) as OverallScore | undefined;

    const categories = db
      .prepare(
        `SELECT cs.*, c.name as category_name
         FROM category_scores cs
         JOIN categories c ON c.id = cs.category_id
         WHERE cs.state_id = ? AND cs.year = ?
         ORDER BY c.sort_order`
      )
      .all(stateId, targetYear) as (CategoryScore & { category_name: string })[];

    return { overall, categories };
  } finally {
    db.close();
  }
}

export function getMetricScoresForState(
  stateId: string,
  categoryId: string,
  year?: number
): (MetricScore & { metric_name: string; unit: string; polarity: string })[] {
  const db = getReadonlyDb();
  try {
    const targetYear = year ?? getLatestYear(db);
    if (!targetYear) return [];
    return db
      .prepare(
        `SELECT ms.*, m.name as metric_name, m.unit, m.polarity
         FROM metric_scores ms
         JOIN metrics m ON m.id = ms.metric_id
         WHERE ms.state_id = ? AND m.category_id = ? AND ms.year = ?
         ORDER BY m.weight DESC, m.name`
      )
      .all(stateId, categoryId, targetYear) as (MetricScore & {
      metric_name: string;
      unit: string;
      polarity: string;
    })[];
  } finally {
    db.close();
  }
}

// ─── Helpers ───

function getLatestYear(db: ReturnType<typeof getReadonlyDb>): number | null {
  const row = db
    .prepare("SELECT MAX(year) as year FROM data_points")
    .get() as { year: number | null } | undefined;
  return row?.year ?? null;
}

export function getAvailableYears(): number[] {
  const db = getReadonlyDb();
  try {
    return (
      db.prepare("SELECT DISTINCT year FROM data_points ORDER BY year DESC").all() as {
        year: number;
      }[]
    ).map((r) => r.year);
  } finally {
    db.close();
  }
}
