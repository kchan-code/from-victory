"use client";

import { useReportClientError } from "@/components/errors/useReportClientError";
import { hardReload } from "@/lib/deploy-skew";

/**
 * Root-layout error UI (FV-729).
 *
 * global-error replaces the root layout, so this file cannot assume
 * Tailwind, next/font, or globals.css loaded. Colors are the brand tokens
 * from app/globals.css (--fv-onyx, --fv-white, --fv-gold, --fv-gold-bright)
 * inlined so a broken layout still paints a dark screen with one reload.
 */

const css = `
  html, body { margin: 0; background: #050505; color: #F7F7F7; }
  .fv-ge-btn { background: #DFAF37; color: #050505; }
  .fv-ge-btn:hover { background: #F4C24F; }
  .fv-ge-btn:focus-visible { outline: 2px solid #DFAF37; outline-offset: 3px; }
  .fv-ge-btn:active { transform: scale(0.97); }
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useReportClientError(error);

  function reload() {
    if (typeof window !== "undefined") {
      hardReload();
      return;
    }
    reset();
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#050505",
          color: "#F7F7F7",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <style>{css}</style>
        <main
          id="main-content"
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 24px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div style={{ maxWidth: 360, width: "100%" }}>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#DFAF37",
                marginBottom: 16,
              }}
            >
              From Victory
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                lineHeight: 1.1,
                margin: "0 0 16px",
                color: "#F7F7F7",
              }}
            >
              Something went wrong.
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(247,247,247,0.72)",
                margin: "0 0 32px",
              }}
            >
              We hit an unexpected error. Your training is safe. Reload and
              pick up where you are today.
            </p>
            <button
              type="button"
              onClick={reload}
              className="fv-ge-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                border: "1px solid #DFAF37",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                padding: "14px 28px",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
