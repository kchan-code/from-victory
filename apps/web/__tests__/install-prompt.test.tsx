/**
 * @vitest-environment jsdom
 */
// FV-258 — InstallPrompt component unit tests.
//
// Coverage:
//  1. Already installed (standalone matchMedia true)  → renders nothing
//  2. iOS, not installed                              → instruction text renders
//  3. Android path: beforeinstallprompt fires         → Install button appears
//                   clicking Install calls prompt()
//  4. Dismissed flag in localStorage                  → renders nothing
//  5. Clicking "Not now" sets the localStorage flag + removes card

import "@testing-library/jest-dom/vitest";

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

import InstallPrompt from "@/components/athlete/InstallPrompt";

// ---------------------------------------------------------------------------
// matchMedia stub
// (jsdom has no native matchMedia; we must install one before each test)
// ---------------------------------------------------------------------------

function stubMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        query === "(display-mode: standalone)" ? standalone : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ---------------------------------------------------------------------------
// localStorage stub
// (jsdom provides localStorage, but guard against private-mode environments
// where the real thing may be missing; we install a minimal in-memory stub)
// ---------------------------------------------------------------------------

const localStorageStub: Record<string, string> = {};

function installLocalStorageStub() {
  Object.defineProperty(window, "localStorage", {
    writable: true,
    configurable: true,
    value: {
      getItem: (key: string) => localStorageStub[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageStub[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageStub[key];
      },
      clear: () => {
        Object.keys(localStorageStub).forEach((k) => delete localStorageStub[k]);
      },
    },
  });
}

// ---------------------------------------------------------------------------
// navigator.userAgent stub helper
// ---------------------------------------------------------------------------

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    writable: true,
    configurable: true,
    value: ua,
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear localStorage stub state between tests
  Object.keys(localStorageStub).forEach((k) => delete localStorageStub[k]);
  installLocalStorageStub();

  // Default UA: non-iOS desktop
  setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  );

  // Default: not installed (standalone = false)
  stubMatchMedia(false);

  // Remove navigator.standalone (iOS non-standard prop) by default
  // reason: navigator.standalone is non-standard; cast needed for deletion
  delete (navigator as Navigator & { standalone?: boolean }).standalone;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Remove any leftover beforeinstallprompt listeners
  // (each test manages its own via rendered component lifecycle)
});

// ---------------------------------------------------------------------------
// 1. Already installed → renders nothing
// ---------------------------------------------------------------------------

describe("InstallPrompt — already installed", () => {
  it("renders nothing when display-mode: standalone is true", () => {
    stubMatchMedia(true); // installed
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    );

    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when iOS navigator.standalone is true", () => {
    stubMatchMedia(false);
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    // reason: navigator.standalone is non-standard iOS property
    (navigator as Navigator & { standalone?: boolean }).standalone = true;

    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// 2. iOS, not installed → shows install instructions
// ---------------------------------------------------------------------------

describe("InstallPrompt — iOS, not installed", () => {
  beforeEach(() => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    stubMatchMedia(false);
  });

  it("renders the card with correct instruction text", () => {
    render(<InstallPrompt />);

    expect(screen.getByTestId("install-prompt-card")).toBeInTheDocument();
    expect(
      screen.getByText(/Train from your Home Screen/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tap/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Training reminders on iPhone only work once it/i),
    ).toBeInTheDocument();
  });

  it("renders a 'Not now' dismiss button", () => {
    render(<InstallPrompt />);
    expect(screen.getByRole("button", { name: /not now/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Android/Chromium — beforeinstallprompt path
// ---------------------------------------------------------------------------

describe("InstallPrompt — Android/Chromium beforeinstallprompt", () => {
  beforeEach(() => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    );
    stubMatchMedia(false);
  });

  it("renders nothing before the beforeinstallprompt event fires", () => {
    const { container } = render(<InstallPrompt />);
    // No event fired yet — should render nothing
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the Install button after beforeinstallprompt fires", async () => {
    render(<InstallPrompt />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt") as BeforeInstallPromptEvent & {
      prompt: MockInstance;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    mockEvent.prompt = mockPrompt;
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    await act(async () => {
      window.dispatchEvent(mockEvent);
    });

    expect(screen.getByTestId("install-prompt-card")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add to Home Screen/i }),
    ).toBeInTheDocument();
  });

  it("calls prompt() when the Install button is clicked", async () => {
    render(<InstallPrompt />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt") as BeforeInstallPromptEvent & {
      prompt: MockInstance;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    mockEvent.prompt = mockPrompt;
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    await act(async () => {
      window.dispatchEvent(mockEvent);
    });

    const installBtn = screen.getByRole("button", { name: /Add to Home Screen/i });
    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(mockPrompt).toHaveBeenCalledTimes(1);
  });

  it("hides the card after the Install button is clicked", async () => {
    render(<InstallPrompt />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt") as BeforeInstallPromptEvent & {
      prompt: MockInstance;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    mockEvent.prompt = mockPrompt;
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    await act(async () => {
      window.dispatchEvent(mockEvent);
    });

    const installBtn = screen.getByRole("button", { name: /Add to Home Screen/i });
    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(screen.queryByTestId("install-prompt-card")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. Dismissed flag in localStorage → renders nothing
// ---------------------------------------------------------------------------

describe("InstallPrompt — localStorage dismissed flag", () => {
  it("renders nothing when fv_install_prompt_dismissed=1 is already set", () => {
    // Pre-set the flag before mounting
    localStorageStub["fv_install_prompt_dismissed"] = "1";

    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    stubMatchMedia(false);

    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// 5. Clicking "Not now" sets the dismissed flag + hides the card
// ---------------------------------------------------------------------------

describe("InstallPrompt — Not now dismiss", () => {
  beforeEach(() => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    stubMatchMedia(false);
  });

  it("removes the card when 'Not now' is clicked", () => {
    render(<InstallPrompt />);

    expect(screen.getByTestId("install-prompt-card")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /not now/i }));

    expect(screen.queryByTestId("install-prompt-card")).not.toBeInTheDocument();
  });

  it("sets fv_install_prompt_dismissed=1 in localStorage when dismissed", () => {
    render(<InstallPrompt />);

    fireEvent.click(screen.getByRole("button", { name: /not now/i }));

    expect(localStorageStub["fv_install_prompt_dismissed"]).toBe("1");
  });

  it("does not re-render the card after dismiss if component remounts", () => {
    const { unmount } = render(<InstallPrompt />);

    // Dismiss
    fireEvent.click(screen.getByRole("button", { name: /not now/i }));
    unmount();

    // Remount — localStorage flag is still set
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// 6. Desktop Chrome — beforeinstallprompt fires but card must NOT render
// (AC: Android gate; desktop Chrome/Edge fire the event but variant → "none")
// ---------------------------------------------------------------------------

describe("InstallPrompt — desktop Chrome (no Android token)", () => {
  it("renders nothing on Macintosh Chrome even when beforeinstallprompt fires", async () => {
    // UA: desktop Chrome on macOS — no "Android" token.
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );
    stubMatchMedia(false);

    const { container } = render(<InstallPrompt />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt") as BeforeInstallPromptEvent & {
      prompt: MockInstance;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    mockEvent.prompt = mockPrompt;
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    await act(async () => {
      window.dispatchEvent(mockEvent);
    });

    // Desktop Chrome fired beforeinstallprompt — but the Android UA gate
    // means we never registered the listener, so the card must not appear.
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on Windows Chrome even when beforeinstallprompt fires", async () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );
    stubMatchMedia(false);

    const { container } = render(<InstallPrompt />);

    const mockEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    }) as BeforeInstallPromptEvent;

    await act(async () => {
      window.dispatchEvent(mockEvent);
    });

    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// 7. Listener cleanup — beforeinstallprompt listener removed on unmount
// ---------------------------------------------------------------------------

describe("InstallPrompt — Android listener cleanup on unmount", () => {
  it("removes the beforeinstallprompt listener when unmounted", () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    );
    stubMatchMedia(false);

    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<InstallPrompt />);
    unmount();

    // The useEffect cleanup must have called window.removeEventListener for
    // the "beforeinstallprompt" event.
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
  });
});

// ---------------------------------------------------------------------------
// 8. iPadOS desktop-mode (Macintosh UA) → renders nothing today.
//    NOTE: A Mac UA with maxTouchPoints > 1 is the real iPadOS desktop-mode
//    signal, but jsdom always reports maxTouchPoints = 0, making it
//    indistinguishable from a real Mac in unit tests. This test documents
//    the CURRENT behaviour (Mac UA → "none") and serves as a regression
//    anchor. Proper iPadOS detection (check maxTouchPoints at runtime) is
//    tracked in FV-260.
// ---------------------------------------------------------------------------

describe("InstallPrompt — iPadOS desktop-mode UA (Mac UA, jsdom)", () => {
  it("renders nothing for a Macintosh UA (current behaviour — see FV-260)", () => {
    // iPadOS in desktop mode sends "Macintosh" in the UA; jsdom can't
    // distinguish it from a real Mac (maxTouchPoints unavailable).
    // Until FV-260 adds the touch-point check, both map to variant "none".
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1",
    );
    stubMatchMedia(false);

    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// Type alias for the BeforeInstallPromptEvent (mirrors component internal)
// ---------------------------------------------------------------------------

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
