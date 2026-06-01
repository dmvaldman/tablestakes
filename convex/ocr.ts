// Pure receipt-OCR helper — no Convex imports, so it can be unit/integration
// tested directly from Node. `convex/receipts.ts` wraps this in an action.

export type OcrItem = {
  name: string;
  price: number; // total price for the given quantity
  quantity: number;
  /** [ymin, xmin, ymax, xmax] normalized 0–1000, for highlighting on the photo */
  box?: number[];
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

export const OCR_PROMPT = `You are reading a restaurant receipt photo. Extract
ONLY the ordered food/drink line items — never the subtotal, tax, tip, total, or
service rows. For each item give its name, its printed line price, and its
quantity. Also give "box": the bounding box of that line on the image as
[ymin, xmin, ymax, xmax] normalized to 0–1000. Separately return "total": the
grand total AFTER tax but BEFORE any tip. Use plain numbers (no currency
symbols).`;

export async function fetchReceiptOcr(opts: {
  imageBase64: string;
  mimeType?: string;
  apiKey: string;
  model: string;
}): Promise<ReceiptOcr> {
  const { imageBase64, mimeType, apiKey, model } = opts;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
    throw new Error(`Gemini ${model} error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text) as ReceiptOcr;
  if (!parsed.items?.length) throw new Error("No items found on the receipt");
  return parsed;
}
