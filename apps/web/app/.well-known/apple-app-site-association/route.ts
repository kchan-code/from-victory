import { buildAppleAppSiteAssociation } from "@/lib/invites/apple-app-site-association";

/**
 * GET /.well-known/apple-app-site-association (FV-630).
 *
 * Apple's CDN fetches this over HTTPS with no redirects and expects JSON.
 * Served from www.fromvictoryapp.com (the apex 301s to www in vercel.json, so
 * only www is associated — see apps/native/ios/App/App/App.entitlements).
 * Static content; no cookies, no user data.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildAppleAppSiteAssociation()), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
