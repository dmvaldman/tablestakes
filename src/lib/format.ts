// $150 (no cents when round) / $276.46 (cents when present). Rounds to whole
// cents first so float drift never shows $150.00000001.
export function money(n: number): string {
  const cents = Math.round(n * 100);
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
