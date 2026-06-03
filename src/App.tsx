import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { loadMe, saveMe, clearMe, displayName, type Me } from "./lib/identity";
import NameGate from "./components/NameGate";
import Instructions from "./components/Instructions";
import Avatar from "./components/Avatar";
import IdentityForm from "./components/IdentityForm";
import HowItWorks from "./components/HowItWorks";
import BottomNav, { type Tab } from "./components/BottomNav";
import CameraCapture from "./components/CameraCapture";
import Receipts from "./screens/Receipts";
import Friends from "./screens/Friends";
import NewReceipt from "./screens/NewReceipt";
import JoinMeal from "./screens/JoinMeal";

// Tiny path router: /m/<id> is a shared meal, everything else is the app home.
function sharedMealId(): string | null {
  const m = window.location.pathname.match(/^\/m\/([^/]+)$/);
  return m ? m[1] : null;
}

export default function App() {
  const [me, setMe] = useState<Me | null>(() => {
    // Testing helper: visiting "?reset" clears your identity → back to the name screen.
    if (new URLSearchParams(window.location.search).has("reset")) {
      clearMe();
      window.history.replaceState({}, "", window.location.pathname);
      return null;
    }
    return loadMe();
  });
  const [tab, setTab] = useState<Tab>("receipts");
  const [capturing, setCapturing] = useState(false); // camera open
  const [captured, setCaptured] = useState<string | null>(null); // photo data URL
  const [editing, setEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [onboarded, setOnboarded] = useState(false); // dismissed first-run instructions
  const renameUser = useMutation(api.meals.renameUser);
  const mealId = sharedMealId();

  async function saveIdentity(first: string, last: string) {
    setEditing(false);
    const updated = saveMe(first, last); // keeps the same uuid
    setMe(updated);
    // backfill the denormalized display name on past meals
    await renameUser({ userId: updated.id, name: displayName(updated) });
  }

  // Re-render on back/forward so the share route resolves.
  const [, force] = useState(0);
  useEffect(() => {
    const onPop = () => force((n) => n + 1);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!me) {
    // First-run instructions on the home route only — never on a share link
    // (those visitors just need a name to join). Skipped once you have a name.
    if (!mealId && !onboarded)
      return <Instructions onContinue={() => setOnboarded(true)} />;
    return <NameGate onSet={setMe} />;
  }

  if (mealId) {
    return (
      <JoinMeal
        me={me}
        mealId={mealId}
        onDone={() => {
          window.history.pushState({}, "", "/");
          force((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div className="relative flex h-[100svh] flex-col overflow-hidden bg-surface text-on-surface">
      <header className="flex shrink-0 items-center justify-between bg-surface px-5 pt-5 pb-3">
        <h1 className="text-2xl font-medium tracking-tight">TableStakes</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(true)}
            aria-label="How it works"
            className="text-on-surface-variant transition active:scale-95"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </button>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit your name"
            className="transition active:scale-95"
          >
            <Avatar name={displayName(me)} colorKey={me.id} size={36} />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {tab === "receipts" ? <Receipts me={me} /> : <Friends me={me} />}
      </main>

      {/* M3 FAB — rounded-square tonal container; opens the in-app camera */}
      <button
        onClick={() => setCapturing(true)}
        aria-label="New receipt"
        className="absolute bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-3xl leading-none text-on-primary-container shadow-m3 transition active:scale-95"
      >
        +
      </button>

      <BottomNav tab={tab} onChange={setTab} />

      {capturing && (
        <CameraCapture
          onCapture={(dataUrl) => {
            setCaptured(dataUrl);
            setCapturing(false);
          }}
          onClose={() => setCapturing(false)}
        />
      )}

      {captured && (
        <NewReceipt
          me={me}
          image={captured}
          onClose={() => setCaptured(null)}
          onRetake={() => {
            setCaptured(null);
            setCapturing(true);
          }}
        />
      )}

      {showHelp && <HowItWorks onClose={() => setShowHelp(false)} />}

      {editing && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-center text-lg font-medium">Your name</h2>
            <IdentityForm
              initialFirst={me.firstName}
              initialLast={me.lastInitial}
              submitLabel="Save"
              onSubmit={saveIdentity}
            />
            <button
              onClick={() => setEditing(false)}
              className="mt-3 w-full py-2 text-center text-sm text-on-surface-variant"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
