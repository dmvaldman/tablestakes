import { saveMe, type Me } from "../lib/identity";
import IdentityForm from "./IdentityForm";

// First-run: ask for a first name + last initial, mint a local identity, done.
export default function NameGate({ onSet }: { onSet: (me: Me) => void }) {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center gap-7 px-8 text-center">
      <div className="animate-pop">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container text-4xl shadow-m3">
          🎲
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Tablestakes</h1>
        <p className="mt-2 text-on-surface-variant">
          Settle the bill by chance. Fair in the long run, fun every time.
        </p>
      </div>
      <IdentityForm
        submitLabel="Start"
        onSubmit={(first, last) => onSet(saveMe(first, last))}
      />
    </div>
  );
}
