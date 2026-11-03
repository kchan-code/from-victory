/**
 * @vitest-environment jsdom
 */
// FV-545 — ShareWithParent behavior branches (qa-reviewer follow-up #2).
//
// The 13-17 conversion mechanic must behave exactly:
//   1. navigator.share resolves → shared; clipboard untouched, label stable.
//   2. navigator.share rejects with AbortError (athlete cancelled the
//      sheet) → do NOTHING: no clipboard write, no "Link copied".
//   3. navigator.share rejects with a real failure → clipboard fallback
//      fires and the button shows "Link copied".
//   4. navigator.share absent → clipboard fallback + "Link copied".
//   5. clipboard also fails → label stays put (the visible /parents link
//      on the card remains the manual path).
// The share payload is always the /parents URL only.

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";

import { ShareWithParent } from "@/components/athletes/ShareWithParent";

const PARENTS_URL = `${window.location.origin}/parents`;

function stubShare(impl?: (data?: ShareData) => Promise<void>) {
  Object.defineProperty(window.navigator, "share", {
    value: impl,
    writable: true,
    configurable: true,
  });
}

function stubClipboard(write: (text: string) => Promise<void>) {
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: write },
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  // Remove the stubs so branches don't leak between tests.
  Reflect.deleteProperty(window.navigator, "share");
  Reflect.deleteProperty(window.navigator, "clipboard");
  vi.restoreAllMocks();
});

describe("ShareWithParent — share/clipboard branches (FV-545)", () => {
  it("shares the /parents URL via the native sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const write = vi.fn().mockResolvedValue(undefined);
    stubShare(share);
    stubClipboard(write);

    render(<ShareWithParent />);
    fireEvent.click(screen.getByRole("button", { name: /send this to a parent/i }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledWith({ url: PARENTS_URL });
    expect(write).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /send this to a parent/i }),
    ).toBeInTheDocument();
  });

  it("does nothing when the athlete cancels the share sheet (AbortError)", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("Share canceled", "AbortError"));
    const write = vi.fn().mockResolvedValue(undefined);
    stubShare(share);
    stubClipboard(write);

    render(<ShareWithParent />);
    fireEvent.click(screen.getByRole("button", { name: /send this to a parent/i }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    // No surprise clipboard write, no misleading success label.
    expect(write).not.toHaveBeenCalled();
    expect(screen.queryByText("Link copied")).not.toBeInTheDocument();
  });

  it("falls back to the clipboard on a real share failure", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("share failed", "NotAllowedError"));
    const write = vi.fn().mockResolvedValue(undefined);
    stubShare(share);
    stubClipboard(write);

    render(<ShareWithParent />);
    fireEvent.click(screen.getByRole("button", { name: /send this to a parent/i }));

    await waitFor(() => expect(write).toHaveBeenCalledWith(PARENTS_URL));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("copies the link when the browser has no share sheet", async () => {
    stubShare(undefined);
    const write = vi.fn().mockResolvedValue(undefined);
    stubClipboard(write);

    render(<ShareWithParent />);
    fireEvent.click(screen.getByRole("button", { name: /send this to a parent/i }));

    await waitFor(() => expect(write).toHaveBeenCalledWith(PARENTS_URL));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("leaves the label unchanged when the clipboard also fails", async () => {
    stubShare(undefined);
    const write = vi.fn().mockRejectedValue(new Error("denied"));
    stubClipboard(write);

    render(<ShareWithParent />);
    fireEvent.click(screen.getByRole("button", { name: /send this to a parent/i }));

    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Link copied")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send this to a parent/i }),
    ).toBeInTheDocument();
  });
});
