import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { loadMe, saveMe, type Me } from "./lib/identity";
import NameGate from "./components/NameGate";
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
  const [me, setMe] = useState<Me | null>(loadMe());
  const [tab, setTab] = useState<Tab>("receipts");
  const [capturing, setCapturing] = useState(false); // camera open
  const [captured, setCaptured] = useState<string | null>(null); // photo data URL
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const renameUser = useMutation(api.meals.renameUser);
  const mealId = sharedMealId();

  async function saveName() {
    const n = draftName.trim();
    setEditingName(false);
    if (!me || !n || n === me.name) return;
    const updated = saveMe(n); // keeps the same uuid
    setMe(updated);
    await renameUser({ userId: updated.id, name: n }); // backfill past meals
  }

  // Re-render on back/forward so the share route resolves.
  const [, force] = useState(0);
  useEffect(() => {
    const onPop = () => force((n) => n + 1);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!me) return <NameGate onSet={setMe} />;

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
    <div className="mx-auto flex h-[100svh] max-w-md flex-col overflow-hidden bg-surface text-on-surface">
      <header className="flex shrink-0 items-center justify-between bg-surface px-5 pt-5 pb-3">
        <h1 className="text-2xl font-medium tracking-tight">Dinner Winner</h1>
        {editingName ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right text-sm outline-none focus:border-primary"
          />
        ) : (
          <button
            onClick={() => {
              setDraftName(me.name);
              setEditingName(true);
            }}
            className="text-sm text-on-surface-variant underline-offset-2 hover:underline"
          >
            {me.name}
          </button>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {tab === "receipts" ? <Receipts me={me} /> : <Friends me={me} />}
      </main>

      {/* M3 FAB — rounded-square tonal container; opens the in-app camera */}
      <button
        onClick={() => setCapturing(true)}
        aria-label="New receipt"
        className="fixed bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-3xl leading-none text-on-primary-container shadow-m3 transition active:scale-95"
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
    </div>
  );
}
