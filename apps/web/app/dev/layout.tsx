import { notFound } from "next/navigation";

// Production gate for /dev/** routes.
//
// `/dev/*` hosts internal showcase pages (component primitives, future
// design previews) that should never be reachable on the live site.
// `noindex` keeps them out of search but doesn't prevent direct-URL hits;
// this gate makes the route tree return 404 on Vercel production.
//
// Why VERCEL_ENV and not NODE_ENV:
//   - Vercel preview deploys run with NODE_ENV=production but
//     VERCEL_ENV=preview — we want /dev/* visible there for PR review.
//   - Local dev has no VERCEL_ENV set — visible.
//   - Local `npm run build && npm run start` has no VERCEL_ENV — visible.
//   - Only Vercel production (VERCEL_ENV=production) returns 404.
//
// reason: Vercel is the only production target per CLAUDE.md. If we ever
// add a non-Vercel production deploy path (self-host, alt host), update
// this gate to also block on (NODE_ENV === 'production' && !VERCEL_ENV).

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }
  return children;
}
