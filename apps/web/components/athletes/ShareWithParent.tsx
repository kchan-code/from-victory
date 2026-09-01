// client: navigator.share / clipboard — the 13-17 conversion mechanic.
"use client";

import { useState } from "react";

// FV-545 — "Send this to a parent". A minor cannot self-serve (parent is
// the buyer for 13-17), so the athlete page's under-18 path is a pure
// client-side share of the /parents page: native share sheet where the
// browser has one, copy-link fallback everywhere else. The share action
// collects and stores no athlete data — no form, no prefilled contact
// fields, no analytics event, nothing persisted. (That statement is
// scoped to this share action, not the complete product.) The shared
// payload is the /parents URL only.

const SHARE_PATH = "/parents";

export function ShareWithParent() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${SHARE_PATH}`;
    // Native share sheet when available (most mobile browsers).
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // User dismissed the sheet, or the share failed — fall through to
        // the clipboard so the tap still produces something useful.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (permissions, insecure context) — leave the
      // button as-is; the visible /parents link in the card body remains
      // the manual path.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center justify-center gap-2 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-6 py-3.5 min-h-[44px] text-[14px] transition-colors duration-base ease-out hover:bg-onyx active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
    >
      {copied ? "Link copied" : "Send this to a parent →"}
      <span className="sr-only" role="status">
        {copied ? "Parents page link copied to clipboard." : ""}
      </span>
    </button>
  );
}
