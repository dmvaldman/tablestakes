// Pure receipt-OCR helper — no Convex imports, so it can be unit/integration
// tested directly from Node. `convex/receipts.ts` wraps this in an action.

export type OcrItem = {
  name: string;
  price: number; // total price for the given quantity
  quantity: number;
};
export type ReceiptOcr = { currency?: string; total: number; items: OcrItem[] };

// Gemini structured-output schema (OpenAPI subset).
export const RESPONSE_SCHEMA = {
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
        },
        required: ["name", "price", "quantity"],
      },
    },
  },
  required: ["total", "items"],
};

export const OCR_PROMPT = `You are reading a restaurant receipt photo. Extract
ONLY the ordered food/drink line items — never the subtotal, tax, tip, total, or
service rows. For each item give its name, its printed line price, and its
quantity. Separately return "total": the grand total AFTER tax but BEFORE any
tip. Use plain numbers (no currency symbols).`;

// Statuses where the model is just busy/transient — worth trying another model.
const RETRYABLE_STATUS = new Set([429, 500, 503]);

class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callGemini(
  model: string,
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<ReceiptOcr> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: OCR_PROMPT },
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
    throw new GeminiError(
      `Gemini ${model} error ${res.status}: ${await res.text()}`,
      res.status,
    );
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError(`Gemini ${model} returned no content`, 502);

  const parsed = JSON.parse(text) as ReceiptOcr;
  if (!parsed.items?.length)
    throw new GeminiError("No items found on the receipt", 422);
  return parsed;
}

// Try each model in order; if one is overloaded (503/429/500), fall through to
// the next. Non-retryable errors (e.g. 400/404) throw immediately.
export async function fetchReceiptOcr(opts: {
  imageBase64: string;
  mimeType?: string;
  apiKey: string;
  models: string[];
}): Promise<ReceiptOcr> {
  const { imageBase64, mimeType = "image/jpeg", apiKey, models } = opts;
  if (models.length === 0) throw new Error("no models configured");

  let lastErr: unknown;
  for (let i = 0; i < models.length; i++) {
    try {
      return await callGemini(models[i], imageBase64, mimeType, apiKey);
    } catch (e) {
      lastErr = e;
      const status = e instanceof GeminiError ? e.status : 0;
      const isLast = i === models.length - 1;
      if (isLast || !RETRYABLE_STATUS.has(status)) throw e;
      // else: model busy — try the next one
    }
  }
  throw lastErr;
}
