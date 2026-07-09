/**
 * Unit tests for the Server Component auth guards (lib/auth/guards.ts).
 *
 * Every guard here follows the shape:
 *
 *   if (cond) redirect(path);
 *   ...
 *   return { ... };
 *
 * next/navigation's real redirect() throws a special NEXT_REDIRECT digest to
 * interrupt rendering. We mock it to throw here too — NOT as a no-op — so
 * that a missing `return` after a redirect (a fall-through bug that would
 * otherwise silently continue and hand back the wrong profile) is caught by
 * the test instead of passing accidentally.
 *
 * For each guard we cover:
 *   - no session                              -> redirect("/signin")
 *   - profile lookup errors                    -> redirect("/signin")
 *   - no profile row                           -> redirect("/signin")
 *   - profile role does not satisfy the guard  -> redirect("/signin")
 *   - profile role satisfies the guard         -> resolves with {userId, profile}
 *
 * redirectIfAuthed is the exception (void return, no session is a no-op, and
 * it fans out to three different destinations), so it gets its own section.
 *
 * Mocking strategy mirrors grants-resolver.test.ts and create-athlete-direct.test.ts:
 *   - vi.mock() hoists before imports.
 *   - Mutable module-level state (`mockUser` / `mockProfile` / `mockProfileError`)
 *     is swapped per test; the chainable supabase stub reads it lazily.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before any import of the module under test)
// ---------------------------------------------------------------------------

// redirect() THROWS — this is the whole point of these tests. Real Next.js
// redirect() also throws (a NEXT_REDIRECT digest) to unwind the render; a
// no-op mock would let fall-through bugs (missing `return` after `redirect()`)
// pass silently.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

type MockUser = { id: string } | null;
type ProfileRow = Record<string, unknown> | null;

let mockUser: MockUser = null;
let mockProfile: ProfileRow = null;
let mockProfileError: { message: string } | null = null;

// Call tracking for the profiles query chain, so tests can assert a guard
// short-circuited (via the thrown redirect) BEFORE ever querying the DB.
let selectCalls: { table: string; columns: string }[] = [];
let eqCalls: { column: string; value: unknown }[] = [];

function resetMockState() {
  mockUser = null;
  mockProfile = null;
  mockProfileError = null;
  selectCalls = [];
  eqCalls = [];
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn((columns: string) => {
        selectCalls.push({ table, columns });
        return {
          eq: vi.fn((column: string, value: unknown) => {
            eqCalls.push({ column, value });
            return {
              single: vi.fn(() =>
                Promise.resolve({ data: mockProfile, error: mockProfileError }),
              ),
            };
          }),
        };
      }),
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks are registered.
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import {
  requireParent,
  requireSelfPayer,
  requireSubscriber,
  requireAthlete,
  redirectIfAuthed,
} from "@/lib/auth/guards";

const USER_ID = "aaaaaaaa-0000-4000-8000-000000000001";

beforeEach(() => {
  resetMockState();
  vi.mocked(redirect).mockClear();
});

// ===========================================================================
// requireParent
// ===========================================================================

describe("requireParent", () => {
  it("redirects to /signin with no session", async () => {
    mockUser = null;

    await expect(requireParent()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
    // Short-circuited before ever querying profiles.
    expect(selectCalls).toHaveLength(0);
  });

  it("redirects to /signin when the profile lookup errors", async () => {
    mockUser = { id: USER_ID };
    mockProfile = null;
    mockProfileError = { message: "db error" };

    await expect(requireParent()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("redirects to /signin when no profile row exists", async () => {
    mockUser = { id: USER_ID };
    mockProfile = null;
    mockProfileError = null;

    await expect(requireParent()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("redirects to /signin when the profile role is not 'parent'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "athlete", first_name: "Jordan" };

    await expect(requireParent()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("returns userId + profile when the role is 'parent'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "parent", first_name: "Casey" };

    const result = await requireParent();

    expect(result).toEqual({
      userId: USER_ID,
      profile: { id: USER_ID, role: "parent", first_name: "Casey" },
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(selectCalls[0]).toEqual({
      table: "profiles",
      columns: "id, role, first_name",
    });
    expect(eqCalls[0]).toEqual({ column: "id", value: USER_ID });
  });
});

// ===========================================================================
// requireSelfPayer
// ===========================================================================

describe("requireSelfPayer", () => {
  it("redirects to /signin with no session", async () => {
    mockUser = null;

    await expect(requireSelfPayer()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
    expect(selectCalls).toHaveLength(0);
  });

  it("redirects to /signin when the profile lookup errors", async () => {
    mockUser = { id: USER_ID };
    mockProfileError = { message: "db error" };

    await expect(requireSelfPayer()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("redirects to /signin when no profile row exists", async () => {
    mockUser = { id: USER_ID };
    mockProfile = null;

    await expect(requireSelfPayer()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("redirects to /signin when the profile role is not 'adult_athlete' (e.g. a parent)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "parent", first_name: "Casey" };

    await expect(requireSelfPayer()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("redirects to /signin when the profile role is a minor athlete", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "athlete", first_name: "Jordan" };

    await expect(requireSelfPayer()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("returns userId + profile when the role is 'adult_athlete'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "adult_athlete", first_name: "Riley" };

    const result = await requireSelfPayer();

    expect(result).toEqual({
      userId: USER_ID,
      profile: { id: USER_ID, role: "adult_athlete", first_name: "Riley" },
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// requireSubscriber (accepts BOTH parent and adult_athlete — FV-327)
// ===========================================================================

describe("requireSubscriber", () => {
  it("redirects to /signin with no session", async () => {
    mockUser = null;

    await expect(requireSubscriber()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
    expect(selectCalls).toHaveLength(0);
  });

  it("redirects to /signin when the profile lookup errors", async () => {
    mockUser = { id: USER_ID };
    mockProfileError = { message: "db error" };

    await expect(requireSubscriber()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("redirects to /signin when no profile row exists", async () => {
    mockUser = { id: USER_ID };
    mockProfile = null;

    await expect(requireSubscriber()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("redirects to /signin when the profile role is a minor athlete (neither parent nor adult_athlete)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "athlete", first_name: "Jordan" };

    await expect(requireSubscriber()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("returns userId + profile when the role is 'parent'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "parent", first_name: "Casey" };

    const result = await requireSubscriber();

    expect(result).toEqual({
      userId: USER_ID,
      profile: { id: USER_ID, role: "parent", first_name: "Casey" },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns userId + profile when the role is 'adult_athlete'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "adult_athlete", first_name: "Riley" };

    const result = await requireSubscriber();

    expect(result).toEqual({
      userId: USER_ID,
      profile: { id: USER_ID, role: "adult_athlete", first_name: "Riley" },
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// requireAthlete (accepts BOTH athlete and adult_athlete — FV-325)
// ===========================================================================

describe("requireAthlete", () => {
  it("redirects to /signin with no session", async () => {
    mockUser = null;

    await expect(requireAthlete()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
    expect(selectCalls).toHaveLength(0);
  });

  it("redirects to /signin when the profile lookup errors", async () => {
    mockUser = { id: USER_ID };
    mockProfileError = { message: "db error" };

    await expect(requireAthlete()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("redirects to /signin when no profile row exists", async () => {
    mockUser = { id: USER_ID };
    mockProfile = null;

    await expect(requireAthlete()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("redirects to /signin when the profile role is 'parent'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { id: USER_ID, role: "parent", first_name: "Casey" };

    await expect(requireAthlete()).rejects.toThrow("NEXT_REDIRECT:/signin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("returns userId + profile when the role is 'athlete'", async () => {
    mockUser = { id: USER_ID };
    mockProfile = {
      id: USER_ID,
      role: "athlete",
      first_name: "Jordan",
      sport: "hockey",
      sport_selected_at: "2026-01-01T00:00:00Z",
      position: "forward",
      focus_area: "confidence",
    };

    const result = await requireAthlete();

    expect(result).toEqual({
      userId: USER_ID,
      profile: mockProfile,
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(selectCalls[0]).toEqual({
      table: "profiles",
      columns: "id, role, first_name, sport, sport_selected_at, position, focus_area",
    });
  });

  it("returns userId + profile when the role is 'adult_athlete' (FV-325)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = {
      id: USER_ID,
      role: "adult_athlete",
      first_name: "Riley",
      sport: "basketball",
      sport_selected_at: null,
      position: null,
      focus_area: null,
    };

    const result = await requireAthlete();

    expect(result).toEqual({
      userId: USER_ID,
      profile: mockProfile,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// redirectIfAuthed — void return, three destinations, no-session is a no-op
// ===========================================================================

describe("redirectIfAuthed", () => {
  it("does nothing (no redirect, resolves) with no session", async () => {
    mockUser = null;

    await expect(redirectIfAuthed()).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
    // Short-circuited before ever querying profiles.
    expect(selectCalls).toHaveLength(0);
  });

  it("redirects an 'athlete' profile to /athlete", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { role: "athlete" };

    await expect(redirectIfAuthed()).rejects.toThrow("NEXT_REDIRECT:/athlete");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/athlete");
  });

  it("redirects an 'adult_athlete' profile to /athlete (FV-325)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { role: "adult_athlete" };

    await expect(redirectIfAuthed()).rejects.toThrow("NEXT_REDIRECT:/athlete");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/athlete");
  });

  it("redirects a 'parent' profile to /dashboard", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { role: "parent" };

    await expect(redirectIfAuthed()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to /auth/signout when the session is authed but has no profile row (orphaned session)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = null;

    await expect(redirectIfAuthed()).rejects.toThrow(
      "NEXT_REDIRECT:/auth/signout",
    );
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/auth/signout");
  });

  it("redirects to /auth/signout for an unrecognised role (defensive fallback)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { role: "some_future_role" };

    await expect(redirectIfAuthed()).rejects.toThrow(
      "NEXT_REDIRECT:/auth/signout",
    );
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/auth/signout");
  });

  it("only ever calls redirect once per invocation (no fall-through into a second branch)", async () => {
    mockUser = { id: USER_ID };
    mockProfile = { role: "parent" };

    await expect(redirectIfAuthed()).rejects.toThrow();
    // If the guard's `if` chain lacked early exits (relying only on
    // mutually-exclusive conditions rather than redirect() unwinding the
    // stack), a bug could still call redirect() more than once. Assert the
    // count exactly.
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
