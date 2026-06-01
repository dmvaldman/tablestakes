import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { choosePayingItem, type Item, type Outcome } from "../lib/expectorant";
import type { Me } from "../lib/identity";

type Stage = "entry" | "rolling" | "result";

export default function NewReceipt({
  me,
  onClose,
}: {
  me: Me;
  onClose: () => void;
}) {
  const createMeal = useMutation(api.meals.createMeal);
  const confirmPayer = useMutation(api.meals.confirmPayer);

  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [stage, setStage] = useState<Stage>("entry");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [cursor, setCursor] = useState(0); // which step the animation is on
  const [mealId, setMealId] = useState<Id<"meals"> | null>(null);
  const [iPaid, setIPaid] = useState<boolean | null>(null);

  const total = items.reduce((s, it) => s + it.cost, 0);

  function addItem() {
    const c = parseFloat(cost);
    if (!name.trim() || !Number.isFinite(c) || c <= 0) return;
    setItems((xs) => [...xs, { name: name.trim(), cost: c }]);
    setName("");
    setCost("");
  }

  async function spin() {
    if (items.length === 0) return;
    const result = choosePayingItem(items);
    setOutcome(result);
    setStage("rolling");

    // Theatrical reveal: tick through the steps, then land on the chosen item.
    for (let i = 0; i < result.steps.length; i++) {
      setCursor(i);
      await sleep(i === result.steps.length - 1 ? 700 : 450);
    }

    const id = await createMeal({
      creatorId: me.id,
      creatorName: me.name,
      total,
    });
    setMealId(id);
    setStage("result");
  }

  async function share() {
    if (!mealId) return;
    const url = `${window.location.origin}/m/${mealId}`;
    const text = `We just Expectorant-ed dinner ($${total.toFixed(
      2,
    )}). Open to see if you're the lucky payer 🎲`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Expectorant", text, url });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link copied!");
  }

  async function setPaid(paid: boolean) {
    setIPaid(paid);
    if (mealId) await confirmPayer({ mealId, payerId: paid ? me.id : null });
  }

  return (
    <div className="fixed inset-0 z-20 mx-auto flex max-w-md flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <button onClick={onClose} className="text-on-surface-variant">
          Close
        </button>
        <span className="font-semibold">New receipt</span>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {stage === "entry" && (
          <>
            <p className="mb-4 text-sm text-on-surface-variant">
              Add each item (split quantities into separate lines). Total should
              be after tax, before tip.
            </p>
            <ul className="mb-4 divide-y divide-outline-variant">
              {items.map((it, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{it.name}</span>
                  <span className="tabular-nums text-on-surface-variant">
                    ${it.cost.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item"
                className="flex-1 rounded-lg border border-outline-variant px-3 py-2 outline-none focus:border-primary"
              />
              <input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                inputMode="decimal"
                placeholder="$"
                className="w-20 rounded-lg border border-outline-variant px-3 py-2 text-right outline-none focus:border-primary"
              />
              <button
                onClick={addItem}
                className="rounded-lg bg-surface-container-high px-4 font-semibold"
              >
                Add
              </button>
            </div>
          </>
        )}

        {stage === "rolling" && outcome && (
          <div className="flex flex-col items-center pt-10">
            <p className="mb-6 animate-pulse text-lg text-on-surface-variant">
              Rolling the dice…
            </p>
            <div className="text-3xl font-bold">
              {outcome.steps[cursor]?.item.name}
            </div>
            <div className="mt-2 tabular-nums text-on-surface-variant">
              {(outcome.steps[cursor]?.probability * 100).toFixed(0)}% chance
            </div>
          </div>
        )}

        {stage === "result" && outcome && (
          <div className="flex flex-col items-center pt-8 text-center">
            <div className="text-5xl">🎲</div>
            <h2 className="mt-4 text-2xl font-bold">
              Whoever got the {outcome.chosen.name} pays!
            </h2>
            <p className="mt-1 text-on-surface-variant">
              The whole ${total.toFixed(2)} bill.
            </p>

            <button
              onClick={share}
              className="mt-8 w-full rounded-xl bg-primary py-3 font-semibold text-on-primary"
            >
              Share with the table
            </button>

            <div className="mt-8 w-full rounded-xl bg-surface-container p-4">
              <p className="mb-3 font-medium">Were you the one who paid?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaid(true)}
                  className={`flex-1 rounded-lg py-2 font-semibold ${
                    iPaid === true
                      ? "bg-primary text-on-primary"
                      : "bg-surface ring-1 ring-outline-variant"
                  }`}
                >
                  Yes, I paid
                </button>
                <button
                  onClick={() => setPaid(false)}
                  className={`flex-1 rounded-lg py-2 font-semibold ${
                    iPaid === false
                      ? "bg-surface-container-high text-on-surface ring-1 ring-primary"
                      : "bg-surface ring-1 ring-outline-variant"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <button onClick={onClose} className="mt-6 text-on-surface-variant">
              Done
            </button>
          </div>
        )}
      </div>

      {stage === "entry" && (
        <footer className="border-t border-outline-variant p-5">
          <div className="mb-3 flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={spin}
            disabled={items.length === 0}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-on-primary disabled:opacity-40"
          >
            Spin the bill 🎲
          </button>
        </footer>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
