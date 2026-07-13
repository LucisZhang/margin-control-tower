import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 2 ** 32);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function output(relativePath, value) {
  const path = join(root, relativePath);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function outputCsv(relativePath, rows) {
  const columns = Object.keys(rows[0] ?? {});
  const body = [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n");
  const path = join(root, relativePath);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${body}\n`);
}

function isoWeek(start, offset) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset * 7);
  return date.toISOString().slice(0, 10);
}

const marginRandom = rng(2026071301);
const weeks = Array.from({ length: 52 }, (_, index) => isoWeek("2029-04-01", index));
const regions = ["North", "South", "West"];
const channels = ["Direct", "Marketplace", "Retail"];
const products = [
  ["Home", "H-01", "Storage set", 58, 31, 5.4, 52],
  ["Home", "H-02", "Task lamp", 46, 24, 4.8, 66],
  ["Home", "H-03", "Linen set", 74, 39, 5.9, 42],
  ["Home", "H-04", "Kitchen kit", 86, 48, 6.2, 38],
  ["Electronics", "E-01", "USB-C hub", 118, 78, 7.8, 36],
  ["Electronics", "E-02", "Desk speaker", 146, 94, 8.3, 29],
  ["Electronics", "E-03", "Travel display", 228, 154, 11.8, 18],
  ["Electronics", "E-04", "Web camera", 96, 61, 6.9, 43],
  ["Beauty", "B-01", "Daily serum", 34, 14, 4.2, 82],
  ["Beauty", "B-02", "Cleanser set", 42, 18, 4.5, 74],
  ["Beauty", "B-03", "Mineral tint", 38, 16, 4.1, 69],
  ["Beauty", "B-04", "Travel kit", 28, 11, 3.9, 91],
  ["Outdoors", "O-01", "Trail bottle", 31, 13, 4.7, 78],
  ["Outdoors", "O-02", "Day pack", 88, 47, 7.1, 35],
  ["Outdoors", "O-03", "Camp light", 54, 29, 5.6, 47],
  ["Outdoors", "O-04", "Picnic mat", 63, 33, 6.4, 41],
  ["Office", "F-01", "Notebook pack", 24, 9, 3.6, 96],
  ["Office", "F-02", "Desk organizer", 39, 17, 4.4, 71],
  ["Office", "F-03", "Monitor arm", 132, 86, 9.2, 25],
  ["Office", "F-04", "Keyboard mat", 33, 12, 4.1, 84],
];
const marginAnomalyWeek = weeks[42];
const marginRows = [];

for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
  for (const [category, productId, productName, price, unitCost, fulfillmentCost, baseOrders] of products) {
    for (const region of regions) {
      for (const channel of channels) {
        const injected = weekIndex === 42 && category === "Electronics" && region === "West";
        const regionFactor = region === "North" ? 1.06 : region === "South" ? 0.95 : 1;
        const channelFactor = channel === "Direct" ? 1.12 : channel === "Marketplace" ? 1.02 : 0.88;
        const season = 1 + Math.sin((weekIndex / 52) * Math.PI * 2) * 0.08;
        const orderCount = Math.max(4, Math.round(baseOrders * regionFactor * channelFactor * season * (0.9 + marginRandom() * 0.2) * (injected ? 1.28 : 1)));
        const units = orderCount + Math.round(orderCount * (0.08 + marginRandom() * 0.26));
        const promoDepth = injected ? round(0.25 + marginRandom() * 0.025, 4) : round(0.045 + marginRandom() * 0.075, 4);
        const returnRate = injected ? round(0.12 + marginRandom() * 0.018, 4) : round(0.018 + marginRandom() * 0.042, 4);
        const grossRevenue = round(units * price);
        const discounts = round(grossRevenue * promoDepth);
        const returns = round(grossRevenue * returnRate);
        const netRevenue = round(grossRevenue - discounts - returns);
        const cogs = round(units * unitCost);
        const fulfillment = round(units * fulfillmentCost * (channel === "Marketplace" ? 1.08 : 1) * (injected ? 1.42 : 1));
        const contributionMargin = round(netRevenue - cogs - fulfillment);
        marginRows.push({
          week: weeks[weekIndex],
          period_split: weekIndex < 44 ? "analysis" : "holdout",
          category,
          product_id: productId,
          product_name: productName,
          region,
          channel,
          order_count: orderCount,
          units,
          unit_price: price,
          gross_revenue: grossRevenue,
          promo_depth: promoDepth,
          discounts,
          return_rate: returnRate,
          returns,
          net_revenue: netRevenue,
          cogs,
          fulfillment,
          contribution_margin: contributionMargin,
          provenance: "synthetic",
          injected_anomaly: injected,
          anomaly_reason: injected ? "fixed promotion-return-fulfillment stress" : "",
        });
      }
    }
  }
}

const marginDataset = {
  schema_version: 2,
  dataset_version: "margin-synthetic-v2",
  seed: 2026071301,
  classification: "fixed-seed synthetic dataset; newly generated; not inherited evidence",
  license: "Original synthetic dataset covered by the portfolio NOTICE; no external dataset records are used.",
  generated_for: "Margin Control Tower production-shaped analytics case study",
  date_range: { start: weeks[0], end: weeks.at(-1) },
  grain: "one row per week, product, region, and channel",
  dimensions: { weeks: weeks.length, categories: new Set(products.map((item) => item[0])).size, products: products.length, regions: regions.length, channels: channels.length },
  analysis_period: { start: weeks[0], end: weeks[43] },
  holdout_period: { start: weeks[44], end: weeks.at(-1) },
  guided_scenario: { week: marginAnomalyWeek, category: "Electronics", region: "West", channel: "All" },
  assumptions: ["Every record is synthetic.", "Order counts and unit economics are generated from fixed rules and seed.", "Injected anomalies exist only to exercise diagnostic workflows."],
  rows_sha256: hash(marginRows),
  rows: marginRows,
};
await output("public/case-studies/margin-control-tower/synthetic-margin-data.json", marginDataset);
await outputCsv("public/case-studies/margin-control-tower/synthetic-margin-data.csv", marginRows);
await outputCsv("public/case-studies/margin-control-tower/synthetic-margin-sample.csv", marginRows.slice(0, 120));

console.log(`Generated margin fixture: ${marginRows.length} rows.`);
