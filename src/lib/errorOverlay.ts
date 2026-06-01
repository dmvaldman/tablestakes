// On-screen error overlay for mobile debugging (no console on a phone).
// Plain DOM so it works even if React crashes. Import once in main.tsx.

let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (host) return host;
  host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "right:0",
    "bottom:0",
    "z-index:99999",
    "max-height:60vh",
    "overflow:auto",
    "background:#3b0a0a",
    "color:#ffd7d7",
    "font:12px/1.4 ui-monospace,Menlo,monospace",
    "padding:10px 12px",
    "white-space:pre-wrap",
    "word-break:break-word",
    "border-top:2px solid #ff6b6b",
  ].join(";");

  const close = document.createElement("button");
  close.textContent = "Dismiss";
  close.style.cssText =
    "position:sticky;top:0;float:right;background:#ff6b6b;color:#3b0a0a;border:0;border-radius:6px;padding:4px 10px;font-weight:700;";
  close.onclick = () => {
    if (host) host.innerHTML = "";
  };
  host.appendChild(close);
  document.body.appendChild(host);
  return host;
}

export function reportError(label: string, detail: unknown) {
  const h = ensureHost();
  const line = document.createElement("div");
  line.style.marginTop = "8px";
  const msg =
    detail instanceof Error
      ? `${detail.name}: ${detail.message}\n${detail.stack ?? ""}`
      : typeof detail === "object"
        ? JSON.stringify(detail, null, 2)
        : String(detail);
  line.textContent = `▶ ${label}\n${msg}`;
  h.appendChild(line);
}

export function installErrorOverlay() {
  window.addEventListener("error", (e) =>
    reportError("window.error", e.error ?? e.message),
  );
  window.addEventListener("unhandledrejection", (e) =>
    reportError("unhandledrejection", e.reason),
  );
}
