// Reference types
export interface State {
  id: string;
  name: string;
  code_mospi: string;
  type: "state" | "ut";
  population: number;
  area_sq_km: number;
  region: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Metric {
  id: string;
  category_id: string;
  name: string;
  unit: string;
  source: string;
  polarity: "positive" | "negative";
  weight: number;
  disaggregations: string | null; // JSON string
  is_featured: boolean;
}

// Data types
export interface DataPoint {
  id?: number;
  metric_id: string;
  state_id: string;
  year: number;
  period: string;
  value: number;
  gender: string | null;
  sector: string | null;
  age_group: string | null;
  social_group: string | null;
  status: string;
  source_ref: string;
}

// Score types
export interface MetricScore {
  metric_id: string;
  state_id: string;
  year: number;
  raw_value: number;
  norm_score: number;
  rank: number;
}

export interface CategoryScore {
  category_id: string;
  state_id: string;
  year: number;
  score: number;
  rank: number;
  metrics_count: number;
}

export interface OverallScore {
  state_id: string;
  year: number;
  score: number;
  rank: number;
  tier: Tier;
}

export type Tier = "Champion" | "Contender" | "Rising" | "Developing";

// View types (joined for display)
export interface StateRanking {
  rank: number;
  state: State;
  score: number;
  tier: Tier;
  change?: number; // rank change from previous year
}

export interface CategoryRanking {
  category: Category;
  rankings: StateRanking[];
}

export interface StateProfile {
  state: State;
  overall: OverallScore;
  categories: (CategoryScore & { category: Category })[];
}
