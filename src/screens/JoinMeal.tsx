import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { displayName, type Me } from "../lib/identity";

// Opened from a shared link. We claim the opener's slot on the meal, then ask
// the one essential question the app can't know on its own: did YOU pay?
export default function JoinMeal({
  me,
  mealId,
  onDone,
}: {
  me: Me;
  mealId: string;
  onDone: () => void;
}) {
  const id = mealId as Id<"meals">;
  const meal = useQuery(api.meals.getMeal, { mealId: id });
  const claim = useMutation(api.meals.claimParticipant);
  const confirmPayer = useMutation(api.meals.confirmPayer);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (meal && !claimed) {
      claim({ mealId: id, userId: me.id, name: displayName(me) }).then(() =>
        setClaimed(true),
      );
    }
  }, [meal, claimed, claim, id, me]);

  if (meal === undefined)
    return <Centered>Loading…</Centered>;
  if (meal === null)
    return <Centered>This receipt link is no longer available.</Centered>;

  const payerName =
    meal.payerId &&
    meal.participants.find((p) => p.userId === meal.payerId)?.name;

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center gap-6 px-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">Tonight's bill</h1>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          ${meal.total.toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          {meal.participants.map((p) => p.name).join(" · ")}
        </p>
      </div>

      {payerName ? (
        <p className="text-lg">
          <span className="font-semibold">{payerName}</span> paid this one.
        </p>
      ) : (
        <div className="w-full">
          <p className="mb-3 font-medium">Were you the one who paid?</p>
          <div className="flex gap-3">
            <button
              onClick={() => confirmPayer({ mealId: id, payerId: me.id })}
              className="flex-1 rounded-lg bg-primary py-3 font-semibold text-on-primary"
            >
              Yes, I paid
            </button>
            <button
              onClick={onDone}
              className="flex-1 rounded-lg bg-surface py-3 font-semibold ring-1 ring-outline-variant"
            >
              No
            </button>
          </div>
        </div>
      )}

      <button onClick={onDone} className="text-on-surface-variant">
        Go to my receipts
      </button>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md items-center justify-center px-8 text-center text-on-surface-variant">
      {children}
    </div>
  );
}
