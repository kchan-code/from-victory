/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { manageSubscriptionsMock } = vi.hoisted(() => ({
  manageSubscriptionsMock: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/native/play-billing", () => ({
  manageSubscriptions: manageSubscriptionsMock,
}));

import { GooglePlayDeleteNotice } from "@/components/auth/GooglePlayDeleteNotice";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GooglePlayDeleteNotice", () => {
  it("renders the locked heading, body, and controls", () => {
    render(
      <GooglePlayDeleteNotice body="Your account is deleted. Please cancel in Google Play." />,
    );

    expect(screen.getByText("Account deleted")).toBeInTheDocument();
    expect(
      screen.getByText("Your account is deleted. Please cancel in Google Play."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Google Play" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Done" })).toHaveAttribute("href", "/signin");
  });

  it("opens Google Play when tapped", async () => {
    render(<GooglePlayDeleteNotice body="Delete notice" />);

    fireEvent.click(screen.getByRole("button", { name: "Open Google Play" }));
    await waitFor(() => expect(manageSubscriptionsMock).toHaveBeenCalledTimes(1));
  });
});
