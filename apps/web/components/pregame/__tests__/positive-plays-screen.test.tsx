/**
 * @vitest-environment jsdom
 */
// FV-144 — unit tests for the multi-select positive-play picker
// (PositivePlaysScreen in screens-a.tsx). The screen is controlled: `set` is a
// stub and we assert it's called with the next positivePlays array, plus the
// chip selected/disabled states that enforce KC's "up to 3, none pre-picked"
// rule. Uses the same jsdom/RTL harness as review-screen.test.tsx (the global
// vitest env stays "node"; this file opts in via the docblock above).

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { PositivePlaysScreen } from "@/components/pregame/screens-a";
import { INITIAL_STATE, type PregameState } from "@/components/pregame/types";
import { HOCKEY_CONFIG } from "@/components/pregame/sport-registry";
import { positivePlaysFor } from "@/components/pregame/positive-plays";

function forwardState(positivePlays: string[] = []): PregameState {
  return { ...INITIAL_STATE, role: "Forward", positivePlays };
}

// A few stable Forward plays (titles from docs/pregame-scripts.md §1).
const FLAGSHIP = { slug: "viz-forward-win-the-wall", title: "Win the wall and bury it" };
const GIVE_GO = { slug: "viz-forward-give-and-go", title: "Give-and-go through the seam" };
const NET_FRONT = { slug: "viz-forward-net-front", title: "Net-front tip and bury the rebound" };

afterEach(() => cleanup());

describe("PositivePlaysScreen (FV-144)", () => {
  it("renders every play for the athlete's position", () => {
    render(<PositivePlaysScreen state={forwardState()} set={vi.fn()} sportConfig={HOCKEY_CONFIG} />);
    for (const { title } of positivePlaysFor("Forward")) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
  });

  it("nudges to pick at least one when none are selected", () => {
    render(<PositivePlaysScreen state={forwardState()} set={vi.fn()} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByText(/pick at least one/i)).toBeInTheDocument();
  });

  it("selecting an unpicked play appends its slug", () => {
    const set = vi.fn();
    render(<PositivePlaysScreen state={forwardState([GIVE_GO.slug])} set={set} sportConfig={HOCKEY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: NET_FRONT.title }));
    expect(set).toHaveBeenCalledWith("positivePlays", [GIVE_GO.slug, NET_FRONT.slug]);
  });

  it("tapping a selected play removes it (toggle off)", () => {
    const set = vi.fn();
    render(<PositivePlaysScreen state={forwardState([GIVE_GO.slug, NET_FRONT.slug])} set={set} sportConfig={HOCKEY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: GIVE_GO.title }));
    expect(set).toHaveBeenCalledWith("positivePlays", [NET_FRONT.slug]);
  });

  it("marks selected chips with aria-pressed", () => {
    render(<PositivePlaysScreen state={forwardState([GIVE_GO.slug])} set={vi.fn()} sportConfig={HOCKEY_CONFIG} />);
    expect(screen.getByRole("button", { name: GIVE_GO.title })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: NET_FRONT.title })).toHaveAttribute("aria-pressed", "false");
  });

  it("at the cap of 3, unselected plays are disabled but selected plays still toggle", () => {
    const picked = [FLAGSHIP.slug, GIVE_GO.slug, NET_FRONT.slug];
    render(<PositivePlaysScreen state={forwardState(picked)} set={vi.fn()} sportConfig={HOCKEY_CONFIG} />);
    // An unpicked 4th play is disabled — can't exceed the cap.
    expect(screen.getByRole("button", { name: "Backcheck and strip" })).toBeDisabled();
    // A picked play is never disabled (must always be removable).
    expect(screen.getByRole("button", { name: FLAGSHIP.title })).not.toBeDisabled();
    expect(screen.getByText(/3 of 3 selected/i)).toBeInTheDocument();
  });
});
