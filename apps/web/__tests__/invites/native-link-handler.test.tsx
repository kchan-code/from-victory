/**
 * @vitest-environment jsdom
 *
 * FV-630 — native universal-link handling (cold + warm) with dedup so a used
 * invite never re-opens on reload, and strict rejection of foreign URLs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import {
  NativeInviteLinkHandler,
  linkDigest,
  markHandled,
  routeInviteLink,
  wasHandled,
} from "@/components/native/NativeInviteLinkHandler";

const LINK = "https://www.fromvictoryapp.com/invite#code=7KQ2-M9XD-4HTR-PW3B";
const PATH = "/invite#code=7KQ2-M9XD-4HTR-PW3B";

type Listener = (e: { url?: string }) => void;
function installBridge(launchUrl: string | undefined) {
  const listeners: Listener[] = [];
  const remove = vi.fn();
  const App = {
    getLaunchUrl: vi.fn(async () => (launchUrl ? { url: launchUrl } : undefined)),
    addListener: vi.fn(async (_event: string, cb: Listener) => {
      listeners.push(cb);
      return { remove };
    }),
  };
  (window as unknown as { Capacitor?: unknown }).Capacitor = { Plugins: { App } };
  return { App, listeners, remove };
}

beforeEach(() => {
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

// Digesting is async (Web Crypto): let several ticks settle.
const flush = () =>
  act(async () => {
    for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
  });

describe("routeInviteLink", () => {
  it("navigates a valid link once; a non-explicit repeat is ignored", async () => {
    const nav = vi.fn();
    expect(await routeInviteLink(LINK, { explicit: false }, nav)).toBe(true);
    expect(await routeInviteLink(LINK, { explicit: false }, nav)).toBe(false);
    expect(nav).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith(PATH);
    expect(wasHandled((await linkDigest(LINK))!)).toBe(true);
  });

  it("stores only a sha256 digest — never the URL or the code", async () => {
    await routeInviteLink(
      "https://www.fromvictoryapp.com/invite#code=WXYZ-2345-6789-ABCD",
      { explicit: true },
      vi.fn(),
    );
    const stored = window.sessionStorage.getItem("fv_handled_invite_links") ?? "";
    expect(stored).not.toContain("WXYZ");
    expect(stored).not.toContain("fromvictoryapp");
    expect(JSON.parse(stored)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^[0-9a-f]{64}$/)]),
    );
  });

  it("an explicit (warm tap) repeat is honored", async () => {
    const nav = vi.fn();
    markHandled((await linkDigest(LINK))!);
    expect(await routeInviteLink(LINK, { explicit: true }, nav)).toBe(true);
    expect(nav).toHaveBeenCalledWith(PATH);
  });

  it.each([
    "https://evil.test/invite#code=7KQ2-M9XD-4HTR-PW3B",
    "https://www.fromvictoryapp.com/dashboard",
    "https://www.fromvictoryapp.com/invite?code=7KQ2-M9XD-4HTR-PW3B",
    "fromvictory://invite",
    undefined,
  ])("ignores %s", async (url) => {
    const nav = vi.fn();
    expect(await routeInviteLink(url, { explicit: true }, nav)).toBe(false);
    expect(nav).not.toHaveBeenCalled();
  });
});

describe("<NativeInviteLinkHandler />", () => {
  it("does nothing on the web (no Capacitor bridge)", async () => {
    const nav = vi.fn();
    render(<NativeInviteLinkHandler navigate={nav} />);
    await flush();
    expect(nav).not.toHaveBeenCalled();
  });

  it("cold launch: routes the launch URL once, not again after a reload", async () => {
    // Distinct code: the module's in-memory dedup set persists across tests.
    const cold = "https://www.fromvictoryapp.com/invite#code=ABCD-EFGH-JKMN-PQRS";
    installBridge(cold);
    const nav = vi.fn();
    const first = render(<NativeInviteLinkHandler navigate={nav} />);
    await flush();
    expect(nav).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith("/invite#code=ABCD-EFGH-JKMN-PQRS");

    // Full page load after the claim: the same retained launch URL comes back.
    first.unmount();
    render(<NativeInviteLinkHandler navigate={nav} />);
    await flush();
    expect(nav).toHaveBeenCalledTimes(1);
  });

  it("warm open: appUrlOpen routes every explicit tap", async () => {
    const { listeners } = installBridge(undefined);
    const nav = vi.fn();
    render(<NativeInviteLinkHandler navigate={nav} />);
    await flush();
    expect(listeners).toHaveLength(1);
    listeners[0]!({ url: LINK });
    await flush();
    listeners[0]!({ url: LINK });
    await flush();
    expect(nav).toHaveBeenCalledTimes(2);
    listeners[0]!({ url: "https://www.fromvictoryapp.com/athlete" });
    await flush();
    expect(nav).toHaveBeenCalledTimes(2);
  });

  it("ignores a non-invite launch URL", async () => {
    installBridge("https://www.fromvictoryapp.com/athlete/pregame");
    const nav = vi.fn();
    render(<NativeInviteLinkHandler navigate={nav} />);
    await flush();
    expect(nav).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", async () => {
    const { remove } = installBridge(undefined);
    const view = render(<NativeInviteLinkHandler navigate={vi.fn()} />);
    await flush();
    view.unmount();
    expect(remove).toHaveBeenCalled();
  });
});
