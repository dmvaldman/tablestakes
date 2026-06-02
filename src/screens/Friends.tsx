import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Me } from "../lib/identity";
import { friendStats, type MealView } from "../lib/stats";

// Per-friend tallies that should converge as overlapping meals accumulate.
export default function Friends({ me }: { me: Me }) {
  const meals = useQuery(api.meals.mealsForUser, { userId: me.id }) as
    | MealView[]
    | undefined;

  if (meals === undefined)
    return <p className="pt-8 text-on-surface-variant">Loading…</p>;
  const stats = friendStats(meals, me.id);

  if (stats.length === 0)
    return (
      <p className="pt-16 text-center text-on-surface-variant">
        No dining companions yet. <br />
        Share a receipt to start tracking.
      </p>
    );

  return (
    <ul className="space-y-3 pt-2">
      {stats.map((s) => (
        <li
          key={s.userId}
          className="rounded-xl border border-outline-variant p-4"
        >
          <h3 className="text-base font-semibold">{s.name}</h3>
          <dl className="mt-2 space-y-1 text-sm text-on-surface-variant">
            <Row label="Meals shared" value={`${s.timesTogether}`} />
            <Row
              label="You paid"
              value={`${s.timesYouPaid}× for total of ${money(s.amountYouPaid)}`}
            />
            <Row
              label="They paid"
              value={`${s.timesTheyPaid}× for total of ${money(s.amountTheyPaid)}`}
            />
          </dl>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-on-surface tabular-nums">{value}</dd>
    </div>
  );
}

// $150 (no cents when round) / $276.46 (cents when present).
function money(n: number): string {
  const cents = Math.round(n * 100);
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
