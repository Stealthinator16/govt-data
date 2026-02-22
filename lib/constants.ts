import type { Tier } from "./types";

export const TIER_CONFIG: Record<Tier, { min: number; color: string; bg: string }> = {
  Champion: { min: 75, color: "text-emerald-700", bg: "bg-emerald-100" },
  Contender: { min: 60, color: "text-blue-700", bg: "bg-blue-100" },
  Rising: { min: 45, color: "text-amber-700", bg: "bg-amber-100" },
  Developing: { min: 0, color: "text-red-700", bg: "bg-red-100" },
};

export function getTier(score: number): Tier {
  if (score >= 75) return "Champion";
  if (score >= 60) return "Contender";
  if (score >= 45) return "Rising";
  return "Developing";
}

export const CATEGORIES = [
  { id: "economy", name: "Economy & Income", icon: "trending-up" },
  { id: "employment", name: "Employment & Labour", icon: "briefcase" },
  { id: "education", name: "Education", icon: "graduation-cap" },
  { id: "health", name: "Health & Healthcare", icon: "heart-pulse" },
  { id: "women-gender", name: "Women & Gender", icon: "users" },
  { id: "children-youth", name: "Children & Youth", icon: "baby" },
  { id: "elderly", name: "Elderly", icon: "heart-handshake" },
  { id: "prices", name: "Prices & Cost of Living", icon: "indian-rupee" },
  { id: "agriculture", name: "Agriculture & Food", icon: "wheat" },
  { id: "industry", name: "Industry & Manufacturing", icon: "factory" },
  { id: "infrastructure", name: "Infrastructure", icon: "building-2" },
  { id: "energy-environment", name: "Energy & Environment", icon: "leaf" },
  { id: "crime-justice", name: "Crime & Justice", icon: "shield" },
  { id: "governance", name: "Governance & Public Services", icon: "landmark" },
  { id: "financial-inclusion", name: "Financial Inclusion", icon: "wallet" },
  { id: "sports", name: "Sports & Fitness", icon: "trophy" },
  { id: "culture-tourism", name: "Culture, Tourism & Heritage", icon: "map-pin" },
  { id: "demographics", name: "Demographics & Social", icon: "users-round" },
  { id: "digital-tech", name: "Digital & Technology", icon: "smartphone" },
  { id: "transport", name: "Transport & Mobility", icon: "car" },
  { id: "media", name: "Media & Information", icon: "newspaper" },
  { id: "migration", name: "Migration & Diaspora", icon: "plane" },
  { id: "civil-society", name: "Civil Society", icon: "hand-heart" },
  { id: "urban-quality", name: "Urban Quality of Life", icon: "building" },
  { id: "mental-health", name: "Mental Health & Well-being", icon: "brain" },
  { id: "disability", name: "Disability & Inclusion", icon: "accessibility" },
  { id: "telecom", name: "Telecom & Connectivity", icon: "signal" },
] as const;
