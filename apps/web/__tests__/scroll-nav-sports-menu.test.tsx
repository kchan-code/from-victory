/**
 * @vitest-environment jsdom
 */
// FV-506 — the nav "Sports" disclosure in ScrollNav.
//
// The dropdown is the only stateful logic this feature adds: open/close on
// the trigger, close on Escape (with focus returned to the trigger), and
// close on an outside pointerdown. Parameterized over SUPPORTED_SPORTS so a
// new live sport inherits a menu entry — and this guard — for free.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { ScrollNav } from "@/components/landing/ScrollNav";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

afterEach(cleanup);

function openSportsMenu() {
  render(<ScrollNav />);
  const trigger = screen.getByRole("button", { name: /sports/i });
  fireEvent.click(trigger);
  return trigger;
}

describe("ScrollNav Sports disclosure (FV-506)", () => {
  it("is closed by default and opens on click with one link per live sport", () => {
    render(<ScrollNav />);
    const trigger = screen.getByRole("button", { name: /sports/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    for (const sport of SUPPORTED_SPORTS) {
      expect(
        screen.queryByRole("link", { name: sportLabel(sport) }),
      ).not.toBeInTheDocument();
    }

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    for (const sport of SUPPORTED_SPORTS) {
      const link = screen.getByRole("link", { name: sportLabel(sport) });
      expect(link).toHaveAttribute("href", `/${sport}`);
    }
  });

  it("closes on Escape and returns focus to the trigger", () => {
    const trigger = openSportsMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: sportLabel(SUPPORTED_SPORTS[0]) }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a pointerdown outside the disclosure", () => {
    const trigger = openSportsMenu();
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open on a pointerdown inside the disclosure", () => {
    const trigger = openSportsMenu();
    const hockeyLink = screen.getByRole("link", {
      name: sportLabel(SUPPORTED_SPORTS[0]),
    });
    fireEvent.pointerDown(hockeyLink);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
