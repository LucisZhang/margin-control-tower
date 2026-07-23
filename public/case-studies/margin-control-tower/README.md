# Margin Control Tower — browser artifact boundary

This directory contains the files served to the in-browser decision workspace. The default path
is the committed, hash-verified Olist aggregate; the fixed-seed synthetic dataset is a separate
fallback and test fixture.

## Default Olist path

- `olist-margin.parquet` contains 15,809 aggregate rows derived from 99,441 Olist orders across
  six reconciled source tables. The browser verifies its recorded SHA-256 before rendering.
- `detection-report.json`, `elasticity-report.json`, and `methods-evidence.json` are measured
  offline reports bound to that exact Parquet hash. Detection scores characterize deterministic
  replay labels, not manually verified real anomalies. Elasticity is associational, not causal.
- `olist-margin-compact.json` is a hash-bound first-paint preview of the same Parquet artifact; it
  is not a substitute dataset.
- Observed item prices and freight are retained at the aggregate grain. Reference-price
  discounts, returns, and COGS are disclosed proxies rather than audited company economics.

The upstream Olist dataset is governed by CC BY-NC-SA 4.0. Source authority, transport commit,
retrieval date, raw sizes and hashes, output identity, and proxy boundaries are recorded under
`pipelines/olist-margin/` and in the Parquet metadata. Raw relational rows are not committed.

## Synthetic fallback and test mode

`synthetic-margin-data.json`, CSV, and Parquet are generated from seed `2026071301`. They contain
9,360 fictional rows over 52 weeks and one labeled injected anomaly. This path exists for
deterministic fallback, scenario demonstration, and browser testing; its currency values and
holdout are synthetic and must not be presented as Olist measurements.

## Shared decision contract

Both modes use the same gross → net → contribution accounting identities, bounded rates,
analysis/holdout separation, provenance check, scenario assumptions, and fail-closed decision
gate. Their grains differ deliberately:

- Olist: `week × category × region × dominant payment channel`
- Synthetic fixture: `week × product × region × channel`

`data-contract.json` records the source-specific grains and checks. `metric-registry.json`
records the formulas and source-specific units/provenance. The workspace does not produce a
decision output when an applicable contract check fails.

## Limitations

This case study demonstrates deterministic analytics engineering, browser artifact verification,
measured offline evaluation, and explicit proxy governance. It does not establish audited COGS,
causal promotion lift, manually verified real anomalies, production decisioning, or commercial
impact.
