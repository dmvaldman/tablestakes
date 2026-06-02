import { saveMe, type Me } from "../lib/identity";
import IdentityForm from "./IdentityForm";

// First-run: ask for a first name + last initial, mint a local identity, done.
export default function NameGate({ onSet }: { onSet: (me: Me) => void }) {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center gap-7 px-8 text-center">
      <div className="animate-pop">
        <h1 className="text-5xl font-bold tracking-tight">TableStakes</h1>
        <p className="mt-4 text-lg text-on-surface-variant">
          Split a bill the fun way — by chance!
        </p>
      </div>
      <IdentityForm
        submitLabel="Start"
        onSubmit={(first, last) => onSet(saveMe(first, last))}
      />
    </div>
  );
}
