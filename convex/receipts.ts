"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchReceiptOcr, type ReceiptOcr } from "./ocr";

// OCR is the one reason itemization touches a server: the model API key can't
// ship to the browser. The client sends the captured photo as base64; we return
// structured line items + total. Nothing is persisted — the client runs the
// algorithm on the result and stores only the meal summary via createMeal.

// Read env without depending on Node's `process` global types (this file is
// deep-checked by the browser tsconfig during `vite build`). Values are
// injected by the Convex deployment env at runtime.
const env: Record<string, string | undefined> =
  (globalThis as { process?: { env: Record<string, string | undefined> } })
    .process?.env ?? {};

// Model name is an env var because Google's Flash lineage changes often. Set it
// with `npx convex env set GEMINI_MODEL <name>` to override the default.
const MODEL = env.GEMINI_MODEL ?? "gemini-2.5-flash";

export const itemizeReceipt = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (_ctx, { imageBase64, mimeType }): Promise<ReceiptOcr> => {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY not set — run `npx convex env set GEMINI_API_KEY <key>`",
      );
    }
    return fetchReceiptOcr({ imageBase64, mimeType, apiKey, model: MODEL });
  },
});
