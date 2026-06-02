import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Me } from "../lib/identity";
import type { MealView } from "../lib/stats";
import ReceiptDetail from "../components/ReceiptDetail";

// Timeline of bubbles (date · total · paid by); tap one for the full detail.
export default function Receipts({ me }: { me: Me }) {
  const meals = useQuery(api.meals.mealsForUser, { userId: me.id }) as
    | MealView[]
    | undefined;
  const [openId, setOpenId] = useState<Id<"meals"> | null>(null);

  if (meals === undefined)
    return <p className="pt-8 text-on-surface-variant">Loading…</p>;
  if (meals.length === 0)
    return (
      <p className="pt-16 text-center text-on-surface-variant">
        No receipts yet.
        <br />
        Tap + after your next meal.
      </p>
    );

  return (
    <>
      <ul className="space-y-3 pt-2">
        {meals.map((m) => {
          const payer = m.participants.find((p) => p.userId === m.payerId);
          return (
            <li key={m._id}>
              <button
                onClick={() => setOpenId(m._id as Id<"meals">)}
                className="w-full rounded-xl border border-outline-variant p-4 text-left active:bg-surface-container"
              >
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant">
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold tabular-nums">
                    ${m.total.toFixed(2)}
                  </span>
                </div>
                {payer && (
                  <p className="mt-1 text-sm">
                    Paid by{" "}
                    <span className="font-medium text-primary">
                      {payer.userId === me.id ? "you" : payer.name}
                    </span>
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {openId && (
        <ReceiptDetail
          mealId={openId}
          me={me}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
