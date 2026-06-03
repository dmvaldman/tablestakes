import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Accountless model, normalized into three tables:
//   users  — one row per person; the single home for their display name.
//            `userId` is the client-generated uuid (no logins). Renaming a
//            person updates one row here and every meal reflects it via the join.
//   meals  — the summary of one meal. We never store items or images.
//   diners — the join: who was in which meal (and powers "meals I'm in").

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    name: v.string(),
  }).index("by_userId", ["userId"]),

  meals: defineTable({
    createdAt: v.number(), // ms epoch, set server-side
    total: v.number(), // post-tax, pre-tip
    payerId: v.union(v.string(), v.null()), // who paid; null until confirmed
  }),

  diners: defineTable({
    mealId: v.id("meals"),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_meal", ["mealId"])
    .index("by_meal_user", ["mealId", "userId"]),
});
