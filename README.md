[English](README.md) | [简体中文](README.zh-CN.md)

# Margin Control Tower

[![CI](https://github.com/LucisZhang/margin-control-tower/actions/workflows/ci.yml/badge.svg)](https://github.com/LucisZhang/margin-control-tower/actions/workflows/ci.yml)

**A weekly contribution-margin workbench that analyzes a real e-commerce dataset entirely in
the browser — with the pipeline, hashes, and measured evaluations that make every number
checkable from this repository alone.**

The decision problem: a category manager watches weekly contribution margin move and has to
answer three questions before acting — *where* did margin break (category, region, payment
channel), *which* cost driver moved (discounts, returns, COGS, fulfillment), and *is a
bounded promotion change worth testing*? Most dashboards answer with a KPI and hide the
grain, formulas, and assumptions that produced it. Here those are first-class objects: the
data contract, accounting identities, holdout boundary, and scenario assumptions are all
inspectable in the UI, and a failed contract check blocks the decision output instead of
decorating it.

Everything runs from tracked files: a deterministic offline pipeline over the
[Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
(99,441 orders across six relational tables), the browser-safe Parquet aggregate it derives,
two measured evaluation reports hash-linked to that artifact, and the Next.js + DuckDB-WASM
workbench that consumes them. A governed fixed-seed synthetic fixture remains available as an
explicit fallback and test mode.

![Margin Control Tower workbench](docs/screenshots/margin-desktop.png)

*Full-page capture written by the Playwright workflow test (`tests/e2e/workflow.spec.ts`),
showing the default hash-verified Olist path and its compact first-paint preview.*

## Skills this project demonstrates

- **Data engineering** — a hash-locked, deterministic Python pipeline
  (`pipelines/olist-margin/build.py`) reconciles six relational tables (orders, items,
  customers, products, payments, reviews) with explicit rules for multi-payment orders,
  multi-review orders, missing categories, and payment gaps. It fails closed on any source
  or contract violation and embeds provenance — source URL, license, retrieval date, raw
  hashes, transform version, proxy boundaries — in the Parquet metadata itself.
- **Data analysis** — an STL + robust z-score detector evaluated by deterministic replay
  (recall 1.000, precision 0.316 over six labeled perturbations) and an HC3 log-log
  elasticity regression with category/region/channel fixed effects, fit on the analysis
  window only and scored on an eight-week holdout. The near-zero coefficient and the weak
  75.9% holdout MAPE are reported as measured, not massaged into a better story.
- **Analytics application engineering** — an in-browser DuckDB-WASM query path that verifies
  the served Parquet's SHA-256 before anything renders, a hash-bound compact preview for
  fast first paint that upgrades in place to full materialization, ten fail-closed data
  contracts surfaced in the UI, and a governed synthetic fallback when the artifact is
  absent or invalid — the same verify-before-trust, fail-closed discipline that evaluation
  harnesses for AI applications depend on.

## Quickstart — the real-data path

```bash
npm ci
npm run dev        # http://localhost:3000 — loads the committed Olist artifact by default
```

The workbench hash-verifies `olist-margin.parquet` in the browser, renders a compact
hash-bound preview, then materializes all 15,809 rows through DuckDB-WASM — same-origin
requests only, no external service.

Fastest verification, no Python required:

```bash
shasum -a 256 public/case-studies/margin-control-tower/olist-margin.parquet
# 6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb
node scripts/generate-olist-margin-preview.mjs --check   # re-derives the committed browser preview from those exact bytes
```

Full pipeline verification and rebuild (Python 3.12; `--download` fetches and hash-checks
the six raw tables, `--verify-only` re-validates every committed output):

```bash
python3 -m venv .venv
.venv/bin/pip install -r pipelines/olist-margin/requirements.txt
.venv/bin/python pipelines/olist-margin/build.py --download
.venv/bin/python pipelines/olist-margin/build.py --verify-only
```

`npm run verify:real-data` bundles the pipeline verify with the preview check. Optional
fixture QA for the synthetic mode: `npm run generate:data`,
`npm run generate:analytics-parquet`, and `npm run test:e2e` (Playwright workflow test
against the fixture; writes `docs/screenshots/`). CI runs `typecheck`, `lint`, and `build`
on every push.

## From raw relational tables to browser-safe evidence

1. **Lock.** The six raw CSVs (64,735,796 bytes total) are verified against
   `pipelines/olist-margin/source-lock.json` byte counts and SHA-256 hashes before anything
   runs. Kaggle is the dataset authority; because its unauthenticated download endpoint was
   unavailable, bytes are transported from a pinned immutable public mirror whose file sizes
   match Kaggle's public manifest. Raw tables live only in an ignored cache — no raw row is
   committed, and the CLI refuses raw inputs anywhere else inside the repository.
2. **Reconcile.** Order items join to orders, customers, products, payments, and reviews
   under documented rules: 2,961 multi-payment orders collapse to the largest-value channel,
   547 multi-review orders to the lowest score, missing categories stay as explicit
   `unknown`, and payment-versus-item-plus-freight gaps are audited.
3. **Derive margin.** Gross revenue uses a prior-only expanding category-median reference
   price (first observed category weeks fall back to current price with zero proxy
   discount); returns and COGS are disclosed proxies; fulfillment is observed freight. The
   gross → net → contribution accounting identities must reconcile on every row.
4. **Aggregate and strip identity.** Only after reconciliation does the data collapse to
   week × product category × mapped region × dominant payment channel: 15,809 cells across
   95 observed weeks (2016-08-29 → 2018-09-03), the final eight weeks held out (14,313
   analysis rows / 1,496 holdout rows). The output schema carries no customer, order, or
   upstream product identifier.
5. **Verify.** `--verify-only` fails closed on grain uniqueness, bounds, identities, the
   exact holdout, the complete Monday calendar, embedded provenance metadata, the 95 MiB
   browser budget, and exact reconstruction of both evaluation reports from the committed
   Parquet bytes.

The result is a 672,410-byte ZSTD Parquet artifact (SHA-256 `6921b7ed…5722fb`). A second
build on the same pinned environment reproduced the hash exactly.

## What the interactive workbench does

- **Margin bridge**: gross → discounts → returns → net → COGS → fulfillment → contribution,
  linked to the selected week, category, region, and channel.
- **Category × region heatmap and weekly trend**, with the eight-week holdout visually
  separated from the analysis window rather than blended into it.
- **Promotion scenario with a printed assumption** — each percentage point of promotion
  depth moves units 0.8% in the same direction, return rate and unit economics fixed. The
  UI labels this an assumption, not a forecast, and pairs it with a held-out comparison
  week.
- **Detection and elasticity panels** that render the measured reports only after the
  browser confirms each report's `artifact_sha256` matches the Parquet it just verified.
- **Ten contract checks in the control bar** — schema, unique grain, non-null keys, bounds,
  the three accounting identities, exact holdout, provenance. Any failure blocks the
  decision output.

## Measured results (and how to read them)

| Result | Value | Reading |
| --- | --- | --- |
| Replay detection recall / precision | 1.000 / 0.316 | STL (13-week, robust) + MAD z ≥ 3.5 over a complete 106-Monday calendar (11 empty weeks zero-filled). Labels are six deterministic replayed perturbations — a detector characterization, not verified real anomalies. |
| Price–units association | +0.040 (95% CI 0.026–0.053) | HC3 log-log OLS with fixed effects, fit on analysis rows only. Associational, near zero, reported as-is. |
| Holdout MAPE | 75.9% | Unit prediction error on the later eight observed weeks — disclosed as a weak fit. |

Both reports embed the artifact SHA-256 and are exactly reproduced from the committed
Parquet during `--verify-only`, so the numbers on screen are the numbers the pipeline
measured.

## Architecture

```text
Olist raw CSVs  (Kaggle authority; hash-locked, never committed)
      │   pipelines/olist-margin/build.py — deterministic, fail-closed
      ▼
olist-margin.parquet  +  detection / elasticity / methods reports (hash-linked)
      │   scripts/generate-olist-margin-preview.mjs — 748-row compact preview,
      │   bound to the artifact hash and checked against the exact bytes
      ▼
Next.js workbench (static, same-origin only)
  ├─ browser SHA-256 check of the served Parquet before rendering
  ├─ compact preview first → full DuckDB-WASM materialization
  │    (pinned @duckdb/duckdb-wasm 1.32.0, vendored signed Parquet extension)
  ├─ ten fail-closed contract checks; failure blocks the decision output
  └─ governed synthetic fixture as fallback when the artifact is absent/invalid
```

## Repository map

```text
margin-control-tower/
├── pipelines/olist-margin/
│   ├── build.py                    # raw → artifact pipeline + fail-closed verification
│   ├── source-lock.json            # byte counts + SHA-256 for the six raw tables
│   ├── PROVENANCE.md               # authority, license, transport, output identity
│   └── README.md                   # methodology and reproduction detail
├── public/case-studies/margin-control-tower/
│   ├── olist-margin.parquet        # derived real-data artifact (672 KB, ZSTD)
│   ├── detection-report.json       # measured replay evaluation
│   ├── elasticity-report.json      # measured holdout evaluation
│   ├── methods-evidence.json       # bilingual methods text bound to the artifact hash
│   ├── data-contract.json          # fixture grain + checks (metric-registry.json: formulas)
│   └── synthetic-margin-data.json  # fixed-seed fixture (fallback / test mode)
├── src/components/analytics/MarginControlTower.tsx   # the workbench
├── src/lib/duckdb.ts               # same-origin DuckDB-WASM loader + SHA-256 gate
├── src/lib/olist-margin-compact.ts # hash-bound compact preview decoder
├── src/lib/margin-report-validation.ts  # report contracts (fail closed)
├── scripts/sync-duckdb-browser-assets.mjs  # pins runtime assets + vendored extension
├── public/duckdb/                  # vendored Parquet extension + provenance notes
└── tests/e2e/workflow.spec.ts      # Playwright workflow test (fixture mode)
```

## The synthetic fixture (fallback and test mode)

Seed `2026071301` deterministically generates 9,360 rows over 52 weeks at
week × product × region × channel grain, with one labeled injected anomaly and the same
ten-check contract. It exists so the workflow stays demonstrable and testable when the real
artifact is absent, and so anomaly-diagnosis UX can be shown against a known label. The
workbench states which source is active at all times; synthetic numbers never masquerade as
Olist measurements.

## Limitations and data rights

- **Source and license.** Kaggle's Olist dataset is the authority, licensed
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Only the derived
  aggregate is committed; attribution and ShareAlike obligations follow the derived
  artifact, and downstream reuse must comply with the upstream license.
- **Proxies.** COGS (60% of observed item price), returns (order status / review score),
  and the reference-price discount are disclosed proxies, not audited company economics.
- **Elasticity is associational**, not causal; no lift claim is made.
- **Detection metrics characterize the detector on deterministic replay labels**; no
  manually verified real anomaly is claimed.
- This is a portfolio case study, not a production system; no commercial-impact claim is
  made. First built 2026-07, with no release cadence or support commitment.
- No open-source license is granted; all rights reserved pending a license decision.
