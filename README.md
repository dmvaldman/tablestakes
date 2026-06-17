# TableStakes

A zero-friction mobile web app for friends who eat together. After dinner, one
person pays the whole bill — but _who_ is chosen by chance, weighted so that
over time everyone converges to paying their fair share in expectation (based on
[this Messy Matters post](https://messymatters.com/expectorant/)).

## How it works

After a meal, take a photo of the receipt, the app announces the chosen _item_
("whoever got the Ribeye pays!"), you resolve it at the table, and the actual
payer is recorded when someone opens the shared link and confirms "I paid." When
the drawn item has duplicate units (e.g. 4 lagers), a split screen breaks the
tie with a uniform sub-draw.

### Stats

The **Stats** tab turns the meal history into a fairness picture, all computed
client-side from stored meals (`src/lib/stats.ts`):

- **Luck Over Time** — a funnel chart of your cumulative luck (fair share minus
  what you've paid, as a % of your share) inside the ±2σ "normal luck" envelope,
  which narrows as you play. Shows the last 10 meals or 3 months, whichever is
  longer.
- **Current Luck** — your standing right now (e.g. "Up 5% · Luckier than 61% of
  outcomes").
- **Fellow Diners** — per-person tallies over your shared meals; tap to expand
  each person's luck and who-paid-what.

"Fair share" assumes an even split per meal — the only baseline derivable
without storing who ordered what — so it's labelled as luck, not debt.

## Setup

```bash
npm install
npx convex dev      # logs in, creates a dev deployment, generates convex/_generated,
                    # and writes VITE_CONVEX_URL into .env.local. Leave running.

cp .env.convex.example .env.convex   # then fill in your GEMINI_API_KEY
npm run convex:env                   # uploads secrets to the deployment
                                     # (convex env set < .env.convex)

npm run dev         # in a second terminal
```

`.env.convex` keys: `GEMINI_API_KEY` (required). Optional: `GEMINI_MODEL`.

To test the share flow locally, open a meal's `/<code>` URL in a second browser
profile (a different `localStorage` identity).

## Tests

```bash
npm test            # fairness Monte-Carlo + offline receipt parse
npm run test:ocr    # end-to-end OCR against a real receipt photo (needs GEMINI_API_KEY)
```
