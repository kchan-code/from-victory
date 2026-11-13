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
  // reason: test stub for next/image; renders a plain img with the same alt.
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

import { InviteFlow } from "@/components/auth/InviteFlow";
import { InviteSetupForm } from "@/components/auth/InviteSetupForm";
import { SignInChooser } from "@/components/auth/SignInChooser";
import { InvitePanel } from "@/components/dashboard/InvitePanel";
import { PLAY_STORE_URL } from "@/lib/marketing/play-store";
import { APP_STORE_URL } from "@/lib/marketing/app-store";

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

  it("pending → explains the code can't be shown again; offers a replacement, never an old code", () => {
    render(
      <InvitePanel
        athleteId={ATHLETE}
        athleteFirstName="Ava"
        status={{ state: "pending", expiresAt: EXP, pendingRecovery: false }}
      />,
    );
    expect(screen.getByTestId("invite-state-pending")).toHaveTextContent(/only shown when it.s created/i);
    expect(screen.getByRole("button", { name: "Create a new invite" })).toBeInTheDocument();
    expect(screen.queryByTestId("invite-code")).not.toBeInTheDocument();
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
    expect(screen.getByTestId("invite-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
    expect(screen.getByTestId("invite-share")).toHaveTextContent("Share invite");
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(screen.getByTestId("invite-replace")).toHaveTextContent("Create a new invite");
    // Screen readers hear that a code was created.
    expect(screen.getByRole("status")).toHaveTextContent("Invite code created: 7KQ2-M9XD-4HTR-PW3B.");
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
    expect(screen.getByTestId("invite-issued")).toHaveTextContent(/username stays the same/i);
    expect(screen.getByTestId("invite-share")).toHaveTextContent("Share reset link");
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

    it("iPhone: App Store, then tap the link again, then type the code as the fallback", async () => {
      await renderLinked(IPHONE_UA);
      const chooser = screen.getByTestId("invite-install-chooser");
      expect(chooser).toHaveAttribute("data-platform", "ios");
      expect(chooser).toHaveTextContent("Train in the From Victory app.");
      expect(chooser).not.toHaveTextContent(/on iPhone, or keep going/i);
      expect(chooser).not.toHaveTextContent(/need to type anything/i);

      expect(stepIds()).toEqual([
        "invite-step-get-app",
        "invite-step-reopen",
        "invite-step-code",
      ]);
      const getApp = screen.getByTestId("invite-step-get-app");
      const reopen = screen.getByTestId("invite-step-reopen");
      const code = screen.getByTestId("invite-step-code");
      expect(getApp.compareDocumentPosition(reopen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(reopen.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      expect(getApp).toHaveTextContent("Get the app.");
      expect(screen.getByRole("link", { name: "Download on the App Store" })).toHaveAttribute(
        "href",
        APP_STORE_URL,
      );
      expect(screen.queryByRole("link", { name: "Get it on Google Play" })).not.toBeInTheDocument();

      expect(reopen).toHaveTextContent(
        "After it installs, come back to your text and tap the link again. The app opens your setup. You do not type this code.",
      );
      expect(code).toHaveTextContent(
        "Or open From Victory, tap I have an invite, and enter this code.",
      );
      expect(screen.getByTestId("invite-chooser-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
      expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();

      const cont = screen.getByTestId("invite-continue-browser");
      expect(cont.className).not.toMatch(/w-full/);
      expect(code.compareDocumentPosition(cont) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(chooser).toHaveTextContent("Finish setup on this page instead of in the app.");
    });

    it("iPad: App Store and the same reopen path as iPhone", async () => {
      await renderLinked(IPAD_UA);
      expect(screen.getByTestId("invite-install-chooser")).toHaveAttribute("data-platform", "ios");
      expect(screen.getByRole("link", { name: "Download on the App Store" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Get it on Google Play" })).not.toBeInTheDocument();
      expect(screen.getByTestId("invite-step-reopen")).toHaveTextContent(
        "come back to your text and tap the link again",
      );
    });

    it("Android: Google Play, and typing the code is the main path", async () => {
      await renderLinked(ANDROID_UA);
      const chooser = screen.getByTestId("invite-install-chooser");
      expect(chooser).toHaveAttribute("data-platform", "android");
      expect(chooser).toHaveTextContent("Train in the From Victory app.");
      expect(chooser).not.toHaveTextContent(/iPhone/i);
      expect(chooser).not.toHaveTextContent(/tap the link again/i);
      expect(chooser).not.toHaveTextContent(/need to type anything/i);

      expect(stepIds()).toEqual(["invite-step-get-app", "invite-step-code"]);
      const getApp = screen.getByTestId("invite-step-get-app");
      const code = screen.getByTestId("invite-step-code");
      expect(getApp.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      expect(screen.queryByRole("link", { name: "Download on the App Store" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Get it on Google Play" })).toHaveAttribute(
        "href",
        PLAY_STORE_URL,
      );
      expect(code).toHaveTextContent(
        "Open From Victory, tap I have an invite, and enter this code.",
      );
      expect(code).not.toHaveTextContent(/^Or open/);
      expect(screen.getByTestId("invite-chooser-code")).toHaveTextContent("7KQ2-M9XD-4HTR-PW3B");
      expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
      expect(chooser).toHaveTextContent("Finish setup on this page instead of in the app.");
      expect(formActionMock).not.toHaveBeenCalled();
    });

    it("desktop: both stores, iPhone reopen, and Android code entry", async () => {
      await renderLinked(DESKTOP_UA);
      const chooser = screen.getByTestId("invite-install-chooser");
      expect(chooser).toHaveAttribute("data-platform", "unknown");
      expect(stepIds()).toEqual([
        "invite-step-get-app",
        "invite-step-reopen",
        "invite-step-code",
      ]);
      expect(screen.getByRole("link", { name: "Download on the App Store" })).toHaveAttribute(
        "href",
        APP_STORE_URL,
      );
      expect(screen.getByRole("link", { name: "Get it on Google Play" })).toHaveAttribute(
        "href",
        PLAY_STORE_URL,
      );
      expect(screen.getByTestId("invite-step-reopen")).toHaveTextContent(
        "On iPhone, after it installs, come back to your text and tap the link again.",
      );
      expect(screen.getByTestId("invite-step-code")).toHaveTextContent(
        "On Android, open From Victory, tap I have an invite, and enter this code.",
      );
      expect(chooser).not.toHaveTextContent(/need to type anything/i);
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
    expect(screen.getByText(/Open it, tap I have an invite/i)).toBeInTheDocument();
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
  it("invite: asks for a username + password", () => {
    render(<InviteSetupForm code="7KQ2M9XD4HTRPW3B" firstName="Ava" mode="invite" username={null} />);
    const user = screen.getByLabelText("Username") as HTMLInputElement;
    expect(user.name).toBe("username");
    expect(user.readOnly).toBe(false);
    expect(screen.getByRole("button", { name: "Start training" })).toBeInTheDocument();
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
