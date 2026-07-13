# Margin Control Tower

Private publication candidate for a browser tool that traces weekly contribution-margin
changes to discounts, returns, cost of goods, and fulfillment, then tests a disclosed
promotion scenario against a synthetic holdout period.

## Data

The fixed-seed fixture contains 9,360 rows across 52 weeks, 20 products, 5 categories,
3 regions, and 3 channels at week x product x region x channel grain. The final eight weeks
form a disjoint synthetic holdout. Seed: `2026071301`. JSON, CSV, sample CSV, and ZSTD Parquet
files are included. Every row is synthetic.

## Verification boundary

Ten deterministic checks validate schema, unique grain, dimensions, bounds, accounting
identities, split rules, and synthetic provenance before diagnosis is shown. The injected
anomaly and scenario demonstrate the workflow; they do not establish real lift, detection
accuracy, forecasting quality, or causal impact.

## Quickstart

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The committed fixture makes startup deterministic.

```bash
npm run generate:data
npm run generate:analytics-parquet
npm run typecheck
npm run lint
npm run test:e2e
```

## Publication status

Private candidate. Public source publication remains pending final Portfolio authorization.

## Recorded view

![Margin Control Tower desktop workflow](docs/screenshots/margin-desktop.png)
