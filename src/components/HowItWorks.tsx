import katex from "katex";
import "katex/dist/katex.min.css";

// Render a LaTeX string to HTML via KaTeX.
function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, {
    displayMode: !!block,
    throwOnError: false,
  });
  return block ? (
    <span
      className="my-2 block overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// Plain-language + mathematical overview of how TableStakes works.
export default function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-surface">
      <div className="flex-1 overflow-y-auto p-5">

        {/* How the payee is chosen */}
        <section className="mt-8">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-primary">▸</span>
            How the payee is chosen
          </h3>
          <div className="mt-2 space-y-3 text-lg text-on-surface-variant">
            <p className="text-xl text-on-surface">
              One person pays the whole bill but that person is chosen
              according to their share. So after many meals, on average, everyone pays what they owe.
            </p>
            <p>
              The trick: we do this{" "}
              <span className="text-on-surface">
                without asking what each person ordered
              </span>
              . How? The app walks the receipt one item at a time. For each
              item it flips a weighted coin: with probability{" "}
              <span className="text-on-surface">
                (the item's cost ÷ the remaining bill)
              </span>{" "}
              the person who got that item pays the whole bill. If the coin says
              no, that item is set aside and we move to the next one — until
              someone is chosen (the last item always lands).
            </p>
          </div>
        </section>

        {/* Why it's fair */}
        <section className="mt-8">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-primary">▸</span>
            Why this works
          </h3>
          <div className="mt-2 space-y-3 text-lg text-on-surface-variant">
            <p>
              Imagine the bill as a single line from 0 to the total. Cut it into
              segments — one per item, each as long as that item costs. Throw a
              dart uniformly at the line, and whoever owns the segment it lands
              in pays.
            </p>
            <p>
              The item-by-item coin flipping is exactly that dart throw in
              disguise. It scans the line segment by segment, asking{" "}
              <span className="text-on-surface">"did the dart land here?"</span> — yes
              with probability cost ÷ total.
            </p>
            <p>
              If no, we go to the next item and ask, "did it land here?" (now the probability is cost ÷ remaining total).
            </p>
          </div>

          {/* Collapsible proof */}
          <details className="group mt-4 rounded-2xl bg-surface-container p-4">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="select-none text-on-surface-variant group-open:hidden">
                ▸{" "}
              </span>
              <span className="hidden select-none text-on-surface-variant group-open:inline">
                ▾{" "}
              </span>
              Mathematical proof
            </summary>

            <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
              <p>
                <span className="font-semibold text-on-surface">Setup.</span>{" "}
                Number the items in whatever order you consider them,{" "}
                <Tex tex="1, 2, \dots, n" />, with costs{" "}
                <Tex tex="c_1, \dots, c_n" /> and subtotal{" "}
                <Tex tex="S = \sum_k c_k" />. Let <Tex tex="R_k" /> be the
                subtotal still remaining when you arrive at step{" "}
                <Tex tex="k" /> — item <Tex tex="k" />
                's cost plus everything after it:
              </p>
              <Tex tex="R_k = c_k + c_{k+1} + \dots + c_n, \qquad R_1 = S." block />
              <p>
                The rule: if you reach step <Tex tex="k" />, item{" "}
                <Tex tex="k" />
                's owner is chosen with probability{" "}
                <Tex tex="c_k / R_k" />.
              </p>

              <p>
                <span className="font-semibold text-on-surface">
                  The derivation.
                </span>{" "}
                To select item <Tex tex="k" />, two things must happen — you
                reach step <Tex tex="k" /> (lose the first{" "}
                <Tex tex="k-1" /> flips), then win at step <Tex tex="k" />:
              </p>
              <Tex
                tex="P(\text{select } k) = \left[\prod_{j=1}^{k-1}\left(1 - \frac{c_j}{R_j}\right)\right] \cdot \frac{c_k}{R_k}."
                block
              />
              <p>
                Each factor simplifies, because <Tex tex="R_j - c_j" /> is just{" "}
                <Tex tex="R_{j+1}" /> — removing item <Tex tex="j" />
                's cost is what defines the next remaining total:
              </p>
              <Tex
                tex="1 - \frac{c_j}{R_j} = \frac{R_j - c_j}{R_j} = \frac{R_{j+1}}{R_j}."
                block
              />
              <p>So the "reach step" product telescopes:</p>
              <Tex
                tex="\prod_{j=1}^{k-1}\frac{R_{j+1}}{R_j} = \frac{R_2}{R_1}\cdot\frac{R_3}{R_2}\cdots\frac{R_k}{R_{k-1}} = \frac{R_k}{R_1} = \frac{R_k}{S}."
                block
              />
              <p>
                Plug it back in, and <Tex tex="R_k" /> cancels too:
              </p>
              <Tex
                tex="P(\text{select } k) = \frac{R_k}{S}\cdot\frac{c_k}{R_k} = \frac{c_k}{S}."
                block
              />
              <p>
                Item <Tex tex="k" /> is chosen with probability{" "}
                <Tex tex="c_k/S" />, and <Tex tex="R_k" /> — the
                position-dependent part — drops out entirely. That cancellation
                is the formal content of "position doesn't matter."
              </p>
              <p>
                Now sum over the items a person ordered (call that set{" "}
                <Tex tex="I_B" />):
              </p>
              <Tex
                tex="P(\text{they pay}) = \sum_{k \in I_B} \frac{c_k}{S} = \frac{\text{their total}}{S},"
                block
              />
              <p>which is their fair share.</p>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
