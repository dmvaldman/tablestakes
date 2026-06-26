// Shapes returned by the Convex queries (kept local so the UI doesn't depend
// on convex/_generated types directly).
export type Participant = { userId: string; name: string };

export type MealView = {
  _id: string;
  createdAt: number;
  total: number;
  payerId: string | null;
  participants: Participant[];
};

export type FriendStat = {
  userId: string;
  name: string;
  timesTogether: number; // all shared meals
  timesYouPaid: number; // settled shared meals you paid
  timesTheyPaid: number; // settled shared meals they paid
  amountYouPaid: number;
  amountTheyPaid: number;
  sharedShare: number; // Σ Tₘ/kₘ over settled shared meals (each one's even share)
};

// Per-friend tallies over the meals you've both been in. Counts/amounts use
// only settled meals; `sharedShare` lets the UI derive each side's luck.
export function friendStats(meals: MealView[], myId: string): FriendStat[] {
  const byFriend = new Map<string, FriendStat>();

  for (const meal of meals) {
    if (!meal.participants.some((p) => p.userId === myId)) continue;
    const settled = !!meal.payerId;
    const k = Math.max(1, meal.participants.length);
    const iPaid = meal.payerId === myId;

    for (const p of meal.participants) {
      if (p.userId === myId) continue;
      let s = byFriend.get(p.userId);
      if (!s) {
        s = {
          userId: p.userId,
          name: p.name,
          timesTogether: 0,
          timesYouPaid: 0,
          timesTheyPaid: 0,
          amountYouPaid: 0,
          amountTheyPaid: 0,
          sharedShare: 0,
        };
        byFriend.set(p.userId, s);
      }
      s.name = p.name; // keep latest label
      s.timesTogether += 1;
      if (settled) {
        s.sharedShare += meal.total / k;
        if (iPaid) {
          s.timesYouPaid += 1;
          s.amountYouPaid += meal.total;
        } else if (meal.payerId === p.userId) {
          s.timesTheyPaid += 1;
          s.amountTheyPaid += meal.total;
        }
      }
    }
  }

  return [...byFriend.values()].sort((a, b) => b.timesTogether - a.timesTogether);
}

// --- Luck: how your actual payments compare to an even split of every bill ---
//
// Baseline assumption: each settled meal is split evenly among its recorded
// diners, so your share of meal m is Tₘ/kₘ and your chance of having paid it
// is 1/kₘ. Under that model your cumulative luck (share − paid) is zero-mean
// with variance σ² = Σ Tₘ²·(1/kₘ)(1−1/kₘ) — fully computable from stored data.

export type LuckPoint = {
  t: number; // meal time (createdAt), for the x-axis
  share: number; // cumulative fair share, $
  paid: number; // cumulative actually paid, $
  dev: number; // (share − paid) / share — relative luck, + = paid less
  band: number; // 2σ / share — the "normal luck" envelope at this point
};

export type LuckStats = {
  settled: number; // meals with a confirmed payer (the only ones counted)
  informative: number; // settled meals with 2+ recorded diners (carry any luck)
  pending: number; // meals still awaiting who-paid
  paidCount: number;
  expectedPaidCount: number; // Σ 1/kₘ
  spent: number; // total you actually paid, $ (Σ Tₘ over meals you paid)
  owed: number; // total even-split share, $ (Σ Tₘ/kₘ)
  luck: number; // owed − spent, $; positive = you're up
  sigma: number; // sd of luck under the even-split model
  percentile: number; // Φ(luck/σ): fraction of expected outcomes you beat
  avgShare: number; // mean per-meal share, for the dilution estimate
  series: LuckPoint[]; // chronological cumulative track for the funnel chart
};

export function luckStats(meals: MealView[], myId: string): LuckStats {
  const settledMeals = meals
    .filter((m) => m.payerId && m.participants.some((p) => p.userId === myId))
    .sort((a, b) => a.createdAt - b.createdAt);
  const pending = meals.filter(
    (m) => !m.payerId && m.participants.some((p) => p.userId === myId),
  ).length;

  let share = 0;
  let paid = 0;
  let varSum = 0;
  let paidCount = 0;
  let expectedPaidCount = 0;
  let informative = 0;
  const series: LuckPoint[] = [];

  for (const m of settledMeals) {
    const k = Math.max(1, m.participants.length);
    if (k >= 2) informative++;
    const p = 1 / k;
    share += m.total * p;
    expectedPaidCount += p;
    varSum += m.total * m.total * p * (1 - p);
    if (m.payerId === myId) {
      paid += m.total;
      paidCount++;
    }
    series.push({
      t: m.createdAt,
      share,
      paid,
      dev: share > 0 ? (share - paid) / share : 0,
      band: share > 0 ? (2 * Math.sqrt(varSum)) / share : 0,
    });
  }

  const luck = share - paid;
  const sigma = Math.sqrt(varSum);
  return {
    settled: settledMeals.length,
    informative,
    pending,
    paidCount,
    expectedPaidCount,
    spent: paid,
    owed: share,
    luck,
    sigma,
    percentile: sigma > 0 ? normCdf(luck / sigma) : 0.5,
    avgShare: settledMeals.length ? share / settledMeals.length : 0,
    series,
  };
}

// Standard normal CDF (Abramowitz–Stegun approximation, |error| < 8e-8).
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
