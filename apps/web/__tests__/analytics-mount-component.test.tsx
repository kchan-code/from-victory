/**
 * @vitest-environment jsdom
 *
 * FV-727 — AnalyticsMount renders the script only when the decision allows
 * it. /privacy and /terms are the reported paths.
 */
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/privacy" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

import { AnalyticsMount } from "@/app/_components/AnalyticsMount";
import type { AnalyticsSession } from "@/lib/analytics/mount";

afterEach(() => {
  cleanup();
  pathname.current = "/privacy";
});

function mount(session: AnalyticsSession, nativeShell: boolean) {
  return render(<AnalyticsMount nativeShell={nativeShell} session={session} />);
}

describe("AnalyticsMount on /privacy and /terms", () => {
  it.each(["/privacy", "/terms"] as const)(
    "mounts for a signed-out browser visitor on %s",
    (path) => {
      pathname.current = path;
      mount("signed-out", false);
      expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    },
  );

  it.each(["/privacy", "/terms"] as const)(
    "does not mount for a signed-in minor on %s",
    (path) => {
      pathname.current = path;
      mount("minor", false);
      expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    },
  );

  it.each(["/privacy", "/terms"] as const)(
    "does not mount inside a native shell on %s",
    (path) => {
      pathname.current = path;
      mount("signed-out", true);
      expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    },
  );

  it.each(["/privacy", "/terms"] as const)(
    "does not mount for a signed-in minor inside a native shell on %s",
    (path) => {
      pathname.current = path;
      mount("minor", true);
      expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    },
  );
});
