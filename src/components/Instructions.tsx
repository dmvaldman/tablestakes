// First-run instructions. Shown before the name form, only on a fresh visit to
// the app's home (not when arriving via a share link).
const STEPS = [
  "Take a pic of the bill",
  "We figure out who pays (for everyone)",
  "Keep eating with the same people and you'll (on average) pay your share.",
  "Stare in disbelief that this works!",
];

export default function Instructions({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="border-b border-outline-variant px-8 py-7 text-center">
        <h1 className="text-4xl font-bold tracking-tight">TableStakes</h1>
        <p className="mt-2 text-xl text-on-surface-variant">
          A more fun way to split the bill!
        </p>
      </header>

      {/* steps: positioned in the upper third (1:2 spacers), left-aligned */}
      <div className="flex flex-1 flex-col px-8">
        <div className="flex-1" />
        <ol className="space-y-6">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container font-semibold text-on-primary-container">
                {i + 1}
              </div>
              <p className="text-lg text-on-surface">{step}</p>
            </li>
          ))}
        </ol>
        <div className="flex-[2]" />
      </div>

      <div className="px-8 pb-10">
        <button
          onClick={onContinue}
          className="w-full rounded-full bg-primary py-3.5 font-semibold text-on-primary transition active:scale-[0.99]"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
