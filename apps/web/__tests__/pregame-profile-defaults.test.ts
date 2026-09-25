/**
 * FV-253 — resolvePregameProfileDefaults (lib/pregame/profile-defaults.ts).
 *
 * The pure resolver behind the pregame Today's Focus + Position pre-selection.
 * Pins:
 *   1. A saved position that is one of the CURRENT sport's roles pre-selects
 *      that role; a cross-sport / stale / garbage position resolves to null.
 *   2. Every quiz focus_area maps (via FOCUS_AREA_TO_NEED) to a need that
 *      every LIVE sport actually offers — so the pre-selection can never point
 *      at a chip the athlete can't see.
 *   3. A mapped need the sport does NOT offer is dropped (null), never forced.
 *   4. Skipped / null / undefined / unknown quiz values → { need: null,
 *      role: null } — byte-for-byte the pre-FV-253 "nothing pre-selected".
 */

import { describe, it, expect } from "vitest";

import {
  resolvePregameProfileDefaults,
  NO_PROFILE_DEFAULTS,
} from "@/lib/pregame/profile-defaults";
import { FOCUS_AREA_KEYS, FOCUS_AREA_TO_NEED } from "@/lib/quiz-config";
import {
  getSportConfig,
  HOCKEY_CONFIG,
  BASKETBALL_CONFIG,
  type Sport as RegistrySport,
} from "@/components/pregame/sport-registry";
import { SUPPORTED_SPORTS } from "@/lib/sports";

describe("resolvePregameProfileDefaults — position → role (FV-253)", () => {
  it("pre-selects a saved position that belongs to the current sport", () => {
    const out = resolvePregameProfileDefaults(
      { position: "Forward", focusArea: null },
      HOCKEY_CONFIG,
    );
    expect(out.role).toBe("Forward");
  });

  it("drops a stale cross-sport position (hockey 'Forward' after switching to basketball)", () => {
    const out = resolvePregameProfileDefaults(
      { position: "Forward", focusArea: null },
      BASKETBALL_CONFIG,
    );
    expect(out.role).toBeNull();
  });

  it("drops an unknown / garbage position", () => {
    for (const bad of ["", "forward", "Centre", "Guard ", "<script>"]) {
      const out = resolvePregameProfileDefaults(
        { position: bad, focusArea: null },
        HOCKEY_CONFIG,
      );
      expect(out.role, `position=${JSON.stringify(bad)}`).toBeNull();
    }
  });

  it("resolves to null for a sport with no roles (no-ask sport)", () => {
    const out = resolvePregameProfileDefaults(
      { position: "Forward", focusArea: null },
      { needs: HOCKEY_CONFIG.needs }, // roles omitted
    );
    expect(out.role).toBeNull();
  });

  it("every live sport pre-selects each of its own roles", () => {
    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport as RegistrySport);
      for (const role of config.roles ?? []) {
        const out = resolvePregameProfileDefaults(
          { position: role, focusArea: null },
          config,
        );
        expect(out.role, `${sport}/${role}`).toBe(role);
      }
    }
  });
});

describe("resolvePregameProfileDefaults — focus_area → need (FV-253)", () => {
  it("maps every focus_area to a need offered by EVERY live sport", () => {
    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport as RegistrySport);
      for (const key of FOCUS_AREA_KEYS) {
        const out = resolvePregameProfileDefaults(
          { position: null, focusArea: key },
          config,
        );
        expect(out.need, `${sport}/${key}`).toBe(FOCUS_AREA_TO_NEED[key]);
        expect(config.needs, `${sport} needs must include ${out.need}`).toContain(out.need);
      }
    }
  });

  it("drops a mapped need the sport does not offer instead of forcing it", () => {
    // Synthetic sport whose needs list lacks "Calm" (nerves → Calm).
    const needs = HOCKEY_CONFIG.needs.filter((n) => n !== "Calm");
    const out = resolvePregameProfileDefaults(
      { position: null, focusArea: "nerves" },
      { roles: HOCKEY_CONFIG.roles, needs },
    );
    expect(out.need).toBeNull();
  });

  it("drops an unknown focus_area", () => {
    for (const bad of ["", "Nerves", "anxiety", "faith "]) {
      const out = resolvePregameProfileDefaults(
        { position: null, focusArea: bad },
        HOCKEY_CONFIG,
      );
      expect(out.need, `focusArea=${JSON.stringify(bad)}`).toBeNull();
    }
  });
});

describe("resolvePregameProfileDefaults — skipped / absent quiz (FV-253)", () => {
  it("null / undefined personalization → nothing pre-selected", () => {
    expect(resolvePregameProfileDefaults(null, HOCKEY_CONFIG)).toEqual(NO_PROFILE_DEFAULTS);
    expect(resolvePregameProfileDefaults(undefined, HOCKEY_CONFIG)).toEqual(NO_PROFILE_DEFAULTS);
  });

  it("skipped quiz (both fields null) → nothing pre-selected", () => {
    expect(
      resolvePregameProfileDefaults({ position: null, focusArea: null }, HOCKEY_CONFIG),
    ).toEqual({ need: null, role: null });
  });

  it("the two fields resolve independently", () => {
    // Valid need, invalid role.
    expect(
      resolvePregameProfileDefaults(
        { position: "Guard", focusArea: "confidence" },
        HOCKEY_CONFIG,
      ),
    ).toEqual({ need: "Confidence", role: null });
    // Valid role, unknown focus.
    expect(
      resolvePregameProfileDefaults(
        { position: "Goalie", focusArea: "nope" },
        HOCKEY_CONFIG,
      ),
    ).toEqual({ need: null, role: "Goalie" });
  });
});
