# National Premier League — Implementation Progress

## Phase 0: Foundation ✓
- [x] Init Next.js + Tailwind + shadcn/ui
- [x] Set up better-sqlite3, create schema
- [x] Populate reference data (states.json, categories.json, 32 metrics across 4 categories)
- [x] Write MoSPI MCP ingestion script (connection failed — server issue, sample data used)
- [x] Write basic scoring engine
- [x] Write seed-sample-data script for development
- [x] Write JSON export + validation scripts
- [x] Write pipeline orchestrator
- [x] Build homepage with league table + category cards + tier summary
- [x] Build /rankings page (overall + per-category)
- [x] Build /states page (grid + individual profiles with category breakdown)
- [x] Build /compare page (client-side, loads JSON)
- [x] Build /about page (methodology, sources, tiers)
- [x] **Verify**: `next build` generates 71 static pages, all routes work

## Phase 1: Core UI
- [x] Build LeagueTable component (sorting, score bars, tier badges)
- [ ] Build IndiaMap choropleth (react-simple-maps) — needs india-states.topojson
- [ ] Add map to homepage layout
- [ ] Build /states/[stateId] radar chart (Recharts)
- [ ] Add more categories with real metric definitions (expand metrics.json beyond 32)
- [ ] Cmd+K search (cmdk)
- [ ] **Verify**: Navigate between homepage, rankings, state profiles; map is interactive

## Phase 2: Comparison + More Data
- [x] Generate JSON bundles for client-side use
- [x] Build /compare page with two-state selector + diff table
- [ ] Add radar overlay chart to /compare
- [ ] Add CSV ingestion for NFHS, NCRB, UDISE+
- [ ] Expand to 10+ categories with real data
- [ ] Add bar charts and sparklines
- [ ] **Verify**: Compare any two states across all populated categories

## Phase 3: Full Data + Polish
- [ ] Complete all 27 categories with real data
- [ ] Add time-series and trend indicators
- [ ] Build metric deep-dive pages (/metrics/[metricId])
- [ ] Disaggregation views (gender, urban/rural toggle)
- [ ] Responsive design, performance optimization, SEO
- [ ] **Verify**: Lighthouse > 95, all 27 categories populated

## Phase 4: Automation + Launch
- [x] Pipeline orchestrator script
- [ ] GitHub Actions for monthly data refresh
- [x] Data validation checks
- [ ] Deploy to Vercel
- [ ] **Verify**: Push to main triggers build + deploy; data is fresh

## Status Summary
- **Phase 0**: COMPLETE — foundation working, 71 pages generating
- **Phase 1**: PARTIAL — core components done, map and search pending
- **Phase 2**: PARTIAL — compare page works, charts and real data pending
- **Phase 3**: NOT STARTED
- **Phase 4**: PARTIAL — pipeline and validation done, deployment pending
