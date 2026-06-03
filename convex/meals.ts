import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Create or update a person's display name. Called whenever someone appears
// (creates or joins a meal) and on rename — the name lives only here.
async function upsertUser(ctx: MutationCtx, userId: string, name: string) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (existing) {
    if (existing.name !== name) await ctx.db.patch(existing._id, { name });
  } else {
    await ctx.db.insert("users", { userId, name });
  }
}

// Join the diners of a meal to their current names in `users`.
async function dinersWithNames(ctx: QueryCtx, mealId: Id<"meals">) {
  const rows = await ctx.db
    .query("diners")
    .withIndex("by_meal", (q) => q.eq("mealId", mealId))
    .collect();
  const participants: { userId: string; name: string }[] = [];
  for (const r of rows) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", r.userId))
      .unique();
    participants.push({ userId: r.userId, name: user?.name ?? "?" });
  }
  return participants;
}

// Create a meal once the algorithm has run on the creator's device. We store
// only the total, and add the creator as the first diner. The payer is unknown
// at this point (we only know which ITEM was chosen, not who bought it).
export const createMeal = mutation({
  args: {
    creatorId: v.string(),
    creatorName: v.string(),
    total: v.number(),
  },
  handler: async (ctx, { creatorId, creatorName, total }) => {
    await upsertUser(ctx, creatorId, creatorName);
    const mealId = await ctx.db.insert("meals", {
      createdAt: Date.now(),
      total,
      payerId: null,
    });
    await ctx.db.insert("diners", { mealId, userId: creatorId });
    return mealId;
  },
});

// A friend opens the share link and joins the meal. Idempotent per (meal, user).
export const claimParticipant = mutation({
  args: { mealId: v.id("meals"), userId: v.string(), name: v.string() },
  handler: async (ctx, { mealId, userId, name }) => {
    await upsertUser(ctx, userId, name);
    const existing = await ctx.db
      .query("diners")
      .withIndex("by_meal_user", (q) =>
        q.eq("mealId", mealId).eq("userId", userId),
      )
      .unique();
    if (!existing) await ctx.db.insert("diners", { mealId, userId });
  },
});

// Exactly one person confirms they paid. Last-write-wins; null un-sets.
export const confirmPayer = mutation({
  args: { mealId: v.id("meals"), payerId: v.union(v.string(), v.null()) },
  handler: async (ctx, { mealId, payerId }) => {
    await ctx.db.patch(mealId, { payerId });
  },
});

// Rename: one row in `users`; every meal picks it up through the join.
export const renameUser = mutation({
  args: { userId: v.string(), name: v.string() },
  handler: async (ctx, { userId, name }) => {
    await upsertUser(ctx, userId, name);
  },
});

// A single meal + its diners — for the share/join screen.
export const getMeal = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.db.get(mealId);
    if (!meal) return null;
    return { ...meal, participants: await dinersWithNames(ctx, mealId) };
  },
});

// Every meal the user is in, with diner lists — powers the Receipts timeline
// and all Friends-tab stats (computed client-side from this).
export const mealsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const mine = await ctx.db
      .query("diners")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const out = [];
    for (const d of mine) {
      const meal = await ctx.db.get(d.mealId);
      if (!meal) continue;
      out.push({ ...meal, participants: await dinersWithNames(ctx, meal._id) });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  },
});
