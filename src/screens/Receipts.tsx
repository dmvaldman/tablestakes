import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { Me } from "../lib/identity";
import { money } from "../lib/format";
import { useMyMeals } from "../lib/useMyMeals";
import Avatar from "../components/Avatar";
import ReceiptDetail from "../components/ReceiptDetail";

// Timeline of bubbles (date · total · paid by); tap one for the full detail.
export default function Receipts({ me }: { me: Me }) {
  const meals = useMyMeals(me);
  const [openId, setOpenId] = useState<Id<"meals"> | null>(null);

  if (meals === undefined)
    return <p className="pt-8 text-on-surface-variant">Loading…</p>;
  if (meals.length === 0)
    return (
      <div className="flex flex-col items-center pt-24 text-center text-on-surface-variant">
        <p className="text-xl font-medium text-on-surface">No receipts yet</p>
        <p className="mt-1 text-lg">
          Tap + to snap your first receipt
        </p>
      </div>
    );

  return (
    <>
      <ul className="space-y-2.5 pt-1">
        {meals.map((m) => {
          const payer = m.participants.find((p) => p.userId === m.payerId);
          return (
            <li key={m._id} className="animate-fade-up">
              <button
                onClick={() => setOpenId(m._id as Id<"meals">)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface-container p-4 text-left transition active:scale-[0.99]"
              >
                {payer ? (
                  <Avatar name={payer.name} colorKey={payer.userId} />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                    ?
                  </div>
                )}
                <span className="flex-1 text-on-surface">
                  {new Date(m.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {money(m.total)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {openId && (
        <ReceiptDetail mealId={openId} me={me} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
