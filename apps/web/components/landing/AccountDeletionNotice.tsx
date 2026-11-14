"use client";

import { useSearchParams } from "next/navigation";

export function AccountDeletionNotice() {
  const searchParams = useSearchParams();
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
