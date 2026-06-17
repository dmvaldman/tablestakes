import { useState } from "react";
import ModalHeader from "./ModalHeader";

// Single source of truth for FAQ answer typography — change it here and every
// answer updates. Each answer is one or more <p> children; gap handles spacing.
const ANSWER_CLASS =
  "flex flex-col items-start gap-3 pb-4 text-md leading-relaxed text-on-surface-variant";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do you choose who pays?",
    a: (
      <>
        <p>
          One way we could do it would be tally up what everyone ordered, then
          choose who pays based on their share of the bill. That would be just
          as fair, but it also requires a lot of data entry. It turns out we
          only need to know who bought a single item!
        </p>
        <p>
          As long as we have a method where the chance a diner pays is equal to
          their share of the bill, we're good. Now, picture the bill as a line
          from 0 to the bill's total, with each item laid out as a segment with
          length equal to its cost. Throw a dart at the line: the chance it
          lands on a diner's item is exactly their share of the bill. But
          notice, we don't actually need to know who purchased each item, we
          only need to know who purchased the item the dart landed on.
        </p>
        <a
          href="https://messymatters.com/expectorant/"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-medium text-primary ring-1 ring-outline-variant transition active:scale-95"
        >
          Read more about the idea →
        </a>
      </>
    ),
  },
  {
    q: "What if I bought the cheapest item?",
    a: (
      <p>
        There's no way this to cheat the algorithm, whether you bought the filet mignon or the bread basket!
      </p>
    ),
  },
  {
    q: "What if the dish the app picked was shared?",
    a: (
      <p>
        Choose the payee randomly (coin flip, etc) between the people sharing the dish, the math will work out.
      </p>
    ),
  },
  {
    q: "What if I don't eat with the same person ever again?",
    a: (
      <p>
        It doesn't matter who you eat with — only how many times you play. Each
        meal is fair on its own: your chance of paying equals your share, so your
        expected net is zero whether it's your regular crew or a stranger you'll
        never see again.
      </p>
    ),
  },
  {
    q: "How do you define “luck”?",
    a: (
      <p>
        It's the gap between what you've actually paid and your share of
        every bill (assuming an even split is your fair share).
        Paid less than that even split and you're up (lucky); paid
        more and you're down. We assume an even split only because it's the simplest assumption,
        but if bills aren't evenly split this can be a biased metric.
      </p>
    ),
  },
  {
    q: "How long does it take for this to even out?",
    a: (
      <>
        <p>
          Your imbalance as a share of what you've spent falls off like{" "} <strong>1/√n</strong>.
          So after 4 meals, you should be within 50% of what you would have paid by evenly splitting each bill.
          After 25 meals, you should be within 20%, after 100 meals, within 10%, etc. Bill size
          itself barely matters: pricey dinners and cheap lunches even out in
          about the same number of meals. What slows convergence down is a{" "}
          <em>lopsided</em> bill — swings grow with the <em>square</em> of a tab,
          so one $400 night among $40 ones counts for more than its share and
          takes extra meals to wash out.
        </p>
      </>
    ),
  },
];

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-outline-variant">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="flex-1 text-lg font-medium">{q}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-on-surface-variant transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className={ANSWER_CLASS}>{a}</div>}
    </div>
  );
}

// Plain-language overview of how TableStakes works.
export default function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface text-left">
      <ModalHeader title="How it works" onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* lead */}
        <h2 className="text-2xl font-bold leading-tight">
          A more fun way to split the bill
        </h2>
        <div className="mt-4 space-y-3 text-md text-on-surface-variant">
          <p>
            One person pays for the table, but they're chosen based on the bill.
            So though one person pays in reality, everyone pays "in expectation".
            Over time, you each pay your fair share.
          </p>
        </div>

        {/* FAQ */}
        <section className="mt-9">
          <h3 className="text-2xl font-semibold">FAQ</h3>
          <div className="mt-2">
            {FAQ.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
