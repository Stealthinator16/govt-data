# National Premier League — Implementation Progress

## Phase 0: Foundation ✓
- [x] Init Next.js + Tailwind + shadcn/ui
- [x] Set up better-sqlite3, create schema
- [x] Populate reference data (states.json, categories.json)
- [x] Write MoSPI MCP ingestion script
- [x] Write basic scoring engine
- [x] Write seed-sample-data script for development
- [x] Write JSON export + validation scripts
- [x] Write pipeline orchestrator
- [x] Build homepage with league table + category cards + tier summary
- [x] Build /rankings page (overall + per-category)
- [x] Build /states page (grid + individual profiles with category breakdown)
- [x] Build /compare page (client-side, loads JSON)
- [x] Build /about page (methodology, sources, tiers)

## Phase 1: Core UI ✓
- [x] Build LeagueTable component (sorting, score bars, tier badges)
- [x] Build IndiaMap choropleth (react-simple-maps)
- [x] Build /states/[stateId] radar chart (Recharts)
- [x] Cmd+K search (cmdk)
- [x] 129 metrics defined across 30 categories

## Phase 2: Comparison + Real Data ✓
- [x] Generate JSON bundles for client-side use
- [x] Build /compare page with two-state selector + radar overlay + diff table
- [x] CSV ingestion pipeline (52 CSV files, 32 curated + 20 DFI-derived)
- [x] MoSPI API ingestion (12 metrics)
- [x] 27/30 categories populated with real data
- [x] MetricBarChart component (Recharts, tier-colored)
- [x] Build /metrics/[metricId] deep-dive pages (bar chart, score distribution, full rankings)

## Phase 3: Polish + Remaining Data
- [x] SEO (metadata, sitemap, robots.txt, OpenGraph, Twitter cards)
- [x] Responsive design (Tailwind responsive classes throughout)
- [x] Deploy to Vercel — https://nationalpremierleague.vercel.app/
- [ ] Fill 25 metrics that have no data yet — 3 new CSVs needed (see below)
- [ ] Improve metrics with partial state coverage (see MEMORY.md for details)
- [ ] Add time-series data and trend indicators
- [ ] Add sparklines to tables
- [ ] Disaggregation views (gender, urban/rural toggle)
- [ ] Performance optimization — target Lighthouse > 95

### Data CSVs still needed
- `data/raw/water-sanitation.csv` → `wat-jjm-tap-connections` (ejalshakti.gov.in), `wat-groundwater-exploitation` (cgwb.gov.in)
- `data/raw/india-justice-report.csv` → `jus-overall-score` (indiajusticereport.org), `jus-undertrial-ratio`, `jus-prison-occupancy` (NCRB PSI 2022)
- `data/raw/social-protection.csv` → `soc-mgnrega-days` (nregastrep.nic.in), `soc-pm-kisan-coverage` (pmkisan.gov.in)

## Phase 4: Automation
- [x] Pipeline orchestrator script
- [x] Data validation checks
- [ ] GitHub Actions for scheduled data refresh
- [ ] Automated build + deploy on data update

## Status Summary
- **Phase 0**: COMPLETE
- **Phase 1**: COMPLETE
- **Phase 2**: COMPLETE
- **Phase 3**: PARTIAL — deployed + SEO + responsive done; 25 metrics empty, time-series + sparklines remaining
- **Phase 4**: PARTIAL — pipeline done, CI/CD not set up
- **Build**: 205 static pages (homepage, rankings×30, states×37, compare, about, metrics×129 [104 with data])
- **Data**: 129 metrics defined, 104 with data, 25 empty. 52 CSV files + 3 aliases in data/raw/
- **Categories**: 30 defined (27 with data; water-sanitation/justice/social-protection partially empty)

## Batch History
- **Batch 1**: 21 curated CSVs + MoSPI ingestion — core categories filled
- **Batch 2**: 6 new CSVs (NCRB extended, ECI turnout, foreign tourism, bank branches, disability, irrigation)
- **Batch 3**: DFI GSDP sectors + salaried jobs + dairy — employment/industry/economy complete
- **Batch 4**: eco-relative-income, eco-national-gdp-share, emp-casual-worker-share, hlt-dairy-consumption; dropped 7 unfillable metrics
- **Batch 5**: TRAI CSV (36-state circle mapping, 3 metrics); 3 new categories; 8 new metric definitions; dropped 2 unfillable telecom metrics; wat-sanitation-coverage alias
