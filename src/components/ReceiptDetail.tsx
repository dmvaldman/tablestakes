import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { firstNameOf, type Me } from "../lib/identity";
import Avatar from "./Avatar";
import ModalHeader from "./ModalHeader";

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
  const deleteMeal = useMutation(api.meals.deleteMeal);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this receipt? This can't be undone.")) return;
    onClose();
    await deleteMeal({ mealId });
  }

  const shareUrl = meal ? `${window.location.origin}/${meal.code}` : "";

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
    <div className="fixed inset-0 z-30 flex flex-col bg-surface">
      <ModalHeader title="Receipt" onClose={onClose} />

      {meal && (
        <div className="flex-1 overflow-y-auto p-5">
          {/* who paid (confirmable if nobody has yet) */}
          <h3 className="mb-2 text-lg font-semibold uppercase tracking-wide text-on-surface-variant">
            Paid by
          </h3>
          <div className="rounded-2xl bg-primary-container p-5 text-on-primary-container">
            {payerId ? (
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-full bg-on-primary-container/10 py-1.5 pl-1.5 pr-4">
                  <Avatar name={payerName ?? "?"} colorKey={payerId} size={28} />
                  <span className="text-base">
                    {payerId === me.id
                      ? "You"
                      : firstNameOf(payerName ?? "Someone")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => confirmPayer({ mealId, payerId: me.id })}
                  className="flex-1 rounded-full py-3 text-lg font-medium ring-1 ring-on-primary-container/40 transition active:scale-95"
                >
                  I paid
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className={`flex-1 rounded-full py-3 text-lg font-medium transition active:scale-95 ${
                    dismissed
                      ? "bg-on-primary-container/15"
                      : "ring-1 ring-on-primary-container/40"
                  }`}
                >
                  Not me
                </button>
              </div>
            )}
          </div>

          {/* share link */}
          <Section label="Share link">
            <p className="mb-2 text-base text-on-surface-variant">
              Share this with your fellow diners to track the meal
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-surface-container p-3">
              <span className="flex-1 truncate text-sm">{shareUrl}</span>
              <button
                onClick={copyUrl}
                aria-label="Copy link"
                className="shrink-0 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-medium"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </Section>

          {/* attendees — only once someone else has opened the link */}
          {meal.participants.some((p) => p.userId !== me.id) && (
            <Section label="Attendees">
              <div className="flex flex-wrap gap-2">
                {meal.participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-2 rounded-full bg-surface-container py-1.5 pl-1.5 pr-4"
                  >
                    <Avatar name={p.name} colorKey={p.userId} size={28} />
                    <span className="text-base">
                      {p.userId === me.id ? "You" : firstNameOf(p.name)}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="mt-10 flex justify-left">
            <button
              onClick={onDelete}
              className="rounded-full text-md font-medium text-red-400/70 transition active:scale-95"
            >
              Delete receipt
            </button>
          </div>
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
    <div className="mt-7">
      <h3 className="mb-2 text-lg font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </h3>
      {children}
    </div>
  );
}
