/**
 * @vitest-environment jsdom
 *
 * FV-716: store shells must not show PWA install instructions or a reminder
 * toggle. Browser and installed-PWA behavior stays.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

const { requireAthleteMock, shellCapabilityMock, maybeSingleMock } = vi.hoisted(
  () => ({
    requireAthleteMock: vi.fn(),
    shellCapabilityMock: vi.fn(
      () => null as "legacy-native" | "ios-iap" | "android-play" | null,
    ),
    maybeSingleMock: vi.fn(async () => ({ data: null, error: null })),
  }),
);

vi.mock("@/lib/actions/push-reminder", () => ({
  savePushReminder: vi.fn(),
  updateReminderTime: vi.fn(),
  disablePushReminder: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: requireAthleteMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}));

import ReminderSettings from "@/components/athlete/ReminderSettings";
import NotificationsSettingsPage from "@/app/athlete/settings/notifications/page";
import { NATIVE_REMINDER_UNAVAILABLE_COPY } from "@/lib/push/native-reminder-copy";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  shellCapabilityMock.mockReturnValue(null);
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  requireAthleteMock.mockResolvedValue({ userId: "athlete-1" });
});

function stubMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(display-mode: standalone)" ? standalone : false,
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

function stubUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: ua,
  });
}

describe("ReminderSettings shell branch (FV-716)", () => {
  it("shows one honest line in a store shell and no toggle, even if PushManager exists", () => {
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    render(
      <ReminderSettings initialEnabled={false} initialHour={19} nativeShell />,
    );
    const note = screen.getByTestId("reminder-native-unavailable");
    expect(note).toHaveTextContent(NATIVE_REMINDER_UNAVAILABLE_COPY);
    expect(note.textContent).not.toContain("\u2014");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/your browser/i)).not.toBeInTheDocument();
  });

  it("keeps the iPhone home-screen instructions outside a store shell", () => {
    stubUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    stubMatchMedia(false);
    render(<ReminderSettings initialEnabled={false} initialHour={19} />);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
    expect(screen.queryByTestId("reminder-native-unavailable")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /daily training reminder/i })).toBeDisabled();
  });

  it("keeps the toggle on a non-iOS browser that cannot push", () => {
    stubUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X) jsdom");
    render(<ReminderSettings initialEnabled={false} initialHour={19} />);
    expect(screen.getByText(/your browser doesn't support push notifications/i)).toBeInTheDocument();
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("reminder-native-unavailable")).not.toBeInTheDocument();
  });
});

describe("/athlete/settings/notifications shell wiring (FV-716)", () => {
  it.each(["ios-iap", "legacy-native", "android-play"] as const)(
    "%s renders the honest line and not the install instructions",
    async (capability) => {
      shellCapabilityMock.mockReturnValue(capability);
      const jsx = await NotificationsSettingsPage();
      render(jsx);
      expect(screen.getByTestId("reminder-native-unavailable")).toHaveTextContent(
        NATIVE_REMINDER_UNAVAILABLE_COPY,
      );
      expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/your browser/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    },
  );

  it("a browser request still renders the reminder controls", async () => {
    shellCapabilityMock.mockReturnValue(null);
    stubUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X) jsdom");
    const jsx = await NotificationsSettingsPage();
    render(jsx);
    expect(screen.queryByTestId("reminder-native-unavailable")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /daily training reminder/i })).toBeInTheDocument();
  });
});
