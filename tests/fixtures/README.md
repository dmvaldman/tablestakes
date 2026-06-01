# Test fixtures

Place the Cedar & Hops receipt photo here as **`receipt.jpg`** to run the live
OCR end-to-end test:

```bash
npm run test:ocr
```

The test reads `receipt.jpg` (override with `node --experimental-strip-types
tests/ocr.e2e.ts <path>`), sends it through the real Gemini OCR, and asserts the
extracted items + post-tax/pre-tip total ($131.19) are correct. It needs
`GEMINI_API_KEY` in `.env.convex` and skips gracefully if either is missing.

The image itself is gitignored (don't commit receipt photos).
