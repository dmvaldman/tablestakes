// Accountless identity. The uuid IS the nonce — it's the stable primary key
// for "you" across meals. The display name is just a label and need not be
// globally unique. Lives in localStorage; clearing storage / new phone = new
// identity (and lost history), which is an accepted tradeoff.

const KEY = "expectorant.me.v1";

export type Me = { id: string; name: string };

function uuid(): string {
  return crypto.randomUUID();
}

export function loadMe(): Me | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const me = JSON.parse(raw) as Me;
    return me.id && me.name ? me : null;
  } catch {
    return null;
  }
}

export function saveMe(name: string): Me {
  const existing = loadMe();
  const me: Me = { id: existing?.id ?? uuid(), name: name.trim() };
  localStorage.setItem(KEY, JSON.stringify(me));
  return me;
}
