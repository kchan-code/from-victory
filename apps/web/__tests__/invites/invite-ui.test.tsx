/**
 * @vitest-environment jsdom
 *
 * FV-630 — invite UI: parent panel states (not invited / pending / ready /
 * just created), athlete flow (app vs browser chooser, code entry, setup vs
 * recovery), and the sign-in "I have an invite" entry.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { formState, formActionMock } = vi.hoisted(() => ({
  formState: { current: null as unknown },
  formActionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: () => [formState.current, formActionMock],
    useFormStatus: () => ({ pending: false }),
  };
});
vi.mock("@/lib/actions/invites", () => ({
  createAthleteInvite: vi.fn(),
  checkInvite: vi.fn(),
  claimAthleteInvite: vi.fn(),
}));
vi.mock("@/lib/actions/auth", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/actions/email-signup", () => ({
  startEmailSignup: vi.fn(),
  completeEmailSignup: vi.fn(),
  verifyEmailOnly: vi.fn(),
  resendSignupCode: vi.fn(),
}));
vi.mock("@/lib/actions/pairings", () => ({ athleteUsernameSignIn: vi.fn() }));
vi.mock("@/lib/pregame/session-cache", () => ({ clearPregameSession: vi.fn() }));
vi.mock("next/image", () => ({
  // reason: test stub for next/image; keeps alt and the display size.
  default: (props: { alt: string; src: string; width?: number; height?: number }) => (
    <img alt={props.alt} src={props.src} width={props.width} height={props.height} />
  ),
}));

import { InviteFlow } from "@/components/auth/InviteFlow";
import { InviteSetupForm } from "@/components/auth/InviteSetupForm";
import { SignInChooser } from "@/components/auth/SignInChooser";
import { InvitePanel } from "@/components/dashboard/InvitePanel";
import { StoreDownloadBadges } from "@/components/landing/StoreDownloadBadges";
import { PLAY_STORE_URL } from "@/lib/marketing/play-store";
import { APP_STORE_URL } from "@/lib/marketing/app-store";

function assertStoreUrl(href: string | null) {
  expect(href).toBeTruthy();
  const keys = [...new URL(href!).searchParams.keys()];
  expect(keys.every((key) => key === "id")).toBe(true);
}

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function setUserAgent(ua: string, maxTouchPoints = 0) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: ua,
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints,
  });
}

const ATHLETE = "20000000-0000-4000-8000-00000000000a";
const EXP = "2026-11-13T21:00:00+00:00";

beforeEach(() => {
  formState.current = null;
  formActionMock.mockReset();
  window.history.replaceState(null, "", "/");
});
afterEach(cleanup);

// ===========================================================================
describe("InvitePanel (parent)", () => {
  it("not invited → Create invite", () => {
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "not_invited", expiresAt: null, pendingRecovery: false }}
      />,
    );
    expect(screen.getByTestId("invite-state-not-invited")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create invite" })).toBeInTheDocument();
  });

  it("legacy account with no username → 'add a username' copy, history kept", () => {
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "needs_username", expiresAt: null, pendingRecovery: false }}
      />,
    );
    const panel = screen.getByTestId("invite-state-needs-username");
    expect(panel).toHaveTextContent(/already trains on one device/i);
    expect(panel).toHaveTextContent(/training history stays/i);
    expect(screen.getByRole("button", { name: "Create invite" })).toBeInTheDocument();
  });

  it("pending → waiting chip, code shown once, replacement stays behind a confirm", () => {
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "pending", expiresAt: EXP, pendingRecovery: false }}
      />,
    );
    const panel = screen.getByTestId("invite-state-pending");
    expect(panel).toHaveTextContent("Waiting for Ava");
    expect(panel).toHaveTextContent(/hasn.t finished setting up yet/i);
    expect(panel).toHaveTextContent(/works until/i);
    expect(panel).toHaveTextContent(/only show an invite code once/i);
    expect(screen.getByTestId("invite-replace")).toHaveTextContent("Make a new invite");
    expect(screen.queryByTestId("invite-code")).not.toBeInTheDocument();
    expect(screen.queryByTestId("invite-replace-confirm")).not.toBeInTheDocument();
    expect(panel.textContent).not.toMatch(/—|–/);

    fireEvent.click(screen.getByTestId("invite-replace"));
    expect(formActionMock).not.toHaveBeenCalled();
    const confirm = screen.getByTestId("invite-replace-confirm");
    expect(confirm).toHaveAttribute("type", "submit");
    expect(confirm).toHaveTextContent("Replace invite");
    const form = confirm.closest("form");
    expect(form?.querySelector('input[name="athlete_id"]')).toHaveValue(ATHLETE);
    expect(screen.getByTestId("invite-replace").closest("form")).toBeNull();
  });

  it("ready → separate recovery that keeps the username", () => {
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "ready", expiresAt: null, pendingRecovery: false }}
      />,
    );
    const panel = screen.getByTestId("invite-state-ready");
    expect(screen.getByTestId("invite-status-chip")).toHaveTextContent("Set up");
    expect(panel).toHaveTextContent(/account is ready/i);
    expect(panel).toHaveTextContent(/keeps their username/i);
    expect(screen.getByRole("button", { name: "Create reset code" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create invite/i })).not.toBeInTheDocument();
  });

  it("just created → shows the formatted code, share + copy, and a replace option", () => {
    formState.current = { ok: true, code: "7KQ2M9XD4HTRPW3B", purpose: "invite", expiresAt: EXP };
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "pending", expiresAt: EXP, pendingRecovery: false }}
      />,
    );
    const panel = screen.getByTestId("invite-issued");
    expect(screen.getByTestId("invite-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
    expect(screen.getByTestId("invite-share")).toHaveTextContent("Send invite to Ava");
    expect(screen.getByRole("button", { name: "Copy invite link" })).toBeInTheDocument();
    expect(screen.getByTestId("invite-backup")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(panel).toHaveTextContent(/works one time and expires/i);
    expect(panel).toHaveTextContent(/can.t show this code again/i);
    expect(panel).toHaveTextContent("What Ava does next");
    expect(panel).toHaveTextContent("Use this on Android.");
    expect(screen.getByTestId("invite-replace")).toHaveTextContent("Replace this invite");
    expect(screen.queryByTestId("invite-replace-confirm")).not.toBeInTheDocument();
    expect(panel.textContent).not.toMatch(/—|–/);
    // Screen readers hear that a code was created.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Invite created. Backup code 7KQ2-M9XD-4HTR-PW3B.",
    );
  });

  it("replace asks before it turns the invite off", () => {
    formState.current = { ok: true, code: "7KQ2M9XD4HTRPW3B", purpose: "invite", expiresAt: EXP };
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "pending", expiresAt: EXP, pendingRecovery: false }}
      />,
    );
    const trigger = screen.getByTestId("invite-replace");
    expect(trigger).toHaveAttribute("type", "button");
    fireEvent.click(trigger);
    expect(formActionMock).not.toHaveBeenCalled();
    expect(screen.getByText("Replace Ava's invite?")).toBeInTheDocument();
    const confirm = screen.getByTestId("invite-replace-confirm");
    expect(confirm).toHaveAttribute("type", "submit");
    expect(confirm.closest("form")?.querySelector('input[name="athlete_id"]')).toHaveValue(
      ATHLETE,
    );
    expect(trigger.closest("form")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Keep this invite" }));
    expect(screen.queryByTestId("invite-replace-confirm")).not.toBeInTheDocument();
    expect(formActionMock).not.toHaveBeenCalled();
  });

  it("share sends the fragment link (code never in a query string)", async () => {
    formState.current = { ok: true, code: "7KQ2M9XD4HTRPW3B", purpose: "invite", expiresAt: EXP };
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<InvitePanel athleteId={ATHLETE} athleteFirstName="Ava" status={null} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("invite-share"));
    });
    const arg = (share.mock.calls[0] as unknown as [{ url: string; text: string }])[0];
    expect(arg.url).toBe(`${window.location.origin}/invite#code=7KQ2-M9XD-4HTR-PW3B`);
    expect(arg.url).not.toContain("?");
    expect(arg.text).toContain("7KQ2-M9XD-4HTR-PW3B");
    expect(arg.text).not.toContain("Ava");
    expect(arg.text).not.toMatch(/—|–/);
    const installAt = arg.text.indexOf("1. Get the From Victory app");
    const linkAt = arg.text.indexOf("2. Then tap this link");
    expect(installAt).toBeGreaterThanOrEqual(0);
    expect(linkAt).toBeGreaterThan(installAt);
    expect(arg.text.indexOf(arg.url)).toBeGreaterThan(linkAt);
    expect(screen.getByTestId("invite-share")).toHaveTextContent("Send it again");
    expect(screen.queryByText(/Paste it in a text/i)).not.toBeInTheDocument();
    Reflect.deleteProperty(navigator, "share");
  });

  it("just created recovery → reset copy says the username stays", () => {
    formState.current = { ok: true, code: "7KQ2M9XD4HTRPW3B", purpose: "recovery", expiresAt: EXP };
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "ready", expiresAt: null, pendingRecovery: false }}
      />,
    );
    const panel = screen.getByTestId("invite-issued");
    expect(panel).toHaveTextContent(/username stays the same/i);
    expect(screen.getByTestId("invite-share")).toHaveTextContent("Send reset link to Ava");
    expect(screen.getByTestId("invite-replace")).toHaveTextContent("Replace this reset code");
    expect(panel).toHaveTextContent(/This reset code works one time and expires/i);
  });

  it("surfaces a create error", () => {
    formState.current = { ok: false, error: "You can't invite this athlete." };
    render(<InvitePanel athleteId={ATHLETE} athleteFirstName="Ava" status={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("You can't invite this athlete.");
  });
});

// ===========================================================================
describe("InviteFlow (athlete)", () => {
  it("in the app, a linked code is checked automatically and dropped from the URL", async () => {
    window.history.replaceState(null, "", "/invite#code=7KQ2-M9XD-4HTR-PW3B");
    await act(async () => {
      render(<InviteFlow nativeShell />);
    });
    expect(formActionMock).toHaveBeenCalledTimes(1);
    const sent = formActionMock.mock.calls[0]![0] as FormData;
    expect(sent.get("code")).toBe("7KQ2M9XD4HTRPW3B");
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/invite");
  });

  it("in a browser, continuing there checks the linked code and does not auto-check first", async () => {
    setUserAgent(DESKTOP_UA);
    window.history.replaceState(null, "", "/invite#code=7KQ2-M9XD-4HTR-PW3B");
    await act(async () => {
      render(<InviteFlow nativeShell={false} />);
    });
    expect(screen.getByTestId("invite-install-chooser")).toBeInTheDocument();
    expect(formActionMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByTestId("invite-continue-browser"));
    });
    expect(formActionMock).toHaveBeenCalledTimes(1);
  });

  describe("install chooser by platform", () => {
    async function renderLinked(ua: string, maxTouchPoints = 0) {
      setUserAgent(ua, maxTouchPoints);
      window.history.replaceState(null, "", "/invite#code=7KQ2-M9XD-4HTR-PW3B");
      await act(async () => {
        render(<InviteFlow nativeShell={false} />);
      });
    }

    function stepIds(): string[] {
      return screen.getAllByRole("listitem").map((item) => item.getAttribute("data-testid") ?? "");
    }

    it("iPhone: App Store, tap the link again, and a collapsed code disclosure", async () => {
      await renderLinked(IPHONE_UA);
      const chooser = screen.getByTestId("invite-install-chooser");
      expect(chooser).toHaveAttribute("data-platform", "ios");
      expect(chooser).toHaveTextContent("Train in the From Victory app.");
      expect(chooser).not.toHaveTextContent(/on iPhone, or keep going/i);
      expect(chooser).not.toHaveTextContent(/need to type anything/i);
      expect(chooser.textContent).not.toMatch(/—|–/);

      expect(stepIds()).toEqual(["invite-step-get-app", "invite-step-reopen"]);
      const getApp = screen.getByTestId("invite-step-get-app");
      const reopen = screen.getByTestId("invite-step-reopen");
      expect(getApp.compareDocumentPosition(reopen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      expect(getApp).toHaveTextContent("Get the app.");
      const appStore = screen.getByRole("link", { name: "Download on the App Store" });
      expect(appStore).toHaveAttribute("href", APP_STORE_URL);
      assertStoreUrl(appStore.getAttribute("href"));
      expect(screen.getByRole("img", { name: "Download on the App Store" })).toHaveAttribute(
        "height",
        "44",
      );
      expect(screen.getByRole("img", { name: "Download on the App Store" })).toHaveAttribute(
        "width",
        "132",
      );
      expect(screen.queryByRole("link", { name: "Get it on Google Play" })).not.toBeInTheDocument();

      expect(reopen).toHaveTextContent("Tap your invite link again.");
      expect(reopen).toHaveTextContent("The app opens your setup. No code needed.");
      expect(screen.queryByTestId("invite-chooser-code")).not.toBeInTheDocument();

      const disclosure = screen.getByTestId("invite-type-code");
      expect(disclosure).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(disclosure);
      expect(disclosure).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(/Open From Victory, tap/i)).toBeInTheDocument();
      expect(screen.getByTestId("invite-chooser-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
      expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();

      const cont = screen.getByTestId("invite-continue-browser");
      expect(cont.className).not.toMatch(/w-full/);
      expect(reopen.compareDocumentPosition(cont) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(chooser).not.toHaveTextContent("Finish setup on this page");
    });

    it("iPad: App Store and the same reopen path as iPhone", async () => {
      await renderLinked(IPAD_UA);
      expect(screen.getByTestId("invite-install-chooser")).toHaveAttribute("data-platform", "ios");
      expect(screen.getByRole("link", { name: "Download on the App Store" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Get it on Google Play" })).not.toBeInTheDocument();
      expect(screen.getByTestId("invite-step-reopen")).toHaveTextContent(
        "Tap your invite link again.",
      );
    });

    it("Android: Google Play, welcome-screen invite door, then the code", async () => {
      await renderLinked(ANDROID_UA);
      const chooser = screen.getByTestId("invite-install-chooser");
      expect(chooser).toHaveAttribute("data-platform", "android");
      expect(chooser).toHaveTextContent("Train in the From Victory app.");
      expect(chooser).not.toHaveTextContent(/iPhone/i);
      expect(chooser).not.toHaveTextContent(/tap the link again/i);
      expect(chooser).not.toHaveTextContent(/bottom of the sign-in/i);
      expect(chooser.textContent).not.toMatch(/—|–/);

      expect(stepIds()).toEqual([
        "invite-step-get-app",
        "invite-step-open",
        "invite-step-code",
      ]);
      const getApp = screen.getByTestId("invite-step-get-app");
      const open = screen.getByTestId("invite-step-open");
      const code = screen.getByTestId("invite-step-code");
      expect(getApp.compareDocumentPosition(open) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(open.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      expect(screen.queryByRole("link", { name: "Download on the App Store" })).not.toBeInTheDocument();
      const play = screen.getByRole("link", { name: "Get it on Google Play" });
      expect(play).toHaveAttribute("href", PLAY_STORE_URL);
      assertStoreUrl(play.getAttribute("href"));
      expect(screen.getByRole("img", { name: "Get it on Google Play" })).toHaveAttribute(
        "width",
        "148",
      );
      expect(screen.getByRole("img", { name: "Get it on Google Play" })).toHaveAttribute(
        "height",
        "44",
      );
      expect(open).toHaveTextContent("Open From Victory and tap I have an invite.");
      expect(open).toHaveTextContent(/It.s on the welcome screen/);
      expect(code).toHaveTextContent("Enter this code.");
      expect(code).toHaveTextContent("Your invite code");
      expect(screen.getByTestId("invite-chooser-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
      expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
      expect(chooser).not.toHaveTextContent("Finish setup on this page");
      expect(formActionMock).not.toHaveBeenCalled();
    });

    it("desktop: both stores, an iPhone default, and an Android toggle", async () => {
      await renderLinked(DESKTOP_UA);
      const chooser = screen.getByTestId("invite-install-chooser");
      expect(chooser).toHaveAttribute("data-platform", "unknown");
      expect(chooser).toHaveTextContent("Get the app on your phone.");
      expect(stepIds()).toEqual(["invite-step-get-app", "invite-step-reopen"]);
      const appStore = screen.getByRole("link", { name: "Download on the App Store" });
      const play = screen.getByRole("link", { name: "Get it on Google Play" });
      expect(appStore).toHaveAttribute("href", APP_STORE_URL);
      expect(play).toHaveAttribute("href", PLAY_STORE_URL);
      assertStoreUrl(appStore.getAttribute("href"));
      assertStoreUrl(play.getAttribute("href"));
      expect(screen.getByTestId("invite-device-ios")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByTestId("invite-step-reopen")).toHaveTextContent(
        "Tap your invite link again.",
      );
      expect(chooser).toHaveTextContent("Typing it instead? Use this in the app.");
      expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
      expect(chooser).not.toHaveTextContent(/need to type anything/i);
      expect(chooser.textContent).not.toMatch(/—|–/);

      fireEvent.click(screen.getByTestId("invite-device-android"));
      expect(screen.getByTestId("invite-device-android")).toHaveAttribute("aria-pressed", "true");
      expect(stepIds()).toEqual([
        "invite-step-get-app",
        "invite-step-open",
        "invite-step-enter",
      ]);
      expect(screen.getByTestId("invite-step-open")).toHaveTextContent(
        /It.s on the welcome screen/,
      );
      expect(screen.getByTestId("invite-step-enter")).toHaveTextContent("Enter the code below.");
      expect(chooser).toHaveTextContent("Typing it instead? Use this in the app.");
    });

    it("keeps the linked code when Strict Mode runs the effect twice", async () => {
      setUserAgent(IPHONE_UA);
      window.history.replaceState(null, "", "/invite#code=7KQ2-M9XD-4HTR-PW3B");
      await act(async () => {
        render(
          <StrictMode>
            <InviteFlow nativeShell={false} />
          </StrictMode>,
        );
      });
      expect(screen.getByTestId("invite-install-chooser")).toHaveAttribute("data-platform", "ios");
      fireEvent.click(screen.getByTestId("invite-type-code"));
      expect(screen.getByTestId("invite-chooser-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
      expect(window.location.hash).toBe("");
    });

    it("iPadOS desktop mode (Macintosh UA, touch) is treated as iPhone", async () => {
      await renderLinked(DESKTOP_UA, 5);
      expect(screen.getByTestId("invite-install-chooser")).toHaveAttribute("data-platform", "ios");
      expect(screen.queryByRole("link", { name: "Get it on Google Play" })).not.toBeInTheDocument();
    });
  });

  it("with no link code on Android, offers Google Play and does not say iPhone", async () => {
    setUserAgent(ANDROID_UA);
    window.history.replaceState(null, "", "/invite");
    await act(async () => {
      render(<InviteFlow nativeShell={false} />);
    });
    expect(screen.getByTestId("invite-code-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get it on Google Play" })).toHaveAttribute(
      "href",
      PLAY_STORE_URL,
    );
    expect(screen.queryByRole("link", { name: "Download on the App Store" })).not.toBeInTheDocument();
    expect(screen.getByText(/tap I have an invite on the welcome screen/i)).toBeInTheDocument();
    expect(screen.queryByText(/On iPhone/i)).not.toBeInTheDocument();
  });

  it("with no link code, shows code entry", async () => {
    window.history.replaceState(null, "", "/invite");
    await act(async () => {
      render(<InviteFlow nativeShell />);
    });
    expect(screen.getByTestId("invite-code-form")).toBeInTheDocument();
    expect(screen.getByLabelText("Invite code")).toBeInTheDocument();
    expect(formActionMock).not.toHaveBeenCalled();
  });

  it("a malformed fragment is ignored (code entry, no check)", async () => {
    window.history.replaceState(null, "", "/invite#code=<script>");
    await act(async () => {
      render(<InviteFlow nativeShell />);
    });
    expect(screen.getByTestId("invite-code-form")).toBeInTheDocument();
    expect(formActionMock).not.toHaveBeenCalled();
  });

  it("shows the check error on the code form", async () => {
    window.history.replaceState(null, "", "/invite");
    formState.current = { ok: false, error: "This code can't be used." };
    await act(async () => {
      render(<InviteFlow nativeShell />);
    });
    expect(screen.getByText("This code can't be used.")).toBeInTheDocument();
  });

  it("a valid check moves to setup", async () => {
    formState.current = { ok: true, code: "7KQ2M9XD4HTRPW3B", firstName: "Ava", mode: "invite", username: null };
    await act(async () => {
      render(<InviteFlow nativeShell />);
    });
    expect(screen.getByTestId("invite-setup-invite")).toBeInTheDocument();
  });
});

// ===========================================================================
describe("InviteSetupForm", () => {
  const SUGG = ["steady_comet412", "north_harbor733", "calm_summit205"];
  const collision = {
    ok: false,
    error: "That username is already taken. Capital letters don't make it different.",
    field: "username",
    suggestions: SUGG,
  };

  it("invite: 'Choose a unique username' with rules + privacy hint wired to the input", () => {
    render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    const user = screen.getByLabelText("Choose a unique username") as HTMLInputElement;
    expect(user.name).toBe("username");
    expect(user.readOnly).toBe(false);
    const rules = document.getElementById("username-rules")!;
    expect(rules).toHaveTextContent("3–20 letters, numbers, or underscores. Not case-sensitive.");
    expect(rules).toHaveTextContent("Use a nickname, not your full name or birthday.");
    expect(user.getAttribute("aria-describedby")).toBe("username-rules");
    expect(screen.queryByTestId("username-suggestions")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start training" })).toBeInTheDocument();
  });

  it("collision: announces the error, keeps the rules, moves focus to the field, shows 3 suggestion buttons", () => {
    formState.current = collision;
    render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    const user = screen.getByLabelText("Choose a unique username");
    expect(screen.getByRole("alert")).toHaveTextContent(/Capital letters don.t make it different/);
    expect(user.getAttribute("aria-describedby")).toBe("username-error username-rules");
    expect(document.getElementById("username-rules")).toBeInTheDocument();
    expect(document.activeElement).toBe(user);
    const group = screen.getByRole("group", { name: "Try one of these:" });
    const buttons = Array.from(group.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent)).toEqual(SUGG);
    for (const btn of buttons) {
      expect(btn).toHaveAttribute("type", "button"); // never submits
      expect(btn.className).toContain("min-h-[44px]");
    }
    expect(screen.queryByText(/available/i)).not.toBeInTheDocument();
  });

  it("tapping a suggestion fills the username only: no submit, passwords untouched, focus stays on the pill", () => {
    formState.current = collision;
    render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    const user = screen.getByLabelText("Choose a unique username") as HTMLInputElement;
    const pw = screen.getByLabelText("Set your password") as HTMLInputElement;
    const pw2 = screen.getByLabelText("Confirm password") as HTMLInputElement;
    fireEvent.change(user, { target: { value: "Ava_10" } });
    fireEvent.change(pw, { target: { value: "hunter2hunter2" } });
    fireEvent.change(pw2, { target: { value: "hunter2hunter2" } });

    const pick = screen.getByRole("button", { name: "north_harbor733" });
    fireEvent.click(pick);

    expect(user.value).toBe("north_harbor733");
    expect(pw.value).toBe("hunter2hunter2");
    expect(pw2.value).toBe("hunter2hunter2");
    expect(formActionMock).not.toHaveBeenCalled();
    expect(pick).toHaveAttribute("aria-pressed", "true");
    // Focus stays on the pill: focusing the input would raise the phone
    // keyboard over the password fields.
    pick.focus();
    fireEvent.click(pick);
    expect(document.activeElement).toBe(pick);
    expect(document.activeElement).not.toBe(user);
    expect(screen.getByText("Username set to north_harbor733.")).toBeInTheDocument();
  });

  it("typed input survives a re-render with a new (repeated) collision response", () => {
    formState.current = collision;
    const view = render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    fireEvent.change(screen.getByLabelText("Set your password"), { target: { value: "hunter2hunter2" } });
    fireEvent.change(screen.getByLabelText("Choose a unique username"), { target: { value: "taken_too" } });
    formState.current = { ...collision, suggestions: ["bold_ridge901", "keen_orbit318", "clear_delta640"] };
    view.rerender(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    expect((screen.getByLabelText("Set your password") as HTMLInputElement).value).toBe("hunter2hunter2");
    expect((screen.getByLabelText("Choose a unique username") as HTMLInputElement).value).toBe("taken_too");
    expect(screen.getByRole("button", { name: "bold_ridge901" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "steady_comet412" })).not.toBeInTheDocument();
  });

  it("no suggestions for a non-collision username error, or for a password error", () => {
    formState.current = { ok: false, error: "That username isn't available. Try something else.", field: "username" };
    const view = render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    expect(screen.queryByTestId("username-suggestions")).not.toBeInTheDocument();
    formState.current = { ok: false, error: "Passwords do not match.", field: "password_confirm", suggestions: SUGG };
    view.rerender(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    expect(screen.queryByTestId("username-suggestions")).not.toBeInTheDocument();
  });

  it("recovery is unchanged: no unique-username copy or suggestions, even if a state carried them", () => {
    formState.current = { ok: false, error: "x", field: "username", suggestions: ["steady_comet412"] };
    render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="recovery" username="ava_10" />);
    expect(screen.getByLabelText("Username")).toHaveAttribute("readonly");
    expect(screen.queryByText("Choose a unique username")).not.toBeInTheDocument();
    expect(screen.queryByTestId("username-suggestions")).not.toBeInTheDocument();
    expect(screen.getByText("This doesn't change.")).toBeInTheDocument();
  });

  it("recovery: username shown read-only and NOT submitted", () => {
    const { container } = render(
      <InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="recovery" username="ava_10" />,
    );
    const user = screen.getByLabelText("Username") as HTMLInputElement;
    expect(user.value).toBe("ava_10");
    expect(user.readOnly).toBe(true);
    expect(user.name).toBe("");
    expect(container.querySelector('input[name="username"]')).toBeNull();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
  });
});

// ===========================================================================
describe("store badges", () => {
  it("App Store and Play URLs carry no query params other than id", () => {
    assertStoreUrl(APP_STORE_URL);
    assertStoreUrl(PLAY_STORE_URL);
    expect(new URL(PLAY_STORE_URL).searchParams.get("id")).toBe("com.fromvictoryapp.app");
    expect(new URL(APP_STORE_URL).search).toBe("");
  });

  it("renders a skeleton instead of both badges before the platform is known", () => {
    render(<StoreDownloadBadges platform={null} />);
    expect(screen.getByTestId("store-badges-skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("signed-in note", () => {
  it("sits under Continue in browser, not in a banner", async () => {
    setUserAgent(IPHONE_UA);
    window.history.replaceState(null, "", "/invite#code=7KQ2-M9XD-4HTR-PW3B");
    await act(async () => {
      render(<InviteFlow nativeShell={false} signedIn />);
    });
    const note = screen.getByTestId("invite-signed-in-note");
    const cont = screen.getByTestId("invite-continue-browser");
    expect(note.className).not.toMatch(/border/);
    expect(cont.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(note).toHaveTextContent(/signs them out here/i);
  });
});

describe("SignInChooser", () => {
  it("offers invite on the welcome doors, and still on both sign-in tabs", () => {
    render(<SignInChooser />);
    const door = screen.getByTestId("signin-have-invite");
    expect(door).toHaveAttribute("href", "/invite");
    expect(door).toHaveTextContent("For athletes under 18.");

    fireEvent.click(screen.getByTestId("signin-show-form"));
    const link = screen.getByTestId("signin-have-invite");
    expect(link).toHaveAttribute("href", "/invite");
    fireEvent.click(screen.getByTestId("signin-tab-athlete"));
    expect(screen.getByTestId("signin-have-invite")).toBeVisible();
  });
});
