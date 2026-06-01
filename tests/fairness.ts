// Monte-Carlo proof that P(person pays) converges to their fair share.
// Run: node --experimental-strip-types tests/fairness.ts
import { choosePayingItem, type Item } from "../src/lib/expectorant.ts";

// Three diners with very different orders. Items tagged with their owner.
const owners = ["Alice", "Bob", "Carol"] as const;
const bill: (Item & { owner: string })[] = [
  { name: "Ribeye", cost: 42, owner: "Alice" },
  { name: "Wine", cost: 18, owner: "Alice" },
  { name: "Pasta", cost: 22, owner: "Bob" },
  { name: "Salad", cost: 8, owner: "Carol" },
  { name: "Water", cost: 0.01, owner: "Carol" },
];
const total = bill.reduce((s, it) => s + it.cost, 0);
const ownerByName = new Map(bill.map((it) => [it.name, it.owner]));

const N = 200_000;
const paidCount: Record<string, number> = { Alice: 0, Bob: 0, Carol: 0 };
for (let i = 0; i < N; i++) {
  const { chosen } = choosePayingItem(bill);
  paidCount[ownerByName.get(chosen.name)!]++;
}

const fairShare: Record<string, number> = {};
for (const o of owners) {
  fairShare[o] =
    bill.filter((it) => it.owner === o).reduce((s, it) => s + it.cost, 0) /
    total;
}

let ok = true;
console.log(`total bill $${total.toFixed(2)}, ${N.toLocaleString()} trials\n`);
for (const o of owners) {
  const observed = paidCount[o] / N;
  const expected = fairShare[o];
  const err = Math.abs(observed - expected);
  ok &&= err < 0.005;
  console.log(
    `${o.padEnd(6)} pays ${(observed * 100).toFixed(2)}%  ` +
      `(fair share ${(expected * 100).toFixed(2)}%)  Δ ${(err * 100).toFixed(
        2,
      )}%`,
  );
}
console.log(ok ? "\n✓ converges to fair share" : "\n✗ FAIL");
process.exit(ok ? 0 : 1);
