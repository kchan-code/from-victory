/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // FV-731: tags server actions with this deployment so a WebView left open
  // across a ship can be recognized as stale. Keeping the previous deployment
  // alive to serve those old clients (Skew Protection) is a Vercel dashboard
  // setting — Project → Settings → Advanced — not something this file can turn on.
  ...(process.env.VERCEL_DEPLOYMENT_ID
    ? { deploymentId: process.env.VERCEL_DEPLOYMENT_ID }
    : {}),
  env: {
    // Inlined at build so the client error report can name its own build.
    // A commit SHA is not a secret. Empty in local dev.
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },
  // Next 15 stops reusing dynamic page segments from the client router cache
  // (staleTimes.dynamic default is 0; static stays 300). Next 14.2.35 reused
  // dynamic segments for 30s and static segments for 300s. Restore that window
  // so Link / router navigations keep the previous cache behavior.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No preload — irreversible once submitted to browser preload lists.
          // Add preload in a follow-up after the domain is finalised.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Report-Only: observe violations before enforcing (FV-170 follow-up).
          // frame-ancestors 'none' is enforced even in report-only mode
          // (belt-and-suspenders with X-Frame-Options above).
          // blob: in media-src/worker-src: pregame audio player + service worker.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
