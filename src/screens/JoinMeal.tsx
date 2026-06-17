import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { displayName, firstNameOf, type Me } from "../lib/identity";
import Avatar from "../components/Avatar";
import HowItWorks from "../components/HowItWorks";

// Opened from a shared link (/m/<code>). We claim the opener's slot on the meal,
// then ask the one essential question the app can't know: did YOU pay?
export default function JoinMeal({
  me,
  code,
  onDone,
}: {
  me: Me;
  code: string;
  onDone: () => void;
}) {
  const meal = useQuery(api.meals.getMealByCode, { code });
  const claim = useMutation(api.meals.claimParticipant);
  const confirmPayer = useMutation(api.meals.confirmPayer);
  const [claimed, setClaimed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (meal && !claimed) {
      claim({ mealId: meal._id, userId: me.id, name: displayName(me) }).then(
        () => setClaimed(true),
      );
    }
  }, [meal, claimed, claim, me]);

  if (meal === undefined)
    return <Centered>Loading…</Centered>;
  if (meal === null)
    return <Centered>This receipt link is no longer available.</Centered>;

  const payerName =
    meal.payerId &&
    meal.participants.find((p) => p.userId === meal.payerId)?.name;

  return (
    <div className="flex min-h-[100svh] flex-col px-8 pb-10 pt-14 text-center">
      <h1 className="text-4xl font-bold tracking-tight">TableStakes</h1>

      <div className="flex flex-1 flex-col justify-center gap-4">
        <div className="rounded-2xl bg-surface-container p-5 text-left">
          <h2 className="text-2xl font-semibold text-on-surface-variant">
            Bill Total
          </h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            ${meal.total.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-surface-container p-5 text-left">
          <h2 className="text-2xl font-semibold text-on-surface-variant">
            Attendees
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {meal.participants.map((p) => (
              <div
                key={p.userId}
                className={`flex items-center gap-2 rounded-full bg-surface-container-high py-1.5 pl-1.5 pr-4 ${
                  p.userId === meal.payerId ? "ring-1 ring-primary" : ""
                }`}
              >
                <Avatar name={p.name} colorKey={p.userId} size={28} />
                <span className="text-base">
                  {p.userId === me.id ? "You" : firstNameOf(p.name)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {payerName ? (
          <p className="text-lg">
            <span className="font-semibold">{payerName}</span> paid this one.
          </p>
        ) : (
          <div className="w-full">
            <p className="mb-3 text-lg font-medium">Were you the one who paid?</p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmPayer({ mealId: meal._id, payerId: me.id })}
                className="flex-1 rounded-full bg-surface py-3 font-semibold ring-1 ring-outline-variant"
              >
                Yes, I paid
              </button>
              <button
                onClick={onDone}
                className="flex-1 rounded-full bg-surface py-3 font-semibold ring-1 ring-outline-variant"
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setShowHelp(true)}
          className="rounded-full px-6 py-3 font-medium text-primary ring-1 ring-outline-variant transition active:scale-95"
        >
          What is this?
        </button>
        <button
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-on-surface-variant ring-1 ring-outline-variant transition active:scale-95"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Go to home page
        </button>
      </div>

      {showHelp && <HowItWorks onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-8 text-center text-on-surface-variant">
      {children}
    </div>
  );
}
