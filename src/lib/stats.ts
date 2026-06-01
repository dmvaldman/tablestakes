// Shapes returned by the Convex queries (kept local so the UI doesn't depend
// on convex/_generated types directly).
export type Participant = { userId: string; name: string };

export type MealView = {
  _id: string;
  creatorId: string;
  createdAt: number;
  total: number;
  payerId: string | null;
  participants: Participant[];
};

export type FriendStat = {
  userId: string;
  name: string;
  timesTogether: number;
  timesYouPaid: number; // meals (shared with them) where YOU were the payer
  timesTheyPaid: number;
  amountYouPaid: number;
  amountTheyPaid: number;
};

// Everything the Friends tab needs, derived purely from the meals you're in.
// Only meals with a confirmed payer contribute to the paid/amount tallies;
// timesTogether counts all shared meals regardless.
export function friendStats(meals: MealView[], myId: string): FriendStat[] {
  const byFriend = new Map<string, FriendStat>();

  for (const meal of meals) {
    const iAmIn = meal.participants.some((p) => p.userId === myId);
    if (!iAmIn) continue;

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
        };
        byFriend.set(p.userId, s);
      }
      s.name = p.name; // keep latest label
      s.timesTogether += 1;
      if (iPaid) {
        s.timesYouPaid += 1;
        s.amountYouPaid += meal.total;
      } else if (meal.payerId === p.userId) {
        s.timesTheyPaid += 1;
        s.amountTheyPaid += meal.total;
      }
    }
  }

  return [...byFriend.values()].sort((a, b) => b.timesTogether - a.timesTogether);
}
