"use client";

import { useSearchParams } from "next/navigation";

export function AccountDeletionNotice() {
  const searchParams = useSearchParams();
  const showGoogleCancelNotice =
    searchParams?.get("account_deleted") === "1" &&
    searchParams?.get("google_play_cancel") === "1";

  if (!showGoogleCancelNotice) return null;

  return (
    <section
      role="status"
      data-testid="account-deleted-google-cancel-notice"
      className="mx-auto mt-6 max-w-[980px] rounded-[12px] border border-hairline bg-charcoal px-5 py-4"
    >
      <p className="font-body text-[14px] leading-relaxed text-cream/80">
        Your account is deleted. Your Google Play subscription could not be
        cancelled automatically. Please cancel it in Google Play.
      </p>
    </section>
  );
}
