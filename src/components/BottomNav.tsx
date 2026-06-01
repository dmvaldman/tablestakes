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
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md divide-x divide-outline-variant border-t border-outline-variant bg-surface-container pb-[env(safe-area-inset-bottom)]">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`flex flex-1 items-center justify-center py-4 text-lg font-medium tracking-wide transition-colors ${
            tab === it.key
              ? "text-primary"
              : "text-on-surface-variant"
          }`}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}
