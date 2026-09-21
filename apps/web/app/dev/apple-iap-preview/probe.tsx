"use client";

import { useEffect, useState } from "react";

import { isAppleIapBridgeAvailable } from "@/lib/native/apple-iap";

/**
 * Dev-only diagnostic (FV-573 UI pass): renders the CLIENT-side view of the
 * bridge at hydration time and again 1.5s later, on screen, so a simulator
 * screenshot distinguishes (a) hydration never ran, (b) bridge missing at
 * mount but present later (injection race — would break the real component's
 * mount-time-only check), (c) bridge present at mount. Lives only under the
 * hard-gated /dev/apple-iap-preview route.
 */
export function BridgeProbe() {
  const [state, setState] = useState("hydration: NOT RUN");

  useEffect(() => {
    const now = () => Math.round(performance.now());
    setState(
      `mount@${now()}ms: bridge ${isAppleIapBridgeAvailable() ? "PRESENT" : "MISSING"}`,
    );
    const t = setTimeout(() => {
      setState(
        (prev) =>
          `${prev} | recheck@${now()}ms: ${isAppleIapBridgeAvailable() ? "PRESENT" : "MISSING"}`,
      );
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <p
      data-testid="dev-bridge-probe"
      className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/60"
    >
      {state}
    </p>
  );
}
