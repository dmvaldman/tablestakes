import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Me } from "../lib/identity";
import type { MealView } from "../lib/stats";

// Timeline: date · total · participants · who paid.
export default function Receipts({ me }: { me: Me }) {
  const meals = useQuery(api.meals.mealsForUser, { userId: me.id }) as
    | MealView[]
    | undefined;

  if (meals === undefined) return <p className="pt-8 text-on-surface-variant">Loading…</p>;
  if (meals.length === 0)
    return (
      <p className="pt-16 text-center text-on-surface-variant">
        No receipts yet.
        <br />
        Tap + after your next meal.
      </p>
    );

  return (
    <ul className="space-y-3 pt-2">
      {meals.map((m) => {
        const payer = m.participants.find((p) => p.userId === m.payerId);
        return (
          <li key={m._id} className="rounded-xl border border-outline-variant p-4">
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
            <p className="mt-1 text-sm text-on-surface-variant">
              {m.participants.map((p) => p.name).join(" · ")}
            </p>
            <p className="mt-1 text-sm">
              {payer ? (
                <>
                  Paid by{" "}
                  <span className="font-medium text-primary">
                    {payer.userId === me.id ? "you" : payer.name}
                  </span>
                </>
              ) : (
                <span className="text-on-surface-variant">Payer not confirmed yet</span>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
