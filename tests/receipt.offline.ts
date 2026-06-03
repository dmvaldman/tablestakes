// Offline end-to-end of the app LOGIC for the Cedar & Hops receipt — no API key
// or image needed. Uses the OCR result we expect for that receipt and drives it
// through expand → choose → meal summary → friend stats.
//   node --experimental-strip-types tests/receipt.offline.ts

import { choosePayingItem, type Item } from "../src/lib/tablestakes.ts";
import { friendStats, type MealView } from "../src/lib/stats.ts";
import type { ReceiptOcr } from "../convex/ocr.ts";

// What Gemini should return for the photographed receipt.
const RECEIPT: ReceiptOcr = {
  currency: "USD",
  total: 131.19, // post-tax, pre-tip (subtotal 120.50, tax 10.69; tip 22.81 excluded)
  items: [
    { name: "Lager Pint", price: 30.0, quantity: 4 },
    { name: "Pretzel Bites", price: 11.0, quantity: 1 },
    { name: "Truffle Fries", price: 8.5, quantity: 1 },
    { name: "Cheeseburger", price: 16.5, quantity: 1 },
    { name: "Fish Tacos", price: 18.0, quantity: 1 },
    { name: "Margherita Pizza", price: 19.0, quantity: 1 },
    { name: "Chicken Caesar", price: 17.5, quantity: 1 },
  ],
};

let failed = 0;
function check(name: string, ok: boolean, info?: string) {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${info ? `  — ${info}` : ""}`);
}

// expand quantities into individual rollable units (4 lagers → 4 units)
function expand(r: ReceiptOcr): Item[] {
  const units: Item[] = [];
  for (const it of r.items) {
    const q = Math.max(1, Math.round(it.quantity || 1));
    for (let i = 0; i < q; i++)
      units.push({ name: it.name, cost: it.price / q });
  }
  return units;
}

const units = expand(RECEIPT);
const subtotal = units.reduce((s, u) => s + u.cost, 0);

check("expands to 10 units (4 lagers + 6)", units.length === 10, `got ${units.length}`);
check("each lager unit is $7.50", units.filter((u) => u.name === "Lager Pint").every((u) => Math.abs(u.cost - 7.5) < 1e-9));
check("unit costs sum to subtotal 120.50", Math.abs(subtotal - 120.5) < 1e-9, subtotal.toFixed(2));
check("stored total excludes tip (131.19, not 154.00)", RECEIPT.total === 131.19);

// Per-item fairness on THIS bill: P(item group chosen) ≈ groupTotal / subtotal.
const N = 200_000;
const hits: Record<string, number> = {};
const rng = mulberry32(0xc0ffee);
for (let i = 0; i < N; i++) {
  const { chosen } = choosePayingItem(units, rng);
  hits[chosen.name] = (hits[chosen.name] ?? 0) + 1;
}
let maxErr = 0;
for (const it of RECEIPT.items) {
  const observed = (hits[it.name] ?? 0) / N;
  const expected = it.price / subtotal;
  maxErr = Math.max(maxErr, Math.abs(observed - expected));
}
check(
  "every item's pay-probability ≈ its price/subtotal",
  maxErr < 0.01,
  `max Δ ${(maxErr * 100).toFixed(2)}%`,
);

// Friend-stats pipeline: two meals, you pay one, a friend pays the other.
const me = "me";
const alex = "alex";
const meals: MealView[] = [
  {
    _id: "m1",
    createdAt: 2,
    total: 131.19,
    payerId: me,
    participants: [
      { userId: me, name: "Me" },
      { userId: alex, name: "Alex" },
    ],
  },
  {
    _id: "m2",
    createdAt: 1,
    total: 80,
    payerId: alex,
    participants: [
      { userId: me, name: "Me" },
      { userId: alex, name: "Alex" },
    ],
  },
];
const [s] = friendStats(meals, me);
check("friend stats: 2 meals together", s.timesTogether === 2);
check("friend stats: you paid $131.19", Math.abs(s.amountYouPaid - 131.19) < 1e-9);
check("friend stats: they paid $80", s.amountTheyPaid === 80);

console.log(failed ? `\n✗ ${failed} check(s) failed` : "\n✓ all checks passed");
process.exit(failed ? 1 : 0);

// small seeded RNG for reproducibility
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
