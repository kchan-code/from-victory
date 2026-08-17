/**
 * @vitest-environment jsdom
 */
// FV-494 — regression: a new service worker taking over an ALREADY-CONTROLLED
// page (deploy landed mid-session) must trigger exactly one page reload so the
// running build, prefetch cache, and Cache Storage are consistent again.
// Without this, the page keeps running the old build against the new deploy:
// the SW's activate handler has purged the old CACHE_VERSION cache, stale
// prefetched chunk URLs 404, and the next link tap aborts client-side routing
// (beta report: "links stop working after a couple times").
//
//   1. deploy takeover (page was controlled) → exactly one reload
//   2. first-ever install claim (page was NOT controlled) → no reload
//   3. guided audio playing → reload deferred until the document is hidden
//
// These tests fail against the pre-FV-494 registrar (no controllerchange
// handler → reload is never called).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

// jsdom's window.location.reload is non-configurable, so the registrar calls
// it through the @/lib/reload-page seam — mocked here.
vi.mock("@/lib/reload-page", () => ({ reloadPage: vi.fn() }));

import { ServiceWorkerRegistrar } from "@/app/_components/ServiceWorkerRegistrar";
import { reloadPage } from "@/lib/reload-page";

const reloadMock = vi.mocked(reloadPage);

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/** Minimal ServiceWorkerContainer double: EventTarget + controller + register. */
function makeServiceWorkerContainer(initiallyControlled: boolean) {
  const target = new EventTarget();
  const registration = {
    scope: "http://localhost/",
    installing: null,
    addEventListener: vi.fn(),
  };
  const container = Object.assign(target, {
    controller: initiallyControlled ? ({} as ServiceWorker) : null,
    register: vi.fn().mockResolvedValue(registration),
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: container,
  });
  return container;
}

beforeEach(() => {
  reloadMock.mockClear();
});

afterEach(() => {
  cleanup();
  // Remove any audio elements a test appended.
  document.querySelectorAll("audio").forEach((el) => el.remove());
});

function dispatchControllerChange(container: EventTarget) {
  act(() => {
    container.dispatchEvent(new Event("controllerchange"));
  });
}

/** Append a hidden <audio> that reports as actively playing (jsdom defaults
 *  to paused; the clip player's element is unpaused mid-session). */
function attachPlayingAudio() {
  const audio = document.createElement("audio");
  Object.defineProperty(audio, "paused", { configurable: true, value: false });
  Object.defineProperty(audio, "ended", { configurable: true, value: false });
  document.body.appendChild(audio);
  return audio;
}

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ServiceWorkerRegistrar — FV-494 deploy-takeover reload", () => {
  it("reloads exactly once when a new SW takes over an already-controlled page", () => {
    const container = makeServiceWorkerContainer(true);
    render(<ServiceWorkerRegistrar />);

    dispatchControllerChange(container);
    expect(reloadMock).toHaveBeenCalledTimes(1);

    // A second controllerchange (e.g. rapid consecutive deploys) must not
    // stack further reloads.
    dispatchControllerChange(container);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does NOT reload on the first-ever install claiming an uncontrolled page", () => {
    const container = makeServiceWorkerContainer(false);
    render(<ServiceWorkerRegistrar />);

    // First controllerchange = initial install's clients.claim(). Same build,
    // nothing stale — no reload.
    dispatchControllerChange(container);
    expect(reloadMock).not.toHaveBeenCalled();

    // But a LATER takeover (page now controlled) does reload.
    dispatchControllerChange(container);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("defers the reload while guided audio is playing, until the app is hidden", () => {
    const container = makeServiceWorkerContainer(true);
    attachPlayingAudio();
    render(<ServiceWorkerRegistrar />);

    // Takeover mid-session: the athlete's audio must not be interrupted.
    dispatchControllerChange(container);
    expect(reloadMock).not.toHaveBeenCalled();

    // Backgrounding the app is the safe moment — reload fires then.
    setVisibilityState("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload on visibilitychange when no takeover happened", () => {
    makeServiceWorkerContainer(true);
    render(<ServiceWorkerRegistrar />);

    setVisibilityState("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
