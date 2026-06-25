/**
 * @vitest-environment jsdom
 */
// FV-343 — the three pregame setup screens that used to offer a "Write your
// own" free-text row (Hard Moment, Reset Anchor, Self-Talk) are now
// PRESET-ONLY. Arbitrary typed text can't be voiced by the compositional
// audio, so every choice must map to a known cell/clip (same rationale that
// removed the practice-flow custom focus — see practice-flow.e2e.ts, which
// asserts the equivalent "no text input" guard for the practice flow).
//
// Guard: these screens render NO free-text input. Plus a satisfiability check —
// each step's preset options stay selectable, so removing the escape hatch
// never dead-ends the flow (the `required` predicate is met by a preset).
// Run against both LIVE sports (hockey + basketball), whose anchor / self-talk
// / adversity option sets differ.
//
// Uses the same jsdom/RTL harness as positive-plays-screen.test.tsx.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { HardMomentScreen } from "@/components/pregame/screens-a";
import { ResetAnchorScreen, SelfTalkScreen } from "@/components/pregame/screens-b";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import {
  HOCKEY_CONFIG,
  BASKETBALL_CONFIG,
  adversityOptionsFor,
  type SportConfig,
} from "@/components/pregame/sport-registry";

const SPORTS: ReadonlyArray<{ name: string; config: SportConfig; role: string }> = [
  { name: "hockey", config: HOCKEY_CONFIG, role: "Forward" },
  { name: "basketball", config: BASKETBALL_CONFIG, role: "Guard" },
];

afterEach(() => cleanup());

describe.each(SPORTS)(
  "pregame setup screens are preset-only (FV-343) — $name",
  ({ config, role }) => {
    function stateWith(overrides: Partial<PregameState> = {}): PregameState {
      return { ...INITIAL_STATE, role, ...overrides };
    }

    // ── Guard: no free-text input rendered ──────────────────────────────────

    it("Hard Moment renders no free-text input", () => {
      const { container } = render(
        <HardMomentScreen state={stateWith()} set={vi.fn()} sportConfig={config} />,
      );
      expect(container.querySelectorAll("input, textarea")).toHaveLength(0);
    });

    it("Reset Anchor renders no free-text input", () => {
      const { container } = render(
        <ResetAnchorScreen state={stateWith()} set={vi.fn()} sportConfig={config} />,
      );
      expect(container.querySelectorAll("input, textarea")).toHaveLength(0);
    });

    it("Self-Talk renders no free-text input", () => {
      const { container } = render(
        <SelfTalkScreen state={stateWith()} set={vi.fn()} sportConfig={config} />,
      );
      expect(container.querySelectorAll("input, textarea")).toHaveLength(0);
    });

    // ── Satisfiability: a preset still selects the value (no dead-end) ───────

    it("Hard Moment: picking a preset adversity sets the canonical key", () => {
      const set = vi.fn();
      const [first] = adversityOptionsFor(config, role);
      if (!first) throw new Error(`expected adversity presets for ${role}`);
      render(
        <HardMomentScreen state={stateWith()} set={set} sportConfig={config} />,
      );
      fireEvent.click(screen.getByRole("button", { name: first.label }));
      expect(set).toHaveBeenCalledWith("adversity", first.key);
    });

    it("Reset Anchor: picking a preset anchor sets it", () => {
      const set = vi.fn();
      const first = config.anchors[0];
      if (!first) throw new Error("expected anchor presets");
      render(
        <ResetAnchorScreen state={stateWith()} set={set} sportConfig={config} />,
      );
      fireEvent.click(screen.getByRole("button", { name: first }));
      expect(set).toHaveBeenCalledWith("anchor", first);
    });

    it("Self-Talk: picking a preset phrase sets it", () => {
      const set = vi.fn();
      const first = config.selfTalkOptions[0];
      if (!first) throw new Error("expected self-talk presets");
      render(
        <SelfTalkScreen state={stateWith()} set={set} sportConfig={config} />,
      );
      fireEvent.click(screen.getByRole("button", { name: first }));
      expect(set).toHaveBeenCalledWith("selfTalk", first);
    });
  },
);
