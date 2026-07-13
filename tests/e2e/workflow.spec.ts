import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test.beforeAll(async () => mkdir(resolve("docs/screenshots"), { recursive: true }));

test("loads the fixed-seed margin dataset and recomputes a scenario", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("9,360 rows")).toBeVisible();
  await page.getByRole("tab", { name: "Quality checks" }).click();
  await expect(page.locator(".analytics-quality-list .pass")).toHaveCount(10);
  await page.getByRole("button", { name: "Guided scenario" }).click();
  const action = await page.locator(".margin-action code").textContent();
  await page.getByRole("slider", { name: "Promotion depth" }).fill("8");
  await expect(page.locator(".margin-action code")).not.toHaveText(action ?? "");
  await page.screenshot({ path: resolve("docs/screenshots", `margin-${testInfo.project.name}.png`), fullPage: true });
});
