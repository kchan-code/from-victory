/**
 * @vitest-environment jsdom
 *
 * FV-754 — Cache Storage is cleared when the account ends or changes.
 *
 * The `fv-audio-*` buckets hold public clips, but which clips are present
 * reveals the previous athlete's sport/position/selections. Pins:
 *   - the helper deletes every fv-audio-* bucket (any manifest version) and
 *     nothing else (fv-shell-*, unrelated caches survive), never throws, and
 *     no-ops without Cache Storage
 *   - sign-out, /signin mount, athlete "sign in as someone else", invite setup,
 *     /pair + /invite and the post-deletion landing all trigger it
 *   - the same-account lapse surfaces (/athlete/paused, /subscribe) do NOT
 *   - nothing on the ordinary Pregame open path references it (offline audio
 *     must survive a reload / cold start)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("server-only", () => ({}));
// React 18 canary hooks are not in the jsdom react-dom build.
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) => [initialState, vi.fn()],
    useFormStatus: () => ({ pending: false }),
  };
});
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchString),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/actions/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/actions/pairings", () => ({
  athleteSignIn: vi.fn(),
  forgetDevice: vi.fn(),
}));
vi.mock("@/lib/actions/invites", () => ({ claimAthleteInvite: vi.fn() }));
vi.mock("@/components/athlete/CoachmarkTour", () => ({ clearTourFlags: vi.fn() }));

let searchString = "";

import { clearOfflineAudioCaches } from "@/lib/audio/clear-audio-cache";
import { MANIFEST_VERSION } from "@/components/pregame/audio-mapping";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ClearCacheOnMount } from "@/components/auth/ClearCacheOnMount";
import { AthleteSignInForm } from "@/components/auth/AthleteSignInForm";
import { InviteSetupForm } from "@/components/auth/InviteSetupForm";
import { ClearOfflinePregameOnMount } from "@/components/pregame/ClearOfflinePregameOnMount";
import { AccountDeletionNotice } from "@/components/landing/AccountDeletionNotice";

let buckets: Set<string>;
const deleteSpy = vi.fn();

function installCaches(initial: string[]) {
  buckets = new Set(initial);
  deleteSpy.mockClear();
  vi.stubGlobal("caches", {
    keys: async () => [...buckets],
    delete: async (k: string) => {
      deleteSpy(k);
      return buckets.delete(k);
    },
  });
}

const SEEDED = [
  `fv-audio-${MANIFEST_VERSION}`,
  "fv-audio-oldversion",
  "fv-shell-v3",
  "something-else",
];
const SURVIVORS = ["fv-shell-v3", "something-else"];

const store = new Map<string, string>();
beforeEach(() => {
  searchString = "";
  store.clear();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
    configurable: true,
    writable: true,
  });
  installCaches(SEEDED);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("clearOfflineAudioCaches", () => {
  it("deletes every fv-audio-* bucket (current and older versions) and nothing else", async () => {
    await clearOfflineAudioCaches();
    expect([...buckets].sort()).toEqual([...SURVIVORS].sort());
  });

  it("matches the prefix the audio pipeline actually writes", () => {
    expect(`fv-audio-${MANIFEST_VERSION}`.startsWith("fv-audio-")).toBe(true);
  });

  it("no-ops when Cache Storage is unavailable (SSR / non-HTTPS)", async () => {
    vi.stubGlobal("caches", undefined);
    await expect(clearOfflineAudioCaches()).resolves.toBeUndefined();
  });

  it("never throws when keys() or delete() fail", async () => {
    vi.stubGlobal("caches", {
      keys: async () => {
        throw new Error("boom");
      },
      delete: async () => true,
    });
    await expect(clearOfflineAudioCaches()).resolves.toBeUndefined();

    vi.stubGlobal("caches", {
      keys: async () => ["fv-audio-x"],
      delete: async () => {
        throw new Error("boom");
      },
    });
    await expect(clearOfflineAudioCaches()).resolves.toBeUndefined();
  });
});

describe("call sites that mean 'account ended or changed'", () => {
  it("sign-out button clears audio caches on submit", async () => {
    render(<SignOutButton />);
    fireEvent.submit(screen.getByTestId("sign-out-btn").closest("form")!);
    await waitFor(() => expect([...buckets].sort()).toEqual([...SURVIVORS].sort()));
  });

  it("/signin mount clears audio caches", async () => {
    render(<ClearCacheOnMount />);
    await waitFor(() => expect([...buckets].sort()).toEqual([...SURVIVORS].sort()));
  });

  it("'Not {name}? Sign in as someone else' clears audio caches", async () => {
    render(<AthleteSignInForm firstName="Sam" />);
    fireEvent.submit(screen.getByTestId("forget-device-btn").closest("form")!);
    await waitFor(() => expect([...buckets].sort()).toEqual([...SURVIVORS].sort()));
  });

  it("invite setup clears audio caches", async () => {
    render(<InviteSetupForm code="abc" firstName="Sam" mode="invite" username="sam1" />);
    await waitFor(() => expect([...buckets].sort()).toEqual([...SURVIVORS].sort()));
  });

  it("/pair + /invite (clearAudio) clear audio caches", async () => {
    render(<ClearOfflinePregameOnMount clearAudio />);
    await waitFor(() => expect([...buckets].sort()).toEqual([...SURVIVORS].sort()));
  });

  it("landing after account deletion (?account_deleted=1) clears audio caches", async () => {
    searchString = "account_deleted=1";
    render(<AccountDeletionNotice />);
    await waitFor(() => expect([...buckets].sort()).toEqual([...SURVIVORS].sort()));
  });
});

describe("paths that must NOT clear audio (offline Pregame stays usable)", () => {
  it("same-account lapse surfaces (/athlete/paused, /subscribe) keep the download", async () => {
    render(<ClearOfflinePregameOnMount />);
    await Promise.resolve();
    await Promise.resolve();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect([...buckets].sort()).toEqual([...SEEDED].sort());
  });

  it("an ordinary landing visit (no account_deleted) keeps the download", async () => {
    render(<AccountDeletionNotice />);
    await Promise.resolve();
    await Promise.resolve();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("nothing on the Pregame open path imports the clearing helper", () => {
    const root = path.resolve(__dirname, "..");
    for (const f of [
      "components/pregame/PregameClientShell.tsx",
      "components/pregame/PregameFlow.tsx",
      "app/athlete/pregame/page.tsx",
      "lib/pregame/athlete-cache.ts",
      "lib/audio/cache-strategy.ts",
    ]) {
      expect(readFileSync(path.join(root, f), "utf8"), f).not.toMatch(
        /clear-audio-cache|clearOfflineAudioCaches/,
      );
    }
  });
});
