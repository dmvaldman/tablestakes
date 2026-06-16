export type Tab = "receipts" | "stats";

export default function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const items: { key: Tab; label: string }[] = [
    { key: "receipts", label: "Receipts" },
    { key: "stats", label: "Stats" },
  ];
  return (
    <nav className="flex shrink-0 divide-x divide-outline-variant border-t border-outline-variant bg-surface pb-[env(safe-area-inset-bottom)]">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`flex flex-1 items-center justify-center py-4 text-lg font-medium tracking-wide transition-colors ${
            tab === it.key
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant"
          }`}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}
