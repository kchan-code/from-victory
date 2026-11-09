/**
 * FV-630 — apple-app-site-association: narrow (only /invite), correct app ID,
 * served as JSON.
 */
import { describe, expect, it } from "vitest";

import { GET } from "@/app/.well-known/apple-app-site-association/route";
import {
  IOS_APP_ID,
  buildAppleAppSiteAssociation,
} from "@/lib/invites/apple-app-site-association";

describe("apple-app-site-association", () => {
  it("associates exactly one app and exactly one path", () => {
    const doc = buildAppleAppSiteAssociation();
    expect(Object.keys(doc)).toEqual(["applinks"]);
    expect(doc.applinks.details).toHaveLength(1);
    const [detail] = doc.applinks.details;
    expect(detail!.appIDs).toEqual([IOS_APP_ID]);
    expect(detail!.components).toEqual([
      expect.objectContaining({ "/": "/invite" }),
    ]);
    // No wildcards that would hand other site URLs to the app.
    expect(JSON.stringify(doc)).not.toContain("*");
  });

  it("app ID is <team>.<bundle id> matching the native project", () => {
    expect(IOS_APP_ID).toMatch(/^[A-Z0-9]{10}\.com\.fromvictoryapp\.app$/);
  });

  it("route serves JSON with no redirect", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual(buildAppleAppSiteAssociation());
  });
});
