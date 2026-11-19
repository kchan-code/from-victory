/** @vitest-environment jsdom */
// FV-754: the web landing after a completed account deletion
// (/?account_deleted=1) clears what the device still holds for the account:
// the local name/sport entry, the saved session and the downloaded clips.
// A plain visit to / clears nothing.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));
const clearAthleteCache = vi.fn();
const clearPregameSession = vi.fn();
const clearOfflineAudioCaches = vi.fn(async () => undefined);
vi.mock("@/lib/pregame/athlete-cache", () => ({ clearAthleteCache: () => clearAthleteCache() }));
vi.mock("@/lib/pregame/session-cache", () => ({ clearPregameSession: () => clearPregameSession() }));
vi.mock("@/lib/audio/clear-audio-cache", () => ({
  clearOfflineAudioCaches: () => clearOfflineAudioCaches(),
}));

import { AccountDeletionNotice } from "@/components/landing/AccountDeletionNotice";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  search = "";
});

describe("AccountDeletionNotice device clearing (FV-754)", () => {
  it.each(["account_deleted=1", "account_deleted=1&google_play_cancel=1"])(
    "clears the local entry, the saved session and the audio on ?%s",
    (qs) => {
      search = qs;
      render(<AccountDeletionNotice />);
      expect(clearAthleteCache).toHaveBeenCalledOnce();
      expect(clearPregameSession).toHaveBeenCalledOnce();
      expect(clearOfflineAudioCaches).toHaveBeenCalledOnce();
    },
  );

  it.each(["", "account_deleted=0", "google_play_cancel=1"])(
    "clears nothing on a visit without the completed-deletion flag (?%s)",
    (qs) => {
      search = qs;
      render(<AccountDeletionNotice />);
      expect(clearAthleteCache).not.toHaveBeenCalled();
      expect(clearPregameSession).not.toHaveBeenCalled();
      expect(clearOfflineAudioCaches).not.toHaveBeenCalled();
    },
  );
});
