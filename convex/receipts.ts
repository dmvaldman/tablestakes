"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// OCR is the ONE reason itemization touches a server: the vision-model API key
// can't ship to the browser. The client sends a base64 image; we return parsed
// items + total. Nothing here is persisted — the client runs the algorithm on
// the result and stores only the meal summary via meals.createMeal.
//
// STUB for v1: wire up a real vision model (e.g. Anthropic / OpenAI) behind
// process.env. Until then the client uses manual item entry. Quantities should
// be expanded into duplicate {name, cost} entries (two steaks = two items).
export const itemizeReceipt = action({
  args: { imageBase64: v.string() },
  handler: async (
    _ctx,
    _args,
  ): Promise<{ items: { name: string; cost: number }[]; total: number }> => {
    throw new Error(
      "itemizeReceipt not configured yet — use manual entry. " +
        "Add a vision-model call here keyed on an env var.",
    );
  },
});
