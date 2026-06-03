import ModalHeader from "./ModalHeader";

// Plain-language overview of how TableStakes works.
export default function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-surface text-left">
      <ModalHeader title="How it works" onClose={onClose} />

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
