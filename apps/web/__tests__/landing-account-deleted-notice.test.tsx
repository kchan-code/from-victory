/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const useSearchParamsMock = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

import { AccountDeletionNotice } from "@/components/landing/AccountDeletionNotice";

afterEach(() => {
  cleanup();
  useSearchParamsMock.mockReset();
});

describe("Landing page Google-cancel deletion notice", () => {
  it("renders the notice when both account_deleted and google_play_cancel flags are set", async () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("account_deleted=1&google_play_cancel=1"),
    );
    render(<AccountDeletionNotice />);

    const notice = screen.getByTestId("account-deleted-google-cancel-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(
      "Your account is deleted. Your Google Play subscription could not be cancelled automatically. Please cancel it in Google Play.",
    );
  });

  it("does not render the notice without both flags", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("account_deleted=1"));
    render(<AccountDeletionNotice />);
    expect(
      screen.queryByTestId("account-deleted-google-cancel-notice"),
    ).toBeNull();
  });

  it("renders the softer notice for uncertain Google status", async () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("account_deleted=1&google_play_cancel_unknown=1"),
    );
    render(<AccountDeletionNotice />);
    expect(
      screen.getByTestId("account-deleted-google-cancel-notice"),
    ).toHaveTextContent(
      "Your account is deleted. If you subscribed through Google Play, please check your subscriptions in Google Play and cancel it there.",
    );
  });
});
