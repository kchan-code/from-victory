/**
 * @vitest-environment jsdom
 *
 * FV-717: /update-required.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { headersMock, redirectMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  redirectMock: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/image", () => ({
  // reason: test stub for next/image; props pass straight to <img>.
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}));

import UpdateRequiredPage from "@/app/update-required/page";

const ANDROID_LEGACY =
  "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Mobile Safari/537.36 FVNativeShell/1";
const IOS_LEGACY =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148  FVNativeShell/1 (ios)";

function asUserAgent(ua: string | null) {
  headersMock.mockResolvedValue({ get: (name: string) => (name === "user-agent" ? ua : null) });
}

beforeEach(() => {
  vi.stubEnv("NATIVE_MIN_BUILD_ANDROID", "11");
  vi.stubEnv("NATIVE_MIN_BUILD_IOS", "8");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("/update-required", () => {
  it("a gated Android app gets the Google Play link", async () => {
    asUserAgent(ANDROID_LEGACY);
    const { getByTestId, getByRole } = render(await UpdateRequiredPage({}));
    expect(getByRole("heading", { level: 1 }).textContent).toBe(
      "Update the app to keep training.",
    );
    const link = getByTestId("update-required-store-link");
    expect(link.getAttribute("href")).toBe(
      "https://play.google.com/store/apps/details?id=com.fromvictoryapp.app",
    );
    expect(link.textContent).toBe("Update on Google Play");
  });

  it("a gated iOS app gets the App Store link", async () => {
    asUserAgent(IOS_LEGACY);
    const { getByTestId } = render(await UpdateRequiredPage({}));
    const link = getByTestId("update-required-store-link");
    expect(link.getAttribute("href")).toBe(
      "https://apps.apple.com/us/app/from-victory/id6804743047",
    );
    expect(link.textContent).toBe("Update on the App Store");
  });

  it("shows no price, purchase or billing language", async () => {
    asUserAgent(ANDROID_LEGACY);
    const { container } = render(await UpdateRequiredPage({}));
    expect(container.textContent).not.toMatch(/\$|subscri|payment|trial|price/i);
  });

  it.each([
    ["a browser", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Safari/605.1.15"],
    ["an up-to-date app", `${ANDROID_LEGACY} FVBuild/11`],
    ["no user agent", null],
  ])("%s is sent home instead of being stranded here", async (_label, ua) => {
    asUserAgent(ua);
    await expect(UpdateRequiredPage({})).rejects.toThrow("REDIRECT:/");
  });

  it("FV-489: when the service worker dropped the shell UA, the platform on the redirect still renders the screen (no loop)", async () => {
    asUserAgent("Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Mobile Safari/537.36");
    const { getByTestId } = render(
      await UpdateRequiredPage({ searchParams: Promise.resolve({ p: "android" }) }),
    );
    expect(getByTestId("update-required-store-link").textContent).toBe("Update on Google Play");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("the request's own UA wins over the query parameter", async () => {
    asUserAgent(IOS_LEGACY);
    const { getByTestId } = render(
      await UpdateRequiredPage({ searchParams: Promise.resolve({ p: "android" }) }),
    );
    expect(getByTestId("update-required-store-link").textContent).toBe("Update on the App Store");
  });

  it("an unrecognised platform parameter is ignored", async () => {
    asUserAgent(null);
    await expect(
      UpdateRequiredPage({ searchParams: Promise.resolve({ p: "https://evil.example" }) }),
    ).rejects.toThrow("REDIRECT:/");
  });

  it("with no minimum set, even a version-less app is sent home", async () => {
    vi.stubEnv("NATIVE_MIN_BUILD_ANDROID", "");
    asUserAgent(ANDROID_LEGACY);
    await expect(UpdateRequiredPage({})).rejects.toThrow("REDIRECT:/");
  });
});
