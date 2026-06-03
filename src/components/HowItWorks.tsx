// Plain-language overview of how TableStakes works.
export default function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-surface text-left">
      <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <button onClick={onClose} className="text-on-surface-variant">
          Close
        </button>
        <span className="font-medium">How it works</span>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* lead */}
        <h2 className="text-2xl font-bold leading-tight">
          A more fun way to split the bill
        </h2>
        <div className="mt-4 space-y-3 text-lg text-on-surface-variant">
          <p>
            One person pays for the table, but they're chosen according to how
            much they owe. So even though one person pays in reality, everyone
            pays their share "in expectation".
          </p>
          <p>
            If you keep eating with the same people, it will all work out in the
            end.
          </p>
        </div>

        {/* the mechanism */}
        <section className="mt-9">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            How the payee is chosen
          </h3>
          <div className="mt-3 space-y-3 text-lg text-on-surface-variant">
            <p>
              We could tally up what everyone ordered, but that means asking you
              a lot of questions. It turns out we only need to know who bought a
              single item!
            </p>
            <p>
              As long as we have a method where the probability a diner pays
              equals their share of the bill, we're good. Now, picture the bill
              as a line from 0 to the total, with each item laid out as a segment
              with length equal to its cost. Throw a dart at the line: the
              chance it lands on a diner's item is exactly their share of the
              bill. So we lay out the items, throw a random dart, and whoever
              owns the segment it hits covers the meal. It makes you scratch your
              head, but it works. And there's no way to cheat!
            </p>
          </div>

          <a
            href="https://messymatters.com/expectorant/"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-medium text-primary ring-1 ring-outline-variant transition active:scale-95"
          >
            Read more about the idea →
          </a>
        </section>
      </div>
    </div>
  );
}

// Illustration: the bill as a line of item-segments, with a dart landing on one.
function BillBar() {
  const slices = [
    { pct: 33, color: "#4F378B" },
    { pct: 21, color: "#00504A", hit: true },
    { pct: 27, color: "#7A2E10" },
    { pct: 19, color: "#28386E" },
  ];

  // dart x-position = center of the slice it lands on
  let acc = 0;
  let dartX = 50;
  for (const s of slices) {
    if (s.hit) {
      dartX = acc + s.pct / 2;
      break;
    }
    acc += s.pct;
  }

  return (
    <div className="mt-5 rounded-2xl bg-surface-container p-4">
      <div className="relative pt-7">
        {/* dart marker */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${dartX}%` }}
        >
          <span className="text-xs font-semibold text-primary">dart</span>
          <span className="mt-0.5 h-0 w-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-primary" />
        </div>

        {/* the bill as item-segments */}
        <div className="flex h-10 overflow-hidden rounded-lg">
          {slices.map((s, i) => (
            <div
              key={i}
              style={{ width: `${s.pct}%`, background: s.color }}
              className={s.hit ? "ring-2 ring-inset ring-white" : ""}
            />
          ))}
        </div>

        <div className="mt-1.5 flex justify-between text-xs text-on-surface-variant">
          <span>$0</span>
          <span>total</span>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-on-surface-variant">
        Each slice is an item — the dart picks one, and its owner pays.
      </p>
    </div>
  );
}
