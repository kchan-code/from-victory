/**
 * FV-727 — analytics mount decision.
 *
 * The script must not mount for a signed-in minor or inside a native store
 * shell, on any route. /privacy and /terms are the reported holes: they are
 * on the marketing allowlist and linked from Settings. Signed-out browser
 * visitors on marketing paths are unchanged.
 */

import { describe, expect, it } from "vitest";

import {
  classifyAnalyticsSession,
  hasSupabaseAuthSessionCookie,
  shouldMountAnalytics,
  type AnalyticsSession,
} from "@/lib/analytics/mount";

const LEGAL_PATHS = ["/privacy", "/terms"] as const;

describe("shouldMountAnalytics — /privacy and /terms", () => {
  it.each(LEGAL_PATHS)(
    "signed-out browser visitor still mounts on %s",
    (pathname) => {
      expect(
        shouldMountAnalytics(pathname, {
          nativeShell: false,
          session: "signed-out",
        }),
      ).toBe(true);
    },
  );

  it.each(LEGAL_PATHS)(
    "signed-in minor does not mount on %s",
    (pathname) => {
      expect(
        shouldMountAnalytics(pathname, {
          nativeShell: false,
          session: "minor",
        }),
      ).toBe(false);
    },
  );

  it.each(LEGAL_PATHS)(
    "native shell does not mount on %s when signed out",
    (pathname) => {
      expect(
        shouldMountAnalytics(pathname, {
          nativeShell: true,
          session: "signed-out",
        }),
      ).toBe(false);
    },
  );

  it.each(LEGAL_PATHS)(
    "native shell does not mount on %s for a signed-in minor",
    (pathname) => {
      expect(
        shouldMountAnalytics(pathname, {
          nativeShell: true,
          session: "minor",
        }),
      ).toBe(false);
    },
  );

  it.each(LEGAL_PATHS)(
    "native shell does not mount on %s for a non-minor session",
    (pathname) => {
      expect(
        shouldMountAnalytics(pathname, {
          nativeShell: true,
          session: "non-minor",
        }),
      ).toBe(false);
    },
  );
});

describe("shouldMountAnalytics — any route", () => {
  const routes = ["/", "/pricing", "/privacy", "/terms", "/athlete", "/athlete/settings", "/dashboard"];

  it.each(routes)("a signed-in minor never mounts on %s", (pathname) => {
    expect(
      shouldMountAnalytics(pathname, { nativeShell: false, session: "minor" }),
    ).toBe(false);
  });

  it.each(routes)("a native shell never mounts on %s", (pathname) => {
    expect(
      shouldMountAnalytics(pathname, {
        nativeShell: true,
        session: "signed-out",
      }),
    ).toBe(false);
  });

  it("an unresolved session does not mount, even on a marketing path", () => {
    expect(
      shouldMountAnalytics("/pricing", {
        nativeShell: false,
        session: "unresolved",
      }),
    ).toBe(false);
  });

  it("signed-out marketing pages are unchanged", () => {
    expect(
      shouldMountAnalytics("/pricing", {
        nativeShell: false,
        session: "signed-out",
      }),
    ).toBe(true);
    expect(
      shouldMountAnalytics("/", { nativeShell: false, session: "signed-out" }),
    ).toBe(true);
    expect(
      shouldMountAnalytics("/athlete/daily", {
        nativeShell: false,
        session: "signed-out",
      }),
    ).toBe(false);
  });

  it("a non-minor browser visitor still mounts on marketing paths only", () => {
    const session: AnalyticsSession = "non-minor";
    expect(
      shouldMountAnalytics("/privacy", { nativeShell: false, session }),
    ).toBe(true);
    expect(
      shouldMountAnalytics("/terms", { nativeShell: false, session }),
    ).toBe(true);
    expect(
      shouldMountAnalytics("/athlete/settings", { nativeShell: false, session }),
    ).toBe(false);
  });
});

describe("classifyAnalyticsSession", () => {
  it("role athlete is a minor", () => {
    expect(classifyAnalyticsSession({ hasSessionUser: true, role: "athlete" })).toBe(
      "minor",
    );
  });

  it("parent and adult_athlete are non-minors", () => {
    expect(classifyAnalyticsSession({ hasSessionUser: true, role: "parent" })).toBe(
      "non-minor",
    );
    expect(
      classifyAnalyticsSession({ hasSessionUser: true, role: "adult_athlete" }),
    ).toBe("non-minor");
  });

  it("no verified user is signed out", () => {
    expect(classifyAnalyticsSession({ hasSessionUser: false, role: "athlete" })).toBe(
      "signed-out",
    );
    expect(classifyAnalyticsSession({ hasSessionUser: false, role: null })).toBe(
      "signed-out",
    );
  });

  it("a verified user with no role or an unknown role is unresolved", () => {
    expect(classifyAnalyticsSession({ hasSessionUser: true, role: null })).toBe(
      "unresolved",
    );
    expect(classifyAnalyticsSession({ hasSessionUser: true, role: "" })).toBe(
      "unresolved",
    );
    expect(classifyAnalyticsSession({ hasSessionUser: true, role: "coach" })).toBe(
      "unresolved",
    );
  });
});

describe("hasSupabaseAuthSessionCookie", () => {
  it("matches the session cookie and its chunks", () => {
    expect(hasSupabaseAuthSessionCookie(["sb-abcdefghijklmnop-auth-token"])).toBe(
      true,
    );
    expect(
      hasSupabaseAuthSessionCookie(["sb-abcdefghijklmnop-auth-token.0"]),
    ).toBe(true);
    expect(
      hasSupabaseAuthSessionCookie(["other", "sb-project-auth-token.1"]),
    ).toBe(true);
  });

  it("does not treat the PKCE verifier or unrelated cookies as a session", () => {
    expect(
      hasSupabaseAuthSessionCookie(["sb-abcdefghijklmnop-auth-token-code-verifier"]),
    ).toBe(false);
    expect(hasSupabaseAuthSessionCookie(["fv_device", "sb-auth-token"])).toBe(
      false,
    );
    expect(hasSupabaseAuthSessionCookie([])).toBe(false);
  });
});
