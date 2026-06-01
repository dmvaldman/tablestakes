import { useEffect, useState } from "react";
import { loadMe, type Me } from "./lib/identity";
import NameGate from "./components/NameGate";
import BottomNav, { type Tab } from "./components/BottomNav";
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
  const [composing, setComposing] = useState(false);
  const mealId = sharedMealId();

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
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col bg-surface text-on-surface">
      <header className="flex items-center justify-between bg-surface px-5 pt-5 pb-3">
        <h1 className="text-2xl font-medium tracking-tight">Expectorant</h1>
        <span className="text-sm text-on-surface-variant">{me.name}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-28">
        {tab === "receipts" ? <Receipts me={me} /> : <Friends me={me} />}
      </main>

      {/* M3 FAB — rounded-square tonal container */}
      <button
        onClick={() => setComposing(true)}
        aria-label="New receipt"
        className="fixed bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-3xl leading-none text-on-primary-container shadow-m3 transition active:scale-95"
      >
        +
      </button>

      <BottomNav tab={tab} onChange={setTab} />

      {composing && <NewReceipt me={me} onClose={() => setComposing(false)} />}
    </div>
  );
}
