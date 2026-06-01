import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Create a meal once the algorithm has run on the creator's device. We store
// only the total + the creator as the first participant. The payer is unknown
// at this point (we only know which ITEM was chosen, not who bought it).
export const createMeal = mutation({
  args: {
    creatorId: v.string(),
    creatorName: v.string(),
    total: v.number(),
  },
  handler: async (ctx, { creatorId, creatorName, total }) => {
    const mealId = await ctx.db.insert("meals", {
      creatorId,
      createdAt: Date.now(),
      total,
      payerId: null,
    });
    await ctx.db.insert("participations", {
      mealId,
      userId: creatorId,
      name: creatorName,
    });
    return mealId;
  },
});

// A friend opens the share link and claims their slot (or re-opens it). Names
// are upserted so a rename propagates. Idempotent per (meal, user).
export const claimParticipant = mutation({
  args: { mealId: v.id("meals"), userId: v.string(), name: v.string() },
  handler: async (ctx, { mealId, userId, name }) => {
    const existing = await ctx.db
      .query("participations")
      .withIndex("by_meal_user", (q) =>
        q.eq("mealId", mealId).eq("userId", userId),
      )
      .unique();
    if (existing) {
      if (existing.name !== name) await ctx.db.patch(existing._id, { name });
      return existing._id;
    }
    return await ctx.db.insert("participations", { mealId, userId, name });
  },
});

// Exactly one person confirms they paid. Setting it is last-write-wins; a UI
// can show who already claimed it. Passing null un-sets (mistap recovery).
export const confirmPayer = mutation({
  args: { mealId: v.id("meals"), payerId: v.union(v.string(), v.null()) },
  handler: async (ctx, { mealId, payerId }) => {
    await ctx.db.patch(mealId, { payerId });
  },
});

// A single meal + its participants — for the share/join screen.
export const getMeal = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.db.get(mealId);
    if (!meal) return null;
    const participants = await ctx.db
      .query("participations")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();
    return { ...meal, participants };
  },
});

// Every meal the user is in, with full participant lists — the one query that
// powers both the Receipts timeline and all Friends-tab stats (computed
// client-side from this).
export const mealsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const mine = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const out = [];
    for (const p of mine) {
      const meal = await ctx.db.get(p.mealId as Id<"meals">);
      if (!meal) continue;
      const participants = await ctx.db
        .query("participations")
        .withIndex("by_meal", (q) => q.eq("mealId", meal._id))
        .collect();
      out.push({ ...meal, participants });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  },
});
