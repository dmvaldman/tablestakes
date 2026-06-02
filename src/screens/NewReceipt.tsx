import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { choosePayingItem, type Item } from "../lib/expectorant";
import type { Me } from "../lib/identity";

// An item the algorithm runs over, optionally carrying the OCR bounding box so
// we can highlight it on the photo at reveal time. [ymin,xmin,ymax,xmax]/1000.
type BoxedItem = Item & { box?: number[] };

// "split" appears only when the drawn item has duplicate units (e.g. 4 lagers):
// the table assigns who's 1..K, then we pick one slot uniformly.
type Stage = "reading" | "rolling" | "split" | "result" | "share" | "error";

const norm = (s: string) => s.trim().toLowerCase();

export default function NewReceipt({
  me,
  image,
  onClose,
  onRetake,
}: {
  me: Me;
  image: string; // captured photo as a data URL
  onClose: () => void;
  onRetake: () => void; // discard this photo and reopen the camera
}) {
  const itemize = useAction(api.receipts.itemizeReceipt);
  const createMeal = useMutation(api.meals.createMeal);
  const confirmPayer = useMutation(api.meals.confirmPayer);

  const [stage, setStage] = useState<Stage>("reading");
  const [error, setError] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [chosen, setChosen] = useState<BoxedItem | null>(null);
  const [scanName, setScanName] = useState(""); // item flashing during the roll
  const [dupCount, setDupCount] = useState(1); // # of identical units of the drawn item
  const [dupIndex, setDupIndex] = useState(0); // drawn slot [1..dupCount], 0 = undrawn
  const [drawing, setDrawing] = useState(false);
  const [mealId, setMealId] = useState<Id<"meals"> | null>(null);
  const [dismissed, setDismissed] = useState(false); // local-only "No, not me"
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  // Live view of the meal so the payer state syncs across everyone's screens.
  const meal = useQuery(api.meals.getMeal, mealId ? { mealId } : "skip");
  const payerId = meal?.payerId ?? null;
  const payerName = payerId
    ? meal?.participants.find((p) => p.userId === payerId)?.name
    : null;

  // Kick off OCR + the (invisible) algorithm as soon as we have a photo.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    try {
      const base64 = image.split(",")[1] ?? "";
      const mimeType = image.slice(5, image.indexOf(";")) || "image/jpeg";
      const ocr = await itemize({ imageBase64: base64, mimeType });

      // Expand quantities into individual {name, cost} units (two steaks = two
      // rolls), each carrying its line's box for highlighting.
      const units: BoxedItem[] = [];
      for (const it of ocr.items) {
        const q = Math.max(1, Math.round(it.quantity || 1));
        for (let i = 0; i < q; i++)
          units.push({ name: it.name, cost: it.price / q, box: it.box });
      }
      if (units.length === 0) throw new Error("No items found");

      setTotal(ocr.total);
      const outcome = choosePayingItem(units);

      // Theatrical reveal over the photo, then land on the chosen item.
      setStage("rolling");
      for (let i = 0; i < outcome.steps.length; i++) {
        setScanName(outcome.steps[i].item.name);
        await sleep(i === outcome.steps.length - 1 ? 700 : 420);
      }

      const id = await createMeal({
        creatorId: me.id,
        creatorName: me.name,
        total: ocr.total,
      });
      setMealId(id);
      setChosen(outcome.chosen as BoxedItem);

      // How many identical units share the drawn item? If >1, the buyer is
      // ambiguous → go to the split screen to break the tie fairly.
      const groupSize = units.filter(
        (u) => norm(u.name) === norm(outcome.chosen.name),
      ).length;
      setDupCount(groupSize);
      setStage(groupSize > 1 ? "split" : "result");
    } catch (e) {
      // Expected failure path (no receipt, busy model, etc.) — show the calm
      // error screen; don't spam the debug overlay.
      setError(e instanceof Error ? e.message : String(e));
      setStage("error");
    }
  }

  // Uniform sub-draw over the K identical units, with a short suspense cycle.
  async function drawSlot() {
    setDrawing(true);
    for (let i = 0; i < 14; i++) {
      setDupIndex(1 + Math.floor(Math.random() * dupCount));
      await sleep(70 + i * 14);
    }
    setDupIndex(1 + Math.floor(Math.random() * dupCount));
    setDrawing(false);
    setStage("result");
  }

  const shareUrl = mealId ? `${window.location.origin}/m/${mealId}` : "";

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  // "Yes" claims the payer slot (shared); "No" only dismisses locally and never
  // overwrites a payer someone else already confirmed.
  async function sayPaid() {
    if (mealId) await confirmPayer({ mealId, payerId: me.id });
  }

  const showScan = stage === "reading" || stage === "rolling";

  return (
    <div className="fixed inset-0 z-20 mx-auto flex max-w-md flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <button onClick={onClose} className="text-on-surface-variant">
          Close
        </button>
        <span className="font-medium">New receipt</span>
        <span className="w-10" />
      </header>

      {/* Photo + overlays. We display the just-captured image but never store it. */}
      {stage !== "share" && (
        <div className="relative flex-1 overflow-hidden">
          <img
            src={image}
            alt="receipt"
            className="h-full w-full object-contain"
          />

        {/* scanning overlay during OCR + roll */}
        {showScan && (
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-[1px]">
            <div className="absolute inset-x-0 h-0.5 animate-scan bg-primary shadow-[0_0_12px_2px] shadow-primary" />
            <div className="absolute inset-x-0 bottom-24 text-center">
              <p className="text-sm text-on-surface-variant">
                {stage === "reading"
                  ? "Reading the receipt…"
                  : "Rolling the dice…"}
              </p>
              {stage === "rolling" && (
                <p className="mt-1 text-2xl font-medium text-on-surface">
                  {scanName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* error overlay */}
        {stage === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/95 p-8 text-center">
            <p className="text-4xl">🧾</p>
            <p className="font-medium text-on-surface">
              {friendlyError(error)}
            </p>
            <button
              onClick={onRetake}
              className="mt-2 rounded-full bg-primary px-6 py-2.5 font-medium text-on-primary"
            >
              Try another photo
            </button>
          </div>
        )}

        {/* result caption */}
        {stage === "result" && chosen && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/90 to-transparent p-5 pt-12 text-center">
            {dupCount > 1 ? (
              <>
                <h2 className="text-2xl font-medium">
                  {chosen.name} #{dupIndex} pays!
                </h2>
                <p className="mt-1 text-on-surface-variant">
                  Whoever's #{dupIndex} of {dupCount} pays.
                </p>
              </>
            ) : (
              <h2 className="text-2xl font-medium">
                Whoever got the {chosen.name} pays!
              </h2>
            )}
          </div>
        )}
        </div>
      )}

      {/* split screen: break a tie among K identical units */}
      {stage === "split" && chosen && (
        <div className="border-t border-outline-variant p-5">
          <h2 className="text-center text-xl font-medium">
            {dupCount}× {chosen.name} drawn
          </h2>
          <p className="mt-1 text-center text-sm text-on-surface-variant">
            {dupCount} of you ordered the {chosen.name.toLowerCase()}. Agree
            who's 1–{dupCount}, then draw — that person pays the bill.
          </p>

          <div className="my-5">
            <SlotCircles count={dupCount} active={dupIndex} />
          </div>

          <button
            onClick={drawSlot}
            disabled={drawing}
            className="w-full rounded-full bg-primary py-3 font-medium text-on-primary disabled:opacity-50"
          >
            {drawing ? "Drawing…" : "Draw the unlucky one"}
          </button>
        </div>
      )}

      {/* result actions */}
      {stage === "result" && (
        <div className="border-t border-outline-variant p-5">
          {dupCount > 1 && (
            <div className="mb-4">
              <SlotCircles count={dupCount} active={dupIndex} />
            </div>
          )}
          <p className="mb-3 text-center text-on-surface-variant">
            Share with the table to track this meal
          </p>
          <button
            onClick={() => setStage("share")}
            className="w-full rounded-full bg-primary py-3 font-medium text-on-primary"
          >
            Share
          </button>
        </div>
      )}

      {/* share screen: URL to copy + the payer widget */}
      {stage === "share" && (
        <div className="flex flex-1 flex-col p-5">
          <p className="text-on-surface-variant">
            Share this URL with your fellow diners.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-container p-3">
            <span className="flex-1 truncate text-sm">{shareUrl}</span>
            <button
              onClick={copyUrl}
              aria-label="Copy link"
              className="shrink-0 rounded-lg bg-surface-container-high px-3 py-2 text-sm font-medium"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-surface-container p-4">
            <p className="mb-3 text-center font-medium">
              {payerId === me.id
                ? "You're covering this one 🎉"
                : payerId
                  ? `${payerName ?? "Someone"} paid 🙌`
                  : "Were you the one who paid?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={sayPaid}
                disabled={!!payerId}
                className={`flex-1 rounded-full py-2 font-medium disabled:opacity-60 ${
                  payerId === me.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface ring-1 ring-outline-variant"
                }`}
              >
                Yes, I paid
              </button>
              <button
                onClick={() => setDismissed(true)}
                disabled={!!payerId}
                className={`flex-1 rounded-full py-2 font-medium disabled:opacity-60 ${
                  (payerId && payerId !== me.id) || dismissed
                    ? "bg-surface-container-high text-on-surface ring-1 ring-primary"
                    : "bg-surface ring-1 ring-outline-variant"
                }`}
              >
                No
              </button>
            </div>
          </div>

          <button
            onClick={() => setStage("result")}
            className="mt-auto py-3 text-center font-medium text-on-surface-variant"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Numbered slot circles for the tie-break; the drawn number stays filled.
function SlotCircles({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium transition ${
            active === n
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {n}
        </div>
      ))}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Turn a raw OCR/network error into a calm, user-facing message.
function friendlyError(raw: string): string {
  if (/no items|no receipt|not found on the receipt/i.test(raw))
    return "We didn't detect a receipt. Please try again!";
  if (/\b(503|429|overload|unavailable|quota)\b/i.test(raw))
    return "The receipt reader is busy right now. Give it another shot.";
  return "Something went wrong reading the receipt. Please try again.";
}
