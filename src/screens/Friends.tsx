import { firstNameOf, type Me } from "../lib/identity";
import { friendStats } from "../lib/stats";
import { money } from "../lib/format";
import { useMyMeals } from "../lib/useMyMeals";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";

// Per-friend tallies that should converge as overlapping meals accumulate.
export default function Friends({ me }: { me: Me }) {
  const meals = useMyMeals(me);

  if (meals === undefined) return <Spinner />;
  const stats = friendStats(meals, me.id);

  if (stats.length === 0)
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
        <p className="text-xl font-medium text-on-surface">
          No dining companions yet
        </p>
        <p className="mt-1 text-lg">Share a receipt to start tracking</p>
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
              label={`${firstNameOf(s.name)} paid`}
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
      <p className="truncate text-sm uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{amount}</p>
    </div>
  );
}
