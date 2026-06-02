// Initial-in-a-circle avatar with a deterministic color keyed off a stable id
// (so a rename keeps the same color). Dark-mode-friendly tonal pairs.
const PALETTE: [string, string][] = [
  ["#4F378B", "#EADDFF"], // purple
  ["#00504A", "#9ff2e3"], // teal
  ["#7A2E10", "#ffd9c7"], // burnt orange
  ["#28386E", "#dbe4ff"], // indigo
  ["#5A1133", "#ffd9e3"], // magenta
  ["#3D4A12", "#e7f3a6"], // olive
  ["#5C3A00", "#ffdda1"], // amber
];

function colorFor(key: string): [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// "David V." → "DV", "David" → "D"
function initialsFrom(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "?";
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  return (
    tokens[0].charAt(0) + tokens[tokens.length - 1].charAt(0)
  ).toUpperCase();
}

export default function Avatar({
  name,
  colorKey,
  size = 40,
}: {
  name: string; // display name, e.g. "David V."
  colorKey?: string; // stable id; falls back to name
  size?: number;
}) {
  const [bg, fg] = colorFor(colorKey ?? name);
  const label = initialsFrom(name);
  const fontScale = label.length === 2 ? 0.38 : 0.44;
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-full font-medium leading-none tracking-tight"
      style={{
        background: bg,
        color: fg,
        width: size,
        height: size,
        fontSize: size * fontScale,
        lineHeight: 1,
      }}
    >
      <span className="block translate-y-[0.04em]">{label}</span>
    </div>
  );
}
