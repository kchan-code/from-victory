/**
 * Text a parent shares with an athlete (FV-686).
 *
 * Approved order: install the app first, then tap the link, then the
 * typed-code fallback. The athlete's name stays out of this message.
 * No em dashes.
 */

type SharePurpose = "invite" | "recovery";

export function buildInviteShareText(input: {
  purpose: SharePurpose;
  url: string;
  displayCode: string;
}): string {
  const install = "1. Get the From Victory app from the App Store or Google Play.";
  const fallback = `If the app doesn't open, open From Victory, tap I have an invite, and enter this code: ${input.displayCode}`;

  if (input.purpose === "recovery") {
    return [
      "Here's your From Victory password reset.",
      install,
      "2. Then tap this link on your phone. Your username stays the same.",
      input.url,
      fallback,
    ].join("\n");
  }

  return [
    "Here's your From Victory invite.",
    install,
    "2. Then tap this link on your phone to set up your account:",
    input.url,
    fallback,
  ].join("\n");
}
