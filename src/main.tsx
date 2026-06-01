import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";
import { installErrorOverlay, reportError } from "./lib/errorOverlay";

installErrorOverlay();

// Surface a missing/empty Convex URL clearly instead of a cryptic crash.
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
if (!convexUrl) reportError("config", "VITE_CONVEX_URL is not set");
const convex = new ConvexReactClient(convexUrl ?? "");

class ErrorBoundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  componentDidCatch(err: Error) {
    reportError("React render", err);
  }
  render() {
    if (this.state.err)
      return (
        <div className="p-6 text-on-surface-variant">
          Something broke — see the error panel below.
        </div>
      );
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </ErrorBoundary>
  </StrictMode>,
);
