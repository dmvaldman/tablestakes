import { useState } from "react";
import { saveMe, type Me } from "../lib/identity";

// First-run: ask for a name, mint a local identity, done. No accounts.
export default function NameGate({ onSet }: { onSet: (me: Me) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center gap-6 px-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dinner Winner</h1>
        <p className="mt-2 text-on-surface-variant">
          Settle the bill by chance. Fair in the long run, fun every time.
        </p>
      </div>
      <form
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSet(saveMe(name));
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-xl border border-outline-variant px-4 py-3 text-center text-lg outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-xl bg-primary py-3 font-semibold text-on-primary disabled:opacity-40"
        >
          Start
        </button>
      </form>
    </div>
  );
}
