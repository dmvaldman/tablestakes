// End-to-end OCR test: runs the ACTUAL Cedar & Hops receipt photo through the
// real Gemini call (the same code path the Convex action uses) and asserts the
// extraction is correct, then runs the payment algorithm over the result.
//
//   1. save the receipt image to tests/fixtures/receipt.jpg
//   2. have GEMINI_API_KEY (+ optional GEMINI_MODEL) in .env.convex
//   3. node --experimental-strip-types tests/ocr.e2e.ts
//
// This hits a paid API and is non-deterministic, so it's a manual/integration
// test (npm run test:ocr), not part of the offline suite.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fetchReceiptOcr } from "../convex/ocr.ts";
import { choosePayingItem, type Item } from "../src/lib/tablestakes.ts";

const here = dirname(fileURLToPath(import.meta.url));
const IMAGE = process.argv[2] ?? join(here, "fixtures", "receipt.jpg");

// --- ground truth for this specific receipt ---
const EXPECT = {
  totalAfterTaxPreTip: 131.19, // NOT 120.50 (subtotal) and NOT 154.00 (with tip)
  subtotal: 120.5, // sum of line prices
  minItems: 6,
  mustMatch: [/lager|pint|beer/i, /pizza/i, /cheeseburger/i], // a few we expect
};

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  const f = join(here, "..", ".env.convex");
  if (existsSync(f)) {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}

const checks: { name: string; ok: boolean; info?: string }[] = [];
const check = (name: string, ok: boolean, info?: string) =>
  checks.push({ name, ok, info });

async function main() {
  const env = loadEnv();
  if (!env.GEMINI_API_KEY) {
    console.log("⏭  GEMINI_API_KEY not found (.env.convex) — skipping OCR e2e.");
    process.exit(0);
  }
  if (!existsSync(IMAGE)) {
    console.log(`⏭  No image at ${IMAGE} — save the receipt photo there first.`);
    process.exit(0);
  }

  const models = [
    env.GEMINI_MODEL || "gemini-2.5-flash",
    env.GEMINI_FALLBACK_MODEL || "gemini-3.1-pro-preview",
  ].filter((m, i, a) => a.indexOf(m) === i);
  console.log(`OCR ${IMAGE} via [${models.join(", ")}]…\n`);

  const buf = readFileSync(IMAGE);
  const ocr = await fetchReceiptOcr({
    imageBase64: buf.toString("base64"),
    mimeType: IMAGE.endsWith(".png") ? "image/png" : "image/jpeg",
    apiKey: env.GEMINI_API_KEY,
    models,
  });

  console.log(JSON.stringify(ocr, null, 2), "\n");

  // total is post-tax, pre-tip
  check(
    "total ≈ 131.19 (post-tax, pre-tip)",
    Math.abs(ocr.total - EXPECT.totalAfterTaxPreTip) < 1,
    `got ${ocr.total}`,
  );
  check(
    "total is NOT the with-tip grand total (154.00)",
    Math.abs(ocr.total - 154) > 1,
  );

  // line prices sum to subtotal regardless of how quantity is represented
  const sum = ocr.items.reduce((s, it) => s + it.price, 0);
  check(
    "line prices sum ≈ subtotal 120.50",
    Math.abs(sum - EXPECT.subtotal) < 2,
    `got ${sum.toFixed(2)}`,
  );

  check(
    `≥ ${EXPECT.minItems} items`,
    ocr.items.length >= EXPECT.minItems,
    `got ${ocr.items.length}`,
  );

  // no summary rows leaked in as items
  const leaked = ocr.items.filter((it) =>
    /subtotal|tax|tip|^total|gratuity/i.test(it.name),
  );
  check("no subtotal/tax/tip/total rows as items", leaked.length === 0, leaked.map((l) => l.name).join(", "));

  for (const re of EXPECT.mustMatch) {
    check(
      `has item matching ${re}`,
      ocr.items.some((it) => re.test(it.name)),
    );
  }

  // the lager line should reflect quantity 4 (either qty=4, or 4 separate units)
  const lagerUnits = ocr.items
    .filter((it) => /lager|pint|beer/i.test(it.name))
    .reduce((n, it) => n + Math.max(1, Math.round(it.quantity || 1)), 0);
  check("lager quantity totals 4", lagerUnits === 4, `got ${lagerUnits}`);

  // feed the result through the real algorithm (expand quantities → choose)
  const units: Item[] = [];
  for (const it of ocr.items) {
    const q = Math.max(1, Math.round(it.quantity || 1));
    for (let i = 0; i < q; i++) units.push({ name: it.name, cost: it.price / q });
  }
  const { chosen } = choosePayingItem(units);
  check(
    "algorithm picks a real item",
    units.some((u) => u.name === chosen.name),
    `chose ${chosen.name}`,
  );

  // report
  let failed = 0;
  console.log("");
  for (const c of checks) {
    if (!c.ok) failed++;
    console.log(
      `${c.ok ? "✓" : "✗"} ${c.name}${c.info ? `  — ${c.info}` : ""}`,
    );
  }
  console.log(failed ? `\n✗ ${failed} check(s) failed` : "\n✓ all checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("\n✗ OCR e2e errored:", e instanceof Error ? e.message : e);
  process.exit(1);
});
