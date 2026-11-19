"use client";

import { useTransition } from "react";

import { manageSubscriptions } from "@/lib/native/play-billing";

type Props = {
  body: string;
};

export function GooglePlayDeleteNotice({ body }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="status"
      data-testid="signin-account-deleted-google-cancel-notice"
      className="mb-6 rounded-[10px] border border-hairline bg-charcoal px-4 py-4"
    >
      <p className="font-heading text-cream text-[20px] leading-tight mb-3">
        Account deleted
      </p>
      <p className="text-[14px] text-cream/80 leading-relaxed mb-4">{body}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await manageSubscriptions();
          })
        }
        className="w-full min-h-[44px] rounded-pill bg-gold text-onyx font-heading font-semibold text-[14px] border border-gold mb-3 disabled:opacity-60"
      >
        Open Google Play
      </button>
      <a
        href="/signin"
        className="block w-full min-h-[44px] rounded-pill border border-hairline text-cream text-[14px] font-heading font-semibold text-center leading-[44px] no-underline"
      >
        Done
      </a>
    </div>
  );
}
