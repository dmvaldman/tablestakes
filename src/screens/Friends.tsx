import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Me } from "../lib/identity";
import { friendStats, type MealView } from "../lib/stats";

// Per-friend tallies that should converge as overlapping meals accumulate.
export default function Friends({ me }: { me: Me }) {
  const meals = useQuery(api.meals.mealsForUser, { userId: me.id }) as
    | MealView[]
    | undefined;

  if (meals === undefined) return <p className="pt-8 text-on-surface-variant">Loading…</p>;
  const stats = friendStats(meals, me.id);

  if (stats.length === 0)
    return (
      <p className="pt-16 text-center text-on-surface-variant">
        No dining companions yet. Share a receipt to start tracking.
      </p>
    );

  return (
    <ul className="space-y-3 pt-2">
      {stats.map((s) => (
        <li key={s.userId} className="rounded-xl border border-outline-variant p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{s.name}</span>
            <span className="text-sm text-on-surface-variant">
              {s.timesTogether}× together
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Stat label="You paid" count={s.timesYouPaid} amt={s.amountYouPaid} />
            <Stat
              label={`${s.name} paid`}
              count={s.timesTheyPaid}
              amt={s.amountTheyPaid}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({
  label,
  count,
  amt,
}: {
  label: string;
  count: number;
  amt: number;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="tabular-nums">
        {count}× · ${amt.toFixed(0)}
      </span>
    </div>
  );
}
