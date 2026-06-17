import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { Me } from "../lib/identity";
import { money } from "../lib/format";
import { useMyMeals } from "../lib/useMyMeals";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import ReceiptDetail from "../components/ReceiptDetail";

// Timeline of bubbles (date · total · paid by); tap one for the full detail.
export default function Receipts({ me }: { me: Me }) {
  const meals = useMyMeals(me);
  const [openId, setOpenId] = useState<Id<"meals"> | null>(null);

  if (meals === undefined) return <Spinner />;
  if (meals.length === 0)
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
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
                <PayerStack payer={payer} count={m.participants.length} />
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

// Payer avatar with one black circle per other diner stacked behind it, each
// peeking out from the right. Only the front circle carries the payer.
function PayerStack({
  payer,
  count,
}: {
  payer?: { name: string; userId: string };
  count: number;
}) {
  const size = 40;
  // Decreasing gaps from the previous circle, so the stack tightens and tops
  // out at a fixed width — the date column then aligns across every row.
  const GAPS = [8, 8, 6, 4, 2]; // 2nd–6th circle; 0 for any after
  const cumulativeLeft = (j: number) => {
    let o = 0;
    for (let k = 0; k <= j; k++) o += GAPS[k] ?? 0;
    return o;
  };
  const maxOffset = GAPS.reduce((a, b) => a + b, 0);
  const extras = Math.max(0, count - 1);
  return (
    <div
      className="relative shrink-0"
      style={{ width: size + maxOffset, height: size }}
    >
      {Array.from({ length: extras }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 rounded-full bg-surface ring-2 ring-surface-container"
          style={{
            width: size,
            height: size,
            left: cumulativeLeft(i),
            zIndex: extras - i,
          }}
        />
      ))}
      <div
        className="absolute left-0 top-0 rounded-full ring-2 ring-surface-container"
        style={{ zIndex: extras + 1 }}
      >
        {payer ? (
          <Avatar name={payer.name} colorKey={payer.userId} size={size} />
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
            style={{ width: size, height: size }}
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
}
