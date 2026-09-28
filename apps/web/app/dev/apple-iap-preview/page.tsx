import { notFound } from "next/navigation";

import { getRequestShellCapability } from "@/lib/native-shell";
import { getConfiguredAppleProducts } from "@/lib/subscriptions/apple-products";
import { AppleSubscribeSection } from "@/components/subscribe/AppleSubscribeSection";

import { BridgeProbe } from "./probe";

export const metadata = {
  title: "Dev · Apple IAP Preview",
};

/**
 * /dev/apple-iap-preview (FV-573) — local-simulator-only preview of the REAL
 * AppleSubscribeSection.
 *
 * WHY THIS EXISTS: the production /subscribe page requires an authenticated
 * parent/adult-athlete session (`requireSubscriber()`) plus a live Supabase
 * connection — neither exists in the local iOS Simulator UI pass for FV-573
 * (there is no local Supabase and no synthetic-auth mode, deliberately not
 * being built). This route renders the exact same `AppleSubscribeSection`
 * component the production page renders — no copy, no fork, no prop changes
 * — standalone, so it can be visually inspected inside the Simulator shell.
 * No auth check, no data reads, no cookies, no production writes.
 *
 * HARD GATE — must be structurally unreachable in any production build.
 * Checked FIRST, before anything else in this component runs:
 *   - `NODE_ENV !== "development"` is true for every `next build` /
 *     `next start` — including Vercel production AND Vercel Preview. Only a
 *     local `next dev` server has `NODE_ENV=development`.
 *   - `FV_IAP_DEV_PREVIEW !== "1"` is defense-in-depth on top of that: even a
 *     local dev server does not render this unless the flag is deliberately
 *     set for a FV-573 pass. Neither condition is reachable by an end user
 *     or any deployed environment.
 *
 * This route also sits under app/dev/layout.tsx's existing `VERCEL_ENV ===
 * "production"` gate, but that gate alone is not enough here: it deliberately
 * leaves other /dev/* showcase pages visible on Vercel Preview for PR review.
 * This page's own NODE_ENV gate is intentionally STRICTER — it exists only
 * for a local-simulator pass and must not render on Preview either.
 */
export default function AppleIapPreviewPage() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.FV_IAP_DEV_PREVIEW !== "1"
  ) {
    notFound();
  }

  // Real runtime facts, read the same way the production page does — no
  // synthetic values. See lib/native-shell.ts / lib/subscriptions/apple-products.ts.
  const shellCapability = getRequestShellCapability();
  const configuredProductCount = getConfiguredAppleProducts().length;

  return (
    <main id="main-content" className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[560px]">
        <div
          role="status"
          data-testid="dev-iap-preview-banner"
          className="mb-8 bg-charcoal border border-gold/40 rounded-xl px-5 py-4"
        >
          <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[11px] text-gold mb-2">
            FV-573 DEV PREVIEW
          </p>
          <p className="font-body text-cream/70 text-[13px] leading-relaxed">
            Synthetic product config&nbsp;&mdash; NOT the production
            /subscribe page&nbsp;&mdash; purchase submissions will fail
            unauthenticated by design.
          </p>
          <p
            data-testid="dev-iap-preview-shell-capability"
            className="mt-3 font-mono text-[11px] text-cream/50"
          >
            shellCapability: {shellCapability ?? "null"}
          </p>
          <p
            data-testid="dev-iap-preview-product-count"
            className="mt-1 font-mono text-[11px] text-cream/50"
          >
            configuredProducts: {configuredProductCount}
          </p>
          <BridgeProbe />
        </div>

        <AppleSubscribeSection />
      </div>
    </main>
  );
}
