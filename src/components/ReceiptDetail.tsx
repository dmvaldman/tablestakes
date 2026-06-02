import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Me } from "../lib/identity";

// Full receipt view: date, total, attendees, who paid (confirmable if not yet),
// and the spelled-out share link. Used after a draw and from the Receipts list.
export default function ReceiptDetail({
  mealId,
  me,
  onClose,
}: {
  mealId: Id<"meals">;
  me: Me;
  onClose: () => void;
}) {
  const meal = useQuery(api.meals.getMeal, { mealId });
  const confirmPayer = useMutation(api.meals.confirmPayer);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/m/${mealId}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const payerId = meal?.payerId ?? null;
  const payerName = payerId
    ? meal?.participants.find((p) => p.userId === payerId)?.name
    : null;

  return (
    <div className="fixed inset-0 z-30 mx-auto flex max-w-md flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <button onClick={onClose} className="text-on-surface-variant">
          Close
        </button>
        <span className="font-medium">Receipt</span>
        <span className="w-10" />
      </header>

      {meal && (
        <div className="flex-1 overflow-y-auto p-5">
          {/* date + total */}
          <div className="text-center">
            <p className="text-sm text-on-surface-variant">
              {new Date(meal.createdAt).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">
              ${meal.total.toFixed(2)}
            </p>
          </div>

          {/* who paid (confirmable if nobody has yet) */}
          <Section label="Paid by">
            {payerId ? (
              <p className="font-medium text-primary">
                {payerId === me.id ? "You" : (payerName ?? "Someone")}
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => confirmPayer({ mealId, payerId: me.id })}
                  className="flex-1 rounded-full bg-surface ring-1 ring-outline-variant py-2 font-medium"
                >
                  I paid
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className={`flex-1 rounded-full py-2 font-medium ${
                    dismissed
                      ? "bg-surface-container-high ring-1 ring-primary"
                      : "bg-surface ring-1 ring-outline-variant"
                  }`}
                >
                  Not me
                </button>
              </div>
            )}
          </Section>

          {/* share link */}
          <Section label="Share link">
            <p className="mb-2 text-sm text-on-surface-variant">
              Share this link with your fellow diners.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-surface-container p-3">
              <span className="flex-1 truncate text-sm">{shareUrl}</span>
              <button
                onClick={copyUrl}
                aria-label="Copy link"
                className="shrink-0 rounded-lg bg-surface-container-high px-3 py-2 text-sm font-medium"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </Section>

          {/* attendees — only once someone else has opened the link */}
          {meal.participants.some((p) => p.userId !== me.id) && (
            <Section label="Attendees">
              <p>
                {meal.participants
                  .map((p) => (p.userId === me.id ? "You" : p.name))
                  .join(" · ")}
              </p>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
        {label}
      </h3>
      {children}
    </div>
  );
}
