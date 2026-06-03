import { saveMe, type Me } from "../lib/identity";
import IdentityForm from "./IdentityForm";

// First-run: ask for a first name + last initial, mint a local identity, done.
export default function NameGate({ onSet }: { onSet: (me: Me) => void }) {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="border-b border-outline-variant px-8 py-7 text-center">
        <h1 className="text-4xl font-bold tracking-tight">TableStakes</h1>
        <p className="mt-2 text-xl text-on-surface-variant">
          A more fun way to split the bill!
        </p>
      </header>

      <div className="flex flex-1 flex-col px-8">
        <div className="flex-1" />
        <div className="mb-5 text-center">
          <p className="text-2xl text-on-surface">Enter your name</p>
          <p className="mt-1 text-base text-on-surface-variant">
            (you can change it later)
          </p>
        </div>
        <IdentityForm
          submitLabel="Start"
          onSubmit={(first, last) => onSet(saveMe(first, last))}
        />
        <div className="flex-[2]" />
      </div>
    </div>
  );
}
