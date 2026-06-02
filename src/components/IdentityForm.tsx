import { useState } from "react";

// First name + last initial. Used both at first run and when editing.
export default function IdentityForm({
  initialFirst = "",
  initialLast = "",
  submitLabel,
  onSubmit,
}: {
  initialFirst?: string;
  initialLast?: string;
  submitLabel: string;
  onSubmit: (firstName: string, lastInitial: string) => void;
}) {
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (first.trim() && last.trim()) onSubmit(first, last);
      }}
    >
      <input
        autoFocus
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        placeholder="First name"
        className="rounded-2xl border border-outline-variant bg-surface-container px-4 py-3.5 text-lg outline-none focus:border-primary"
      />
      <input
        value={last}
        onChange={(e) => setLast(e.target.value.toUpperCase().slice(0, 1))}
        placeholder="Last initial"
        maxLength={1}
        autoCapitalize="characters"
        className="rounded-2xl border border-outline-variant bg-surface-container px-4 py-3.5 text-lg outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={!first.trim() || !last.trim()}
        className="rounded-full bg-primary py-3.5 font-semibold text-on-primary transition active:scale-[0.99] disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  );
}
