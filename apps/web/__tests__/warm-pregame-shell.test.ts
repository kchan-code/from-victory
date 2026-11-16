/**
 * FV-753: lib/pregame/warm-shell.ts
 *
 * The request shape is the contract with public/sw.js: a GET for exactly
 * `/athlete/pregame`, with no query string, so the worker stores the response
 * under the address a later page load asks for.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { PREGAME_SHELL_PATH, warmPregameShell } from "../lib/pregame/warm-shell";

function stubBrowser(options: { controller: object | null; serviceWorker?: boolean }) {
  vi.stubGlobal("window", {});
  vi.stubGlobal(
    "navigator",
    options.serviceWorker === false ? {} : { serviceWorker: { controller: options.controller } },
  );
}

describe("warmPregameShell (FV-753)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests exactly the Pregame page when a service worker controls the page", async () => {
    stubBrowser({ controller: {} });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(warmPregameShell()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/athlete/pregame");
    expect(url).not.toContain("?");
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
    // A Next.js data request would be saved under a different address.
    expect(init.headers).toBeUndefined();
  });

  it("does nothing when no service worker controls the page", async () => {
    stubBrowser({ controller: null });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(warmPregameShell()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing where service workers do not exist", async () => {
    stubBrowser({ controller: null, serviceWorker: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(warmPregameShell()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing on the server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(warmPregameShell()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws: a failed request reports false", async () => {
    stubBrowser({ controller: {} });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Load failed")));
    await expect(warmPregameShell()).resolves.toBe(false);
  });

  it("reports false for a response the worker will not store", async () => {
    stubBrowser({ controller: {} });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(warmPregameShell()).resolves.toBe(false);
  });

  it("uses the same path the service worker saves", () => {
    const sw = readFileSync(resolve(__dirname, "../public/sw.js"), "utf8");
    const path = /const PREGAME_PATH = "([^"]+)"/.exec(sw)?.[1];
    expect(path).toBe(PREGAME_SHELL_PATH);
  });

  it("is called by the Pregame shell only after access is confirmed", () => {
    const shell = readFileSync(
      resolve(__dirname, "../components/pregame/PregameClientShell.tsx"),
      "utf8",
    );
    const calls = shell.match(/warmPregameShell\(\)/g) ?? [];
    expect(calls).toHaveLength(1);
    const write = shell.indexOf("writeAthleteCache({ sport, firstName, offlineUntil");
    const warm = shell.indexOf("void warmPregameShell()");
    expect(write).toBeGreaterThan(-1);
    expect(warm).toBeGreaterThan(write);
    expect(shell.slice(write, warm)).not.toContain("setState(");
  });
});
