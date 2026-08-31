/**
 * @vitest-environment jsdom
 */
// FV-512 — the hamburger drawer in ScrollNav below `md`, plus the
// always-visible trial pill. Sibling to scroll-nav-sports-menu.test.tsx,
// which owns the desktop Sports disclosure; this file owns the drawer.

import "@testing-library/jest-dom/vitest";

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";

import { ScrollNav } from "@/components/landing/ScrollNav";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

function openMenu() {
  render(<ScrollNav />);
  const trigger = screen.getByRole("button", { name: /menu/i });
  fireEvent.click(trigger);
  return trigger;
}

describe("ScrollNav mobile menu (FV-512)", () => {
  it("is closed by default with aria-expanded false and no dialog in the DOM", () => {
    render(<ScrollNav />);
    const trigger = screen.getByRole("button", { name: /menu/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "mobile-menu");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click, sets aria-expanded, and moves focus into the drawer", () => {
    const trigger = openMenu();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: /menu/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveFocus();
  });

  it("contains all 8 nav entries, in order, with the correct hrefs", () => {
    openMenu();
    const dialog = screen.getByRole("dialog", { name: /menu/i });

    for (const sport of SUPPORTED_SPORTS) {
      const link = within(dialog).getByRole("link", {
        name: sportLabel(sport),
      });
      expect(link).toHaveAttribute("href", `/${sport}`);
    }

    expect(
      within(dialog).getByRole("link", { name: "For the Athlete" }),
    ).toHaveAttribute("href", "/#how");
    expect(
      within(dialog).getByRole("link", { name: "For Parents" }),
    ).toHaveAttribute("href", "/parents");
    expect(
      within(dialog).getByRole("link", { name: /For Teams/ }),
    ).toHaveAttribute("href", "/teams");
    expect(
      within(dialog).getByRole("link", { name: "Pricing" }),
    ).toHaveAttribute("href", "/pricing");
    expect(
      within(dialog).getByRole("link", { name: "Resources" }),
    ).toHaveAttribute("href", "/resources");
    expect(
      within(dialog).getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/signin");
    expect(
      within(dialog).getByRole("link", { name: "Start free trial" }),
    ).toHaveAttribute("href", "/signup");

    // Order check: the drawer's nav lists Sports' live-sport links first,
    // then the remaining 7 items, ending with the trial CTA.
    const dialogLinks = within(dialog)
      .getAllByRole("link")
      .map((el) => el.textContent);
    expect(dialogLinks[0]).toBe(sportLabel(SUPPORTED_SPORTS[0]));
    expect(dialogLinks[dialogLinks.length - 1]).toBe("Start free trial");
  });

  it("closes on Escape and returns focus to the trigger", () => {
    const trigger = openMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a pointerdown outside the drawer (the backdrop)", () => {
    const trigger = openMenu();
    // The backdrop covers everything outside the panel; document.body is
    // outside both the panel and the trigger, so this stands in for it.
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open on a pointerdown inside the drawer", () => {
    const trigger = openMenu();
    const dialog = screen.getByRole("dialog", { name: /menu/i });
    fireEvent.pointerDown(dialog);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes when a menu link is activated (link navigation)", () => {
    const trigger = openMenu();
    const dialog = screen.getByRole("dialog", { name: /menu/i });
    fireEvent.click(within(dialog).getByRole("link", { name: "Pricing" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", () => {
    const trigger = openMenu();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
  });

  it("renders the gold trial pill in the nav bar, outside the drawer, at every width", () => {
    render(<ScrollNav />);
    // Present before the menu is ever opened — this is the persistent
    // bar-level CTA, not a menu-only item.
    const pill = screen.getByTestId("nav-trial-pill");
    expect(pill).toHaveAttribute("href", "/signup");
    expect(pill).toHaveTextContent("Start free trial");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
