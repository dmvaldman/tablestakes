import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Slim, accountless model. We persist only the meal SUMMARY — never items,
// never images. Items are transient (used on the creator's device to run the
// algorithm, then discarded). Identity is the client-generated uuid in
// `userId`; names are denormalized labels.
//
// Participants are normalized into their own table because the hot query is
// "meals I'm in" — array membership isn't indexable in Convex, a by_user index
// is. It also avoids write-contention when several friends claim concurrently.

export default defineSchema({
  meals: defineTable({
    // share token = the document _id, so /m/<_id> resolves directly.
    creatorId: v.string(),
    createdAt: v.number(), // ms epoch, set server-side
    total: v.number(), // post-tax, pre-tip
    // The buyer of the chosen item, discovered when exactly one participant
    // confirms "I paid". Null until then.
    payerId: v.union(v.string(), v.null()),
  }),

  participations: defineTable({
    mealId: v.id("meals"),
    userId: v.string(),
    name: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_meal", ["mealId"])
    .index("by_meal_user", ["mealId", "userId"]),
});
