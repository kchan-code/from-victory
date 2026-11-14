// FV-724 follow-up — anonymous pregame selection counts.
// Pure core (vocabulary validation) + server action (athlete-only gate, no id
// reaches the RPC). The DB function itself is covered by the RLS harness
// (supabase/tests/rls/assertions/25_pregame_selection_counts.sql).

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
const getUser = vi.fn();
const single = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ rpc }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));
vi.mock("@/lib/activity/record", () => ({ recordActivityEvent: vi.fn() }));

const rateLimitGate = vi.fn(async (..._a: unknown[]) => ({ limited: false }));
vi.mock("@/lib/actions/rate-limit-store", () => ({ rateLimitGate: (...a: unknown[]) => rateLimitGate(...a) }));

const notifyError = vi.fn((..._a: unknown[]) => Promise.resolve());
const deliverInBackground = vi.fn();
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: (...a: unknown[]) => notifyError(...a) }));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: (...a: unknown[]) => deliverInBackground(...a) }));

import { logPregameSelections } from "@/lib/actions/activity";
import { pregameOptionMarker, utcPeriodStartIso } from "@/lib/activity/pregame-marker";
import {
  MAX_VALUE_LEN,
  SELECTION_DIMENSIONS,
  buildSelectionCounts,
} from "@/lib/activity/pregame-selection-core";
import { positivePlaysFor } from "@/components/pregame/positive-plays";
import { SPORT_REGISTRY, adversityOptionsFor } from "@/components/pregame/sport-registry";
import { SUPPORTED_SPORTS } from "@/lib/sports";

const ATHLETE_ID = "20000000-0000-4000-8000-00000000000a";

const hockeyValid = {
  need: "Confidence",
  role: "Forward",
  adversity: "I get benched.",
  anchor: "Long exhale",
  selfTalk: SPORT_REGISTRY.hockey.selfTalkOptions[0],
  prayerStyle: "guided",
};

describe("buildSelectionCounts (pure vocabulary validation)", () => {
  it("keeps valid options, one independent row per dimension", () => {
    const r = buildSelectionCounts("hockey", hockeyValid)!;
    expect(r.sport).toBe("hockey");
    const dims = r.selections.map((s) => s.dimension);
    expect(dims).toEqual(["need", "role", "adversity", "anchor", "self_talk", "prayer_style"]);
    expect(r.selections.find((s) => s.dimension === "need")?.value).toBe("Confidence");
    // Adversity is stored as the registry's stable slug fragment, not the sentence.
    const frag = SPORT_REGISTRY.hockey.adversitySlugFragments["I get benched."];
    expect(frag).toBeTruthy();
    expect(r.selections.find((s) => s.dimension === "adversity")?.value).toBe(frag);
  });

  it("drops unknown values and unknown sports", () => {
    const r = buildSelectionCounts("hockey", {
      ...hockeyValid,
      need: "Hack the planet",
      role: "Quarterback",
      anchor: "something I typed",
      prayerStyle: "freestyle",
    })!;
    const dims = r.selections.map((s) => s.dimension);
    expect(dims).not.toContain("need");
    expect(dims).not.toContain("role");
    expect(dims).not.toContain("anchor");
    expect(dims).not.toContain("prayer_style");
    expect(buildSelectionCounts("curling", hockeyValid)).toBeNull();
    expect(buildSelectionCounts(42, hockeyValid)).toBeNull();
  });

  it("never counts cueWord or any free-text field, even if sent", () => {
    const r = buildSelectionCounts("hockey", {
      ...hockeyValid,
      cueWord: "MyPrivateWord",
      note: "free text",
      journal: "dear diary",
    } as never)!;
    const json = JSON.stringify(r.selections);
    expect(json).not.toContain("MyPrivateWord");
    expect(json).not.toContain("free text");
    expect(json).not.toContain("dear diary");
    for (const s of r.selections) expect(SELECTION_DIMENSIONS).toContain(s.dimension);
  });

  it("rejects non-string values (objects, arrays, numbers)", () => {
    const r = buildSelectionCounts("hockey", {
      need: { a: 1 },
      role: ["Forward"],
      adversity: 5,
      anchor: null,
      selfTalk: undefined,
      prayerStyle: true,
    })!;
    expect(r.selections).toEqual([]);
  });

  it("adversity is validated against the role's option keys", () => {
    const goalie = adversityOptionsFor(SPORT_REGISTRY.hockey, "Goalie").map((o) => o.key);
    expect(goalie).not.toContain("I take a bad penalty.");
    const r = buildSelectionCounts("hockey", {
      role: "Goalie",
      adversity: "I take a bad penalty.",
    })!;
    expect(r.selections.map((s) => s.dimension)).toEqual(["role"]);
  });

  it("positive plays: only slugs for (sport, role), deduped, max 3", () => {
    const plays = positivePlaysFor("hockey", "Forward").map((p) => p.slug);
    expect(plays.length).toBeGreaterThan(3);
    const other = positivePlaysFor("hockey", "Goalie")[0]!.slug;
    const r = buildSelectionCounts("hockey", {
      role: "Forward",
      positivePlays: [plays[0], plays[0], "viz-bogus", other, plays[1], plays[2], plays[3]],
    })!;
    const pp = r.selections.filter((s) => s.dimension === "positive_play").map((s) => s.value);
    expect(pp).toEqual([plays[0], plays[1], plays[2]]);
  });

  it("never emits a duplicate (dimension, value) pair", () => {
    const plays = positivePlaysFor("hockey", "Forward").map((p) => p.slug);
    const r = buildSelectionCounts("hockey", {
      ...hockeyValid,
      positivePlays: [plays[0], plays[0], plays[1], plays[1]],
    })!;
    const keys = r.selections.map((x) => `${x.dimension}|${x.value}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("positive plays are dropped when no valid role is chosen", () => {
    const slug = positivePlaysFor("hockey", "Forward")[0]!.slug;
    const r = buildSelectionCounts("hockey", { positivePlays: [slug] })!;
    expect(r.selections).toEqual([]);
  });

  it("every value in every live sport's vocabulary fits the DB length bound", () => {
    for (const sport of SUPPORTED_SPORTS) {
      const c = SPORT_REGISTRY[sport];
      const all = [
        ...c.needs,
        ...(c.roles ?? []),
        ...c.adversities,
        ...Object.values(c.adversitySlugFragments),
        ...c.anchors,
        ...c.selfTalkOptions,
        ...(c.roles ?? []).flatMap((r) => positivePlaysFor(sport, r).map((p) => p.slug)),
      ];
      for (const v of all) {
        expect(v.length, `${sport}: ${v}`).toBeGreaterThan(0);
        expect(v.length, `${sport}: ${v}`).toBeLessThanOrEqual(MAX_VALUE_LEN);
      }
    }
  });
});

describe("logPregameSelections (server action)", () => {
  beforeEach(() => {
    process.env.PREGAME_MARKER_SECRET = "test-hash-secret";
    rpc.mockReset().mockResolvedValue({ error: null });
    rateLimitGate.mockReset().mockResolvedValue({ limited: false });
    getUser.mockReset();
    single.mockReset();
  });

  it("athlete: the RPC gets period, sport and per-pair markers — no athlete id anywhere", async () => {
    getUser.mockResolvedValue({ data: { user: { id: ATHLETE_ID } } });
    single.mockResolvedValue({ data: { role: "athlete" } });
    await logPregameSelections("hockey", { ...hockeyValid, cueWord: "Secret" } as never);

    expect(rpc).toHaveBeenCalledTimes(1);
    const [fn, args] = rpc.mock.calls[0]!;
    expect(fn).toBe("record_pregame_selections");
    expect(Object.keys(args).sort()).toEqual(["p_period", "p_selections", "p_sport"]);
    expect(args.p_period).toMatch(/^\d{4}-\d{2}-01$/);
    expect(args.p_sport).toBe("hockey");
    const sels = args.p_selections as { dimension: string; value: string; marker: string }[];
    expect(sels.length).toBeGreaterThan(0);
    for (const sel of sels) {
      expect(Object.keys(sel).sort()).toEqual(["dimension", "marker", "value"]);
      // marker = digest of THIS pair under the passed period (digest month == period).
      expect(sel.marker).toBe(
        pregameOptionMarker(ATHLETE_ID, "test-hash-secret", args.p_period, "hockey", sel.dimension, sel.value),
      );
    }
    const markers = sels.map((x) => x.marker);
    expect(new Set(markers).size).toBe(markers.length); // different per pair
    const wire = JSON.stringify(args);
    expect(wire).not.toContain(ATHLETE_ID);
    expect(wire).not.toContain("Secret");
  });

  it("throttle: over the limit records nothing and does not throw", async () => {
    getUser.mockResolvedValue({ data: { user: { id: ATHLETE_ID } } });
    single.mockResolvedValue({ data: { role: "athlete" } });
    rateLimitGate.mockResolvedValue({ limited: true });
    await expect(logPregameSelections("hockey", hockeyValid)).resolves.toBeUndefined();
    expect(rpc).not.toHaveBeenCalled();
    expect(rateLimitGate).toHaveBeenCalledWith("pregame_selections", ATHLETE_ID);
  });

  it("throttle is not consulted for non-athletes", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "p" } } });
    single.mockResolvedValue({ data: { role: "parent" } });
    await logPregameSelections("hockey", hockeyValid);
    expect(rateLimitGate).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("missing secret: nothing is recorded, no RPC, and the raw id is never used", async () => {
    delete process.env.PREGAME_MARKER_SECRET;
    // The rate-limit secret must NOT be used as a fallback.
    process.env.RATE_LIMIT_HASH_SECRET = "rate-limit-secret-present";
    getUser.mockResolvedValue({ data: { user: { id: ATHLETE_ID } } });
    single.mockResolvedValue({ data: { role: "athlete" } });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await logPregameSelections("hockey", hockeyValid);
    expect(rpc).not.toHaveBeenCalled();
    expect(JSON.stringify(err.mock.calls)).not.toContain(ATHLETE_ID);
    // Outside production: generic log only, no operator alert.
    expect(notifyError).not.toHaveBeenCalled();
    delete process.env.RATE_LIMIT_HASH_SECRET;
    err.mockRestore();
  });

  it("missing secret in production: alerts the operator once per instance, never with the id", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.PREGAME_MARKER_SECRET;
    notifyError.mockClear();
    deliverInBackground.mockClear();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { recordPregameSelectionCounts } = await import("@/lib/activity/pregame-selections");
      await recordPregameSelectionCounts(ATHLETE_ID, "hockey", hockeyValid);
      await recordPregameSelectionCounts(ATHLETE_ID, "hockey", hockeyValid);
      await recordPregameSelectionCounts(ATHLETE_ID, "hockey", hockeyValid);
      expect(rpc).not.toHaveBeenCalled();
      expect(notifyError).toHaveBeenCalledTimes(1);
      expect(deliverInBackground).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(notifyError.mock.calls)).not.toContain(ATHLETE_ID);
      expect(JSON.stringify(notifyError.mock.calls)).toContain("PREGAME_MARKER_SECRET");
    } finally {
      vi.unstubAllEnvs();
      err.mockRestore();
    }
  });

  it("adult_athlete is allowed", async () => {
    getUser.mockResolvedValue({ data: { user: { id: ATHLETE_ID } } });
    single.mockResolvedValue({ data: { role: "adult_athlete" } });
    await logPregameSelections("hockey", hockeyValid);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("refuses a parent, a signed-out caller, and a missing profile", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "p" } } });
    single.mockResolvedValue({ data: { role: "parent" } });
    await logPregameSelections("hockey", hockeyValid);

    getUser.mockResolvedValue({ data: { user: null } });
    await logPregameSelections("hockey", hockeyValid);

    getUser.mockResolvedValue({ data: { user: { id: "x" } } });
    single.mockResolvedValue({ data: null });
    await logPregameSelections("hockey", hockeyValid);

    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not call the RPC when nothing validates", async () => {
    getUser.mockResolvedValue({ data: { user: { id: ATHLETE_ID } } });
    single.mockResolvedValue({ data: { role: "athlete" } });
    await logPregameSelections("hockey", { need: "nope" });
    await logPregameSelections("curling", hockeyValid);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("never throws and logs only a generic message on RPC failure", async () => {
    getUser.mockResolvedValue({ data: { user: { id: ATHLETE_ID } } });
    single.mockResolvedValue({ data: { role: "athlete" } });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValue({ error: { message: "boom Confidence " + ATHLETE_ID } });
    await expect(logPregameSelections("hockey", hockeyValid)).resolves.toBeUndefined();
    rpc.mockRejectedValue(new Error("network"));
    await expect(logPregameSelections("hockey", hockeyValid)).resolves.toBeUndefined();
    const logged = JSON.stringify(err.mock.calls);
    expect(logged).not.toContain("Confidence");
    expect(logged).not.toContain(ATHLETE_ID);
    expect(logged).not.toContain(
      pregameOptionMarker(ATHLETE_ID, "test-hash-secret", utcPeriodStartIso(new Date()), "hockey", "need", "Confidence"),
    );
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("pregameOptionMarker (per-option keyed one-way digest)", () => {
  const P = "2026-01-01";
  const base = () => pregameOptionMarker(ATHLETE_ID, "k", P, "hockey", "need", "Calm");

  it("is stable for the same tuple", () => {
    expect(base()).toBe(base());
  });
  it("differs per option, athlete, month, sport, dimension and secret", () => {
    const b = base();
    expect(pregameOptionMarker(ATHLETE_ID, "k", P, "hockey", "need", "Joy")).not.toBe(b);
    expect(pregameOptionMarker(ATHLETE_ID, "k", P, "hockey", "anchor", "Calm")).not.toBe(b);
    expect(pregameOptionMarker(ATHLETE_ID, "k", P, "golf", "need", "Calm")).not.toBe(b);
    expect(pregameOptionMarker(ATHLETE_ID, "k", "2026-02-01", "hockey", "need", "Calm")).not.toBe(b);
    expect(pregameOptionMarker("20000000-0000-4000-8000-00000000000b", "k", P, "hockey", "need", "Calm")).not.toBe(b);
    expect(pregameOptionMarker(ATHLETE_ID, "other", P, "hockey", "need", "Calm")).not.toBe(b);
  });
  it("tuple encoding cannot collide by concatenation", () => {
    expect(pregameOptionMarker(ATHLETE_ID, "k", P, "hockey", "a:b", "c")).not.toBe(
      pregameOptionMarker(ATHLETE_ID, "k", P, "hockey", "a", "b:c"),
    );
    expect(pregameOptionMarker("a", "k", P, "b", "c", "d")).not.toBe(
      pregameOptionMarker("a:b", "k", P, "", "c", "d"),
    );
  });
  it("is 64 lowercase hex chars and does not contain the id", () => {
    expect(base()).toMatch(/^[0-9a-f]{64}$/);
    expect(base()).not.toContain(ATHLETE_ID);
  });
  it("derives the period in UTC, first of the month", () => {
    expect(utcPeriodStartIso(new Date("2026-03-31T23:59:59Z"))).toBe("2026-03-01");
    expect(utcPeriodStartIso(new Date("2026-04-01T00:00:00Z"))).toBe("2026-04-01");
  });
});
