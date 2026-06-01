// Accountless identity. The uuid IS the nonce — it's the stable primary key
// for "you" across meals. The display name is just a label and need not be
// globally unique. Lives in localStorage; clearing storage / new phone = new
// identity (and lost history), which is an accepted tradeoff.

const KEY = "expectorant.me.v1";

export type Me = { id: string; name: string };

function uuid(): string {
  // crypto.randomUUID() only exists in secure contexts (https / localhost), so
  // it's undefined when testing over http on the LAN. getRandomValues works on
  // plain http, so build a v4 UUID from it; fall back to Math.random if needed.
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);

  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
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
