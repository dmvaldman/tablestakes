// The Expectorant algorithm (https://messymatters.com/expectorant/).
//
// Walk the items in any order. For each item, the person who ordered it pays
// the WHOLE bill with probability `cost / remaining-subtotal`. On a miss,
// subtract the item from the subtotal and continue. The final item sits at
// probability cost/cost = 1, so someone is always chosen.
//
// Result: P(item chosen) = item.cost / total, and since each item maps to its
// buyer IRL, P(person pays) = (their items) / total — their fair share in
// expectation. The traversal ORDER is irrelevant to that guarantee; only the
// per-item probability `cost / remaining` is load-bearing.

export type Item = { name: string; cost: number };

export type RollStep = {
  item: Item;
  /** probability this item was the stopping point: cost / remaining-subtotal */
  probability: number;
  /** the random draw in [0,1) */
  roll: number;
  hit: boolean;
};

export type Outcome = {
  /** the item whose buyer pays the whole bill */
  chosen: Item;
  /** every step taken, for the reveal animation */
  steps: RollStep[];
};

/**
 * Run the algorithm. `rng` defaults to Math.random; inject a seeded rng in
 * tests for determinism. Quantities are modeled as duplicated items by the
 * caller (two steaks = two {name, cost} entries).
 */
export function choosePayingItem(
  items: Item[],
  rng: () => number = Math.random,
): Outcome {
  if (items.length === 0) throw new Error("cannot run with zero items");

  let remaining = items.reduce((s, it) => s + it.cost, 0);
  const steps: RollStep[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Guard against degenerate <=0 subtotals; the last item is forced to 1.
    const probability = remaining > 0 ? Math.min(1, item.cost / remaining) : 1;
    const roll = rng();
    const isLast = i === items.length - 1;
    const hit = isLast || roll < probability;
    steps.push({ item, probability, roll, hit });
    if (hit) return { chosen: item, steps };
    remaining -= item.cost;
  }

  // Unreachable: the last item always hits.
  throw new Error("no item chosen — invariant violated");
}
