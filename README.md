# Margin Control Tower

Margin dashboards usually show you a KPI and hide everything that made it: the grain, the
metric formulas, the split rules, the assumptions behind the recommended action. This project
inverts that. It's a browser workbench for weekly contribution margin where the **data
contract, accounting identities, anomaly provenance, holdout boundary, and scenario
assumptions are all first-class, inspectable objects** — and where a failed check stops the
dashboard instead of decorating it.

Live case study: https://portfolio-site-nsam734g0-luciszhangs-projects.vercel.app/analytics/margin-control-tower

![Margin Control Tower desktop workflow](docs/screenshots/margin-desktop.png)

## What's in this repository

This is the **governed synthetic workbench**: a fixed-seed generator, committed fixture
artifacts, typed contracts, and a Next.js analysis surface that computes everything
browser-natively.

A companion integration on the portfolio's
[`codex/portfolio-phase2`](https://github.com/LucisZhang/portfolio-site/tree/codex/portfolio-phase2)
branch adds a real-data mode on top of this workbench: a licensed Olist-derived Parquet
artifact (15,809 cells) queried lazily through DuckDB-WASM, with hash-bound offline
anomaly-detection and price-elasticity reports. Those real-data artifacts and their results
live there — every number in this repository is synthetic fixture behavior by design.

## The fixture

Seed `2026071301` deterministically generates **9,360 rows** at
week × product × region × channel grain: 52 weeks, 20 products, 5 categories, 3 regions,
3 channels, summing to 528,367 synthetic orders. Structure that matters:

- The **final eight weeks are a disjoint holdout** (7,920 analysis rows / 1,440 holdout rows),
  excluded from the diagnostic period so the scenario workflow has an honest boundary.
- A **fixed anomaly at week index 42** hits Electronics in the West — 12 rows (4 products ×
  1 region × 3 channels) with elevated orders, promotion depth, returns, and fulfillment cost.
  The guided slice shows synthetic gross revenue 74,346 with contribution margin −10,331.52 at
  26.28% promotion depth and a 13.20% return rate. The anomaly is *injected and labeled*, so
  the diagnostic workflow can be demonstrated without pretending detection skill.
- Outputs: JSON, CSV, sample CSV, and ZSTD Parquet, with SHA-256 row hashing and embedded
  synthetic provenance.

**Ten deterministic checks** validate required fields, unique grain, non-null dimensions,
numeric bounds, the gross → net → contribution accounting identities, split validity, and
provenance before any diagnosis renders. Failure is a hard stop.

## What the workbench computes

- A **seven-step accessible SVG waterfall** — gross revenue → discounts → returns → net →
  COGS → fulfillment → contribution margin — linked to every filter.
- A 52-week trend, category × region heatmap, cost-driver views, and product contributors,
  all computed in the browser from the committed fixture.
- A **promotion scenario with a disclosed rule**: each one-percentage-point change in
  promotion depth moves units 0.8% in the same direction while return rate and unit economics
  stay fixed. The UI labels this an *assumption*, not a forecast — the difference between a
  scenario tool and a prediction claim.
- Holdout prompts that keep the final eight weeks out of diagnostic reach.

## Quickstart

```bash
npm ci
npm run dev        # http://localhost:3000 — deterministic startup from the committed fixture
```

Verification surface:

```bash
npm run generate:data                # regenerate the fixture byte-for-byte from seed
npm run generate:analytics-parquet
npm run typecheck
npm run lint
npm run test:e2e                     # next build + Playwright
```

## Claim boundaries

- Every row is synthetic; every metric is fixture behavior. The injected anomaly and the
  scenario demonstrate a decision *workflow* — they establish no real lift, no detection
  accuracy, no forecasting quality, no causal impact.
- This is a static analytics case study, not a warehouse, scheduler, or multi-service
  platform.
- The real Olist work (Brazilian E-Commerce Public Dataset, CC BY-NC-SA 4.0, with STL/robust
  z-score replay and HC3 log-log elasticity) belongs to the portfolio-branch integration and
  its own documented proxies and limitations.

## Repository map

```text
margin-control-tower/
├── src/app/page.tsx                                 # route entry
├── src/components/analytics/MarginControlTower.tsx  # the margin workbench
├── scripts/generate-analytics-fixtures.mjs          # seeded fixture generator
├── public/case-studies/margin-control-tower/
│   ├── README.md              # metrics and workflow guide
│   ├── architecture.mmd       # system architecture (Mermaid)
│   ├── data-contract.json     # analytical grain + contract
│   └── metric-registry.json   # metric definitions and formulas
└── docs/screenshots/
```

The `data-contract.json` / `metric-registry.json` pair is the part to read first: the grain
and every metric formula are declared as data, which is what makes the ten checks and the
waterfall reconciliation possible.

## Rights

No open-source license is granted yet; all rights reserved pending a license decision. The
committed dataset is fixed-seed synthetic and owner-generated.
