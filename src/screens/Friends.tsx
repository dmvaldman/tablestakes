import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Me } from "../lib/identity";
import { friendStats, type MealView } from "../lib/stats";
import Avatar from "../components/Avatar";

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
      <div className="flex flex-col items-center pt-24 text-center text-on-surface-variant">
        <div className="text-5xl">👥</div>
        <p className="mt-4 text-on-surface">No dining companions yet</p>
        <p className="mt-1 text-sm">Share a receipt to start tracking.</p>
      </div>
    );

  return (
    <ul className="space-y-2.5 pt-1">
      {stats.map((s) => (
        <li
          key={s.userId}
          className="animate-fade-up rounded-2xl bg-surface-container p-4"
        >
          <div className="flex items-center gap-3">
            <Avatar name={s.name} colorKey={s.userId} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{s.name}</h3>
              <p className="text-sm text-on-surface-variant">
                {s.timesTogether} meal{s.timesTogether === 1 ? "" : "s"} together
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <StatTile label="You paid" amount={money(s.amountYouPaid)} />
            <StatTile
              label={`${firstName(s.name)} paid`}
              amount={money(s.amountTheyPaid)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatTile({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <p className="truncate text-xs uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{amount}</p>
    </div>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

// $150 (no cents when round) / $276.46 (cents when present).
function money(n: number): string {
  const cents = Math.round(n * 100);
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
