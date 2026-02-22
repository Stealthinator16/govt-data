# National Premier League -- Indian State Rankings

A dashboard for ranking and comparing Indian states across measurable dimensions of governance and human development. Built on official data from MoSPI (Ministry of Statistics and Programme Implementation), it computes normalized scores across 27 categories and 1000+ metrics for all 36 states and union territories.

## Features

- **Overall league table** with tier-based classification (Champion, Contender, Rising, Developing)
- **Category rankings** across economy, employment, education, health, and 23 other domains
- **State profiles** with per-category score breakdowns, population, and regional metadata
- **Head-to-head comparison** between any two states across all categories
- **Interactive choropleth map** of India using react-simple-maps and D3 color scales
- **Metric-level drill-down** pages with bar charts and score distributions
- **Static export** -- all pages are pre-rendered from generated JSON bundles

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4, Radix UI primitives, Lucide icons
- **Charts**: Recharts, D3 scale-chromatic
- **Maps**: react-simple-maps with GeoJSON topology
- **Database**: SQLite via better-sqlite3
- **Data tables**: TanStack Table
- **Data parsing**: PapaParse (CSV), xlsx (Excel)

## Data Pipeline

The project includes a multi-step pipeline that ingests, scores, and exports data:

```
npm run pipeline
```

This runs the following steps in order:

1. **Seed reference data** -- loads states, categories, and metric definitions into SQLite
2. **Ingest MoSPI data** -- connects to the MoSPI MCP server (`mcp.mospi.gov.in`) and fetches indicator data via a 4-step API workflow
3. **Compute scores** -- normalizes metrics, caps outliers, and aggregates weighted scores into category and overall rankings with tier assignment
4. **Validate data** -- checks data integrity
5. **Generate JSON** -- exports static JSON bundles to `public/data/` for the Next.js frontend

Individual steps can also be run separately:

```
npm run db:seed           # Seed reference data
npm run db:ingest-mospi   # Ingest from MoSPI
npm run db:score          # Compute scores
npm run db:export         # Generate JSON bundles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Seed and build data

Run the full pipeline to populate the database and generate JSON:

```bash
npm run pipeline
```

Or seed reference data and compute scores from existing data:

```bash
npm run db:seed
npm run db:score
npm run db:export
```

### Development

```bash
npm run dev
```

The app starts at `http://localhost:3000` with Turbopack for fast refresh.

### Production build

```bash
npm run build
npm run start
```

## Project Structure

```
app/
  page.tsx              # Homepage with overall league table
  rankings/             # Full rankings and per-category rankings
  states/               # State listing and individual state profiles
  compare/              # Side-by-side state comparison
  metrics/              # Metric-level detail pages
  about/                # About page
components/
  charts/               # Recharts bar charts and score distributions
  map/                  # India choropleth map (react-simple-maps)
  league-table/         # League table, tier badges, score bars
  layout/               # Header and footer
  ui/                   # Shared UI primitives (Radix-based)
scripts/
  pipeline.ts           # Orchestrator for the full data pipeline
  seed-reference.ts     # Loads reference data into SQLite
  ingest-mospi.ts       # Fetches data from MoSPI MCP server
  compute-scores.ts     # Scoring engine (normalize, weight, aggregate)
  generate-json.ts      # Exports JSON bundles for static rendering
  validate-data.ts      # Data integrity checks
lib/
  db.ts                 # SQLite connection helper
  queries.ts            # Database query functions
  scoring.ts            # Normalization, outlier capping, weighted averages
  types.ts              # Shared TypeScript types
  constants.ts          # Tier thresholds and category definitions
data/
  reference/            # Static reference JSON (states, categories, metrics)
  npl.db                # SQLite database (gitignored)
```

## Data Sources

All data is sourced from the Ministry of Statistics and Programme Implementation (MoSPI), Government of India, via their MCP server at `mcp.mospi.gov.in`.
