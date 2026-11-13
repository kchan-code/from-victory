/**
 * apple-app-site-association document (FV-630) — PURE, unit-tested.
 *
 * Associates exactly ONE path with the iOS app: /invite (the athlete invite
 * link, `https://www.fromvictoryapp.com/invite#code=...`). Every other URL on
 * the site keeps opening in Safari. Do not widen this without a privacy +
 * product review: anything listed here is handed to the native app instead
 * of the browser.
 *
 * App ID = <Apple Team ID>.<bundle id>. RELEASE GATE: confirm the team prefix
 * against the SIGNED archive before shipping, e.g.
 *   codesign -d --entitlements :- "From Victory.app" | grep application-identifier
 * The value below comes from apps/native/ios/App/ExportOptions.plist (teamID)
 * + PRODUCT_BUNDLE_IDENTIFIER and is a clue until that check passes (see
 * docs/fv-630-release-checklist.md).
 */

export const IOS_BUNDLE_ID = "com.fromvictoryapp.app";
export const APPLE_TEAM_ID = "CYQ2836PYN";
export const IOS_APP_ID = `${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`;

export function buildAppleAppSiteAssociation() {
  return {
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: [
            {
              "/": "/invite",
              comment: "Athlete invite link (code in the fragment).",
            },
          ],
        },
      ],
    },
  };
}
