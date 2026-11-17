"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { clearOfflineAudioCaches } from "@/lib/audio/clear-audio-cache";
import { clearAthleteCache } from "@/lib/pregame/athlete-cache";
import { clearPregameSession } from "@/lib/pregame/session-cache";

export function AccountDeletionNotice() {
  const searchParams = useSearchParams();
  const accountDeleted = searchParams?.get("account_deleted") === "1";

  // FV-754: deleteAccount() redirects the web shell here with
  // account_deleted=1 on EVERY completed deletion (the native shell lands on
  // /signin, which clears itself). That param is the one landing-page moment
  // that is safe to drop what this device still holds for the account: the
  // downloaded clips, the local name/sport entry and the saved session.
  // Plain visits to / never clear.
  useEffect(() => {
    if (!accountDeleted) return;
    clearAthleteCache();
    clearPregameSession();
    void clearOfflineAudioCaches();
  }, [accountDeleted]);

  const showGoogleCancelFailureNotice =
    searchParams?.get("account_deleted") === "1" &&
    searchParams?.get("google_play_cancel") === "1";
  const showGoogleCancelUnknownNotice =
    searchParams?.get("account_deleted") === "1" &&
    searchParams?.get("google_play_cancel_unknown") === "1";

  if (!showGoogleCancelFailureNotice && !showGoogleCancelUnknownNotice) return null;

  return (
    <section
      role="status"
      data-testid="account-deleted-google-cancel-notice"
      className="mx-auto mt-6 max-w-[980px] rounded-[12px] border border-hairline bg-charcoal px-5 py-4"
    >
      <p className="font-body text-[14px] leading-relaxed text-cream/80">
        {showGoogleCancelFailureNotice
          ? "Your account is deleted. Your Google Play subscription could not be cancelled automatically. Please cancel it in Google Play."
          : "Your account is deleted. If you subscribed through Google Play, please check your subscriptions in Google Play and cancel it there."}
      </p>
    </section>
  );
}
