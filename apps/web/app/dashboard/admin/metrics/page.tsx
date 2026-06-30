import Image from "next/image";
import Link from "next/link";

import { isAdminEmail, requireAdminParent } from "@/lib/auth/admin";
import { getAdminMetrics } from "@/lib/admin/metrics";
import { createClient } from "@/lib/supabase/server";
import {
  EngagementTab,
  OverviewTab,
  RetentionTab,
  RevenueTab,
  TrustTab,
} from "@/components/admin/tabs";

// Hidden owner surface. requireAdminParent() returns 404 to every non-admin
// (including signed-in non-admin parents), so this never appears in nav and is
// not discoverable. Never indexed.
export const metadata = {
  title: "Owner Metrics · From Victory",
  robots: { index: false, follow: false },
};

// Always render fresh — metrics are point-in-time aggregates, never cached.
export const dynamic = "force-dynamic";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "engagement", label: "Engagement" },
  { id: "retention", label: "Retention" },
  { id: "revenue", label: "Revenue" },
  { id: "trust", label: "Safety & Trust" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const RANGES = [7, 30, 90] as const;

function parseTab(v: string | string[] | undefined): TabId {
  const s = Array.isArray(v) ? v[0] : v;
  return (TABS.find((t) => t.id === s)?.id ?? "overview") as TabId;
}

function parseRange(v: string | string[] | undefined): number {
  const s = Number(Array.isArray(v) ? v[0] : v);
  return RANGES.includes(s as (typeof RANGES)[number]) ? s : 30;
}

export default async function OwnerMetricsPage({
  searchParams,
}: {
  searchParams: { tab?: string; range?: string };
}) {
  // 1) Owner gate. 404 for anyone who isn't in ADMIN_EMAILS.
  await requireAdminParent();

  // 2) Audit log (GDPR Art. 30 record-of-processing). Who viewed which metric
  //    view, when. Minimum bar is a structured server log line; wire to a log
  //    drain before any external audit.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = isAdminEmail(user?.email) ? user?.email : "unknown";

  const tab = parseTab(searchParams.tab);
  const rangeDays = parseRange(searchParams.range);

  console.log(
    JSON.stringify({
      evt: "admin_metrics_view",
      at: new Date().toISOString(),
      admin: adminEmail,
      tab,
      rangeDays,
    }),
  );

  // 3) Aggregate, server-side, via service-role. No per-athlete row leaves here.
  const metrics = await getAdminMetrics(rangeDays);

  const hrefFor = (next: { tab?: TabId; range?: number }) => {
    const params = new URLSearchParams();
    params.set("tab", next.tab ?? tab);
    params.set("range", String(next.range ?? rangeDays));
    return `/dashboard/admin/metrics?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-onyx text-cream">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-10 bg-onyx/90 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/logo-icon.svg" alt="" width={48} height={28} className="h-7 w-auto" priority />
            <Image
              src="/logo-wordmark.svg"
              alt="From Victory"
              width={92}
              height={28}
              className="h-7 w-auto translate-y-[2px] hidden sm:block"
              priority
            />
            <span className="ml-1 font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-cobalt-bright border border-cobalt/30 bg-cobalt/[0.10] rounded-pill px-2.5 py-1">
              Owner metrics
            </span>
          </div>
          {/* Range picker */}
          <nav aria-label="Date range" className="flex items-center gap-1 bg-charcoal border border-hairline rounded-pill p-1">
            {RANGES.map((r) => {
              const active = r === rangeDays;
              return (
                <Link
                  key={r}
                  href={hrefFor({ range: r })}
                  aria-current={active ? "true" : undefined}
                  className={`font-mono font-semibold text-[11px] uppercase tracking-[0.1em] rounded-pill px-3 py-1.5 no-underline transition-colors ${
                    active ? "bg-gold text-onyx" : "text-cream/55 hover:text-cream"
                  }`}
                >
                  {r}d
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tab strip */}
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <nav aria-label="Metrics sections" className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <Link
                  key={t.id}
                  href={hrefFor({ tab: t.id })}
                  aria-current={active ? "page" : undefined}
                  className={`font-mono font-semibold uppercase tracking-[0.16em] text-[10px] whitespace-nowrap px-3.5 py-3 no-underline border-b-2 transition-colors ${
                    active
                      ? "text-gold border-gold"
                      : "text-cream/50 border-transparent hover:text-cream/80"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-8">
        <div className="flex items-baseline justify-between mb-7 gap-4 flex-wrap">
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[30px] sm:text-[36px] leading-none">
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <p className="font-mono text-[11px] text-cream/40 tabular-nums">
            Generated {new Date(metrics.generatedAt).toUTCString()}
          </p>
        </div>

        {tab === "overview" ? <OverviewTab m={metrics} /> : null}
        {tab === "engagement" ? <EngagementTab m={metrics} /> : null}
        {tab === "retention" ? <RetentionTab m={metrics} /> : null}
        {tab === "revenue" ? <RevenueTab m={metrics} /> : null}
        {tab === "trust" ? <TrustTab m={metrics} /> : null}

        <footer className="mt-12 pt-6 border-t border-hairline">
          <p className="font-body text-cream/35 text-[11px] leading-relaxed max-w-[680px]">
            Aggregate, server-side, owner-only. No journal content, no
            per-athlete rows, and no minor-identifying segment below {metrics.smallN}{" "}
            ever leave the server. True app-open DAU, pregame-audio usage, and
            full retention cohorts unlock with the proposed{" "}
            <span className="text-cream/55 font-mono">activity_events</span> table.
          </p>
        </footer>
      </div>
    </main>
  );
}
