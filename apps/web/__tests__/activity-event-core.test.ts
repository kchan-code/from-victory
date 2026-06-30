// activity_events pure validation core. Runs in the vitest node env (no
// server-only, no DB). The service-role write path (lib/actions/activity.ts)
// is covered by integration; here we lock the EVENT-ONLY + allow-list invariants.

import { describe, it, expect } from "vitest";

import { buildEventRow, sanitizeMeta } from "@/lib/activity/event-core";

const ATH = "20000000-0000-4000-8000-00000000000a";

describe("buildEventRow", () => {
  it("builds a normalized row for a valid event", () => {
    const row = buildEventRow(ATH, {
      event_name: "pregame_complete",
      surface: "pregame",
      sport: "hockey",
      audio_mode: "clip",
      network_mode: "offline",
      meta: { position: "goalie", clips_played: 9, audio_completed: true },
    });
    expect(row).toEqual({
      athlete_id: ATH,
      event_name: "pregame_complete",
      surface: "pregame",
      sport: "hockey",
      audio_mode: "clip",
      network_mode: "offline",
      meta: { position: "goalie", clips_played: 9, audio_completed: true },
    });
  });

  it("rejects an unknown event_name (hard reject → null)", () => {
    expect(buildEventRow(ATH, { event_name: "exfiltrate" })).toBeNull();
  });

  it("rejects a missing athlete id", () => {
    expect(buildEventRow("", { event_name: "app_open" })).toBeNull();
  });

  it("coerces invalid dimensions to null without dropping the event", () => {
    const row = buildEventRow(ATH, {
      event_name: "app_open",
      surface: "spaceship", // not in SURFACES
      audio_mode: "8-track", // not in AUDIO_MODES
      network_mode: "carrier-pigeon",
    });
    expect(row).not.toBeNull();
    expect(row?.surface).toBeNull();
    expect(row?.audio_mode).toBeNull();
    expect(row?.network_mode).toBeNull();
  });

  it("caps an over-long sport string", () => {
    const row = buildEventRow(ATH, { event_name: "app_open", sport: "x".repeat(200) });
    expect(row?.sport?.length).toBe(64);
  });
});

describe("sanitizeMeta — the EVENT-ONLY allow-list", () => {
  it("keeps allow-listed primitive keys, drops everything else", () => {
    const meta = sanitizeMeta({
      position: "winger",
      adversity: "benched",
      clips_played: 7,
      audio_completed: false,
      // not allow-listed — must be dropped:
      journal: "I felt terrible tonight and ...",
      note: "free text",
      athlete_name: "Ava",
    });
    expect(meta).toEqual({
      position: "winger",
      adversity: "benched",
      clips_played: 7,
      audio_completed: false,
    });
  });

  it("drops objects, arrays, and non-finite numbers even on allow-listed keys", () => {
    const meta = sanitizeMeta({
      anchor: { nested: "object" } as unknown as string,
      src: ["a", "b"] as unknown as string,
      clips_played: Number.POSITIVE_INFINITY,
      prayer_style: "guided",
    });
    expect(meta).toEqual({ prayer_style: "guided" });
  });

  it("caps allow-listed string values at 64 chars", () => {
    const meta = sanitizeMeta({ anchor: "y".repeat(120) });
    expect(meta?.anchor).toHaveLength(64);
  });

  it("returns null when nothing survives", () => {
    expect(sanitizeMeta({ note: "free text", secret: "leak" })).toBeNull();
    expect(sanitizeMeta(null)).toBeNull();
    expect(sanitizeMeta(undefined)).toBeNull();
  });
});
