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
//   3. guided session in progress (data-fv-guided-session marker, NOT a
//      `paused` check — OS pauses and screen lock keep the session alive) →
//      reload deferred until the session is over AND the app is hidden
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

/** Append a hidden <audio> carrying the clip player's session-active marker
 *  (the FV-494 contract — set by useClipPlayer for the session's lifetime,
 *  surviving OS pauses and screen lock). `paused` is irrelevant by design. */
function attachGuidedSessionAudio({ paused = false } = {}) {
  const audio = document.createElement("audio");
  audio.setAttribute("data-fv-guided-session", "active");
  Object.defineProperty(audio, "paused", { configurable: true, value: paused });
  Object.defineProperty(audio, "ended", { configurable: true, value: false });
  document.body.appendChild(audio);
  return audio;
}

/** Mirror the clip player's session-end: clear the marker + dispatch signal. */
function endGuidedSession(audio: HTMLAudioElement) {
  audio.removeAttribute("data-fv-guided-session");
  act(() => {
    document.dispatchEvent(new Event("fv:guided-session-end"));
  });
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

  it("defers the reload during a guided session and fires once the session is over and the app is hidden", () => {
    const container = makeServiceWorkerContainer(true);
    const audio = attachGuidedSessionAudio();
    render(<ServiceWorkerRegistrar />);

    // Takeover mid-session: the athlete's session must not be interrupted.
    dispatchControllerChange(container);
    expect(reloadMock).not.toHaveBeenCalled();

    // Screen lock: hidden but the session marker is still present (audio
    // keeps playing through lock by design) — still no reload.
    setVisibilityState("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(reloadMock).not.toHaveBeenCalled();

    // Session finishes while the app is hidden (in a pocket) — safe moment.
    endGuidedSession(audio);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not treat an OS-initiated pause (phone call) as the session being over", () => {
    const container = makeServiceWorkerContainer(true);
    // OS pause: element is paused but the marker — athlete intent — remains.
    attachGuidedSessionAudio({ paused: true });
    render(<ServiceWorkerRegistrar />);

    dispatchControllerChange(container);
    expect(reloadMock).not.toHaveBeenCalled();

    // The call backgrounds the app; session still in progress — no reload.
    setVisibilityState("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("holds a foreground session-end until the app is next hidden", () => {
    const container = makeServiceWorkerContainer(true);
    const audio = attachGuidedSessionAudio();
    render(<ServiceWorkerRegistrar />);

    dispatchControllerChange(container);

    // Session completes in the foreground — the completion screen must not
    // be snatched away.
    setVisibilityState("visible");
    endGuidedSession(audio);
    expect(reloadMock).not.toHaveBeenCalled();

    // Next backgrounding is the safe moment.
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
