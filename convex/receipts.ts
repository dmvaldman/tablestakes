"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

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

export type OcrItem = {
  name: string;
  price: number; // total price for the given quantity
  quantity: number;
  /** [ymin, xmin, ymax, xmax] normalized to 0–1000, for highlighting on the photo */
  box?: number[];
};
export type ReceiptOcr = { currency?: string; total: number; items: OcrItem[] };

// Gemini structured-output schema (OpenAPI subset).
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    currency: { type: "string" },
    total: {
      type: "number",
      description: "grand total AFTER tax but BEFORE tip",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: {
            type: "number",
            description: "line price for the whole quantity",
          },
          quantity: { type: "integer" },
          box: {
            type: "array",
            description: "[ymin, xmin, ymax, xmax] normalized 0–1000",
            items: { type: "number" },
          },
        },
        required: ["name", "price", "quantity"],
      },
    },
  },
  required: ["total", "items"],
};

const PROMPT = `You are reading a restaurant receipt photo. Extract ONLY the
ordered food/drink line items — never the subtotal, tax, tip, total, or
service rows. For each item give its name, its printed line price, and its
quantity. Also give "box": the bounding box of that line on the image as
[ymin, xmin, ymax, xmax] normalized to 0–1000. Separately return "total": the
grand total AFTER tax but BEFORE any tip. Use plain numbers (no currency
symbols).`;

export const itemizeReceipt = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (_ctx, { imageBase64, mimeType }): Promise<ReceiptOcr> => {
    const key = env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY not set — run `npx convex env set GEMINI_API_KEY <key>`",
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType ?? "image/jpeg",
                    data: imageBase64,
                  },
                },
                { text: PROMPT },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0,
          },
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini ${MODEL} error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content");

    const parsed = JSON.parse(text) as ReceiptOcr;
    if (!parsed.items?.length) throw new Error("No items found on the receipt");
    return parsed;
  },
});
