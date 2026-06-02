export type Tab = "receipts" | "friends";

export default function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const items: { key: Tab; label: string }[] = [
    { key: "receipts", label: "Receipts" },
    { key: "friends", label: "Friends" },
  ];
  return (
    <nav className="flex shrink-0 divide-x divide-outline-variant border-t border-outline-variant bg-surface-container pb-[env(safe-area-inset-bottom)]">
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
