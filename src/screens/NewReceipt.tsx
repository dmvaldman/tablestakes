import { useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { choosePayingItem, type Item } from "../lib/expectorant";
import type { Me } from "../lib/identity";

// An item the algorithm runs over, optionally carrying the OCR bounding box so
// we can highlight it on the photo at reveal time. [ymin,xmin,ymax,xmax]/1000.
type BoxedItem = Item & { box?: number[] };

type Stage = "reading" | "rolling" | "result" | "error";

export default function NewReceipt({
  me,
  image,
  onClose,
}: {
  me: Me;
  image: string; // captured photo as a data URL
  onClose: () => void;
}) {
  const itemize = useAction(api.receipts.itemizeReceipt);
  const createMeal = useMutation(api.meals.createMeal);
  const confirmPayer = useMutation(api.meals.confirmPayer);

  const [stage, setStage] = useState<Stage>("reading");
  const [error, setError] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [chosen, setChosen] = useState<BoxedItem | null>(null);
  const [scanName, setScanName] = useState(""); // item flashing during the roll
  const [mealId, setMealId] = useState<Id<"meals"> | null>(null);
  const [iPaid, setIPaid] = useState<boolean | null>(null);
  const started = useRef(false);

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
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("error");
    }
  }

  async function share() {
    if (!mealId) return;
    const url = `${window.location.origin}/m/${mealId}`;
    const text = `We just Expectorant-ed dinner ($${total.toFixed(
      2,
    )}). Open to see if you're the lucky payer.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Expectorant", text, url });
        return;
      } catch {
        /* cancelled — fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link copied!");
  }

  async function setPaid(paid: boolean) {
    setIPaid(paid);
    if (mealId) await confirmPayer({ mealId, payerId: paid ? me.id : null });
  }

  const showOverlay = stage === "reading" || stage === "rolling";

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
      <div className="relative flex-1 overflow-hidden">
        <img src={image} alt="receipt" className="h-full w-full object-contain" />

        {/* chosen-item highlight box */}
        {stage === "result" && chosen?.box && (
          <div
            className="absolute rounded-md bg-primary/25 ring-2 ring-primary"
            style={boxStyle(chosen.box)}
          />
        )}

        {/* scanning overlay during OCR + roll */}
        {showOverlay && (
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface/90 p-8 text-center">
            <p className="text-on-surface-variant">Couldn't read the receipt.</p>
            <p className="text-xs text-on-surface-variant/70">{error}</p>
            <button
              onClick={onClose}
              className="rounded-full bg-primary px-6 py-2.5 font-medium text-on-primary"
            >
              Try another photo
            </button>
          </div>
        )}

        {/* result caption */}
        {stage === "result" && chosen && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/90 to-transparent p-5 pt-12 text-center">
            <h2 className="text-2xl font-medium">
              Whoever got the {chosen.name} pays!
            </h2>
            <p className="mt-1 text-on-surface-variant">
              The whole ${total.toFixed(2)} bill.
            </p>
          </div>
        )}
      </div>

      {/* result actions */}
      {stage === "result" && (
        <div className="border-t border-outline-variant p-5">
          <button
            onClick={share}
            className="w-full rounded-full bg-primary py-3 font-medium text-on-primary"
          >
            Share with the table
          </button>
          <div className="mt-4 rounded-2xl bg-surface-container p-4">
            <p className="mb-3 text-center font-medium">
              Were you the one who paid?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaid(true)}
                className={`flex-1 rounded-full py-2 font-medium ${
                  iPaid === true
                    ? "bg-primary text-on-primary"
                    : "bg-surface ring-1 ring-outline-variant"
                }`}
              >
                Yes, I paid
              </button>
              <button
                onClick={() => setPaid(false)}
                className={`flex-1 rounded-full py-2 font-medium ${
                  iPaid === false
                    ? "bg-surface-container-high text-on-surface ring-1 ring-primary"
                    : "bg-surface ring-1 ring-outline-variant"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Map a Gemini box [ymin,xmin,ymax,xmax] in 0–1000 to CSS percentages.
function boxStyle(box: number[]): React.CSSProperties {
  const [ymin, xmin, ymax, xmax] = box;
  return {
    left: `${xmin / 10}%`,
    top: `${ymin / 10}%`,
    width: `${(xmax - xmin) / 10}%`,
    height: `${(ymax - ymin) / 10}%`,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
