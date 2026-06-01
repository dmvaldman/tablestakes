# Expectorant

A zero-friction mobile web app for friends who eat together. After dinner, one
person pays the whole bill — but _who_ is chosen by chance, weighted so that
over time everyone converges to paying their fair share in expectation. Based on
[messymatters.com/expectorant](https://messymatters.com/expectorant/).

## How it works

You add the receipt's line items and tap **Spin**. The app walks the items and,
for each, the person who ordered it pays the _whole bill_ with probability
`item cost / remaining subtotal`. The first "hit" wins. This makes
`P(person pays) = their share / total`, so expected payment = fair share — the
math is verified in `tests/fairness.ts`.

The app never needs to know who ordered what. It announces the chosen _item_
("whoever got the Ribeye pays!"), you resolve it at the table, and the actual
payer is recorded when someone opens the shared link and confirms "I paid."

## Architecture

- **No accounts.** Identity is a `uuid` minted on first run and kept in
  `localStorage` (`src/lib/identity.ts`). The uuid is the stable key; your name
  is just a label, so two "Alex"es never collide. New phone = new identity (and
  lost history) — an accepted tradeoff.
- **Slim backend (Convex).** We persist only the meal _summary_ — never items,
  never receipt images.
  - `meals` — `{ creatorId, createdAt, total, payerId }`. The doc `_id` is the
    share token (`/m/<id>`). `total` is post-tax, pre-tip.
  - `participations` — `{ mealId, userId, name }`, indexed `by_user` so
    "meals I'm in" is a cheap query and concurrent claims don't contend.
  - `meals.ts` — `createMeal`, `claimParticipant`, `confirmPayer`, `getMeal`,
    `mealsForUser`. The last one powers both the Receipts timeline and all
    Friends-tab stats, which are computed client-side (`src/lib/stats.ts`).
  - `receipts.ts` — `itemizeReceipt` action (vision-OCR). **Stubbed**; v1 uses
    manual item entry. The API key must live here, never in the client.

## Setup

```bash
npm install
npx convex dev      # logs in, creates a dev deployment, generates convex/_generated,
                    # and writes VITE_CONVEX_URL into .env.local. Leave running.
npm run dev         # in a second terminal
```

> Until `npx convex dev` has run once, `convex/_generated` doesn't exist and the
> `api` imports won't typecheck — that's expected.

To test the share flow locally, open a meal's `/m/<id>` URL in a second browser
profile (a different `localStorage` identity).

## Verify the algorithm

```bash
node --experimental-strip-types tests/fairness.ts
```

## Not yet built (v1 scope notes)

- Real receipt-photo OCR (wire a vision model into `receipts.ts`).
- PWA manifest + service worker for home-screen install / offline shell.
- Production SPA routing fallback for `/m/<id>` deep links.
