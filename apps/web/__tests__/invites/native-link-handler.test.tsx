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

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe("routeInviteLink", () => {
  it("navigates a valid link once; a non-explicit repeat is ignored", () => {
    const nav = vi.fn();
    expect(routeInviteLink(LINK, { explicit: false }, nav)).toBe(true);
    expect(routeInviteLink(LINK, { explicit: false }, nav)).toBe(false);
    expect(nav).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith(PATH);
    expect(wasHandled(LINK)).toBe(true);
  });

  it("an explicit (warm tap) repeat is honored", () => {
    const nav = vi.fn();
    markHandled(LINK);
    expect(routeInviteLink(LINK, { explicit: true }, nav)).toBe(true);
    expect(nav).toHaveBeenCalledWith(PATH);
  });

  it.each([
    "https://evil.test/invite#code=7KQ2-M9XD-4HTR-PW3B",
    "https://www.fromvictoryapp.com/dashboard",
    "https://www.fromvictoryapp.com/invite?code=7KQ2-M9XD-4HTR-PW3B",
    "fromvictory://invite",
    undefined,
  ])("ignores %s", (url) => {
    const nav = vi.fn();
    expect(routeInviteLink(url, { explicit: true }, nav)).toBe(false);
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
    act(() => listeners[0]!({ url: LINK }));
    act(() => listeners[0]!({ url: LINK }));
    expect(nav).toHaveBeenCalledTimes(2);
    act(() => listeners[0]!({ url: "https://www.fromvictoryapp.com/athlete" }));
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
