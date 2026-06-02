// Accountless identity. The uuid IS the nonce — the stable key for "you"
// across meals. We store a first name + last initial; display is "David V.",
// avatar is "DV". Lives in localStorage; clearing it / a new phone = a new
// identity (and lost history), an accepted tradeoff.

const KEY = "tablestakes.me.v1";

export type Me = { id: string; firstName: string; lastInitial: string };

function uuid(): string {
  // randomUUID is secure-context only; build a v4 from getRandomValues (which
  // works on plain http) and fall back to Math.random.
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

// "David V." (or just "David" if no last initial).
export function displayName(m: {
  firstName: string;
  lastInitial: string;
}): string {
  return m.lastInitial ? `${m.firstName} ${m.lastInitial}.` : m.firstName;
}

// First name only, from a stored display name like "David V.".
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function loadMe(): Me | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o?.id) return null;
    if (typeof o.firstName === "string")
      return {
        id: o.id,
        firstName: o.firstName,
        lastInitial: o.lastInitial ?? "",
      };
    // migrate the old single-`name` format
    if (typeof o.name === "string") {
      const parts = o.name.trim().split(/\s+/);
      return {
        id: o.id,
        firstName: parts[0] ?? "",
        lastInitial: (parts[1]?.[0] ?? "").toUpperCase(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearMe(): void {
  localStorage.removeItem(KEY);
}

export function saveMe(firstName: string, lastInitial: string): Me {
  const existing = loadMe();
  const me: Me = {
    id: existing?.id ?? uuid(),
    firstName: firstName.trim(),
    lastInitial: lastInitial.trim().charAt(0).toUpperCase(),
  };
  localStorage.setItem(KEY, JSON.stringify(me));
  return me;
}
