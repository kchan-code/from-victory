// Skeleton for the owner metrics dashboard. Mirrors the top-bar + KPI-grid
// layout so there is minimal layout shift on load. animate-pulse pattern from
// app/dashboard/loading.tsx.
export default function Loading() {
  return (
    <main className="min-h-screen bg-onyx">
      <div className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="h-7 w-40 rounded bg-cream/[0.06] animate-pulse" />
          <div className="h-8 w-32 rounded-pill bg-cream/[0.06] animate-pulse" />
        </div>
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 flex gap-4 pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-20 rounded bg-cream/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-8">
        <div className="h-9 w-48 rounded bg-cream/[0.06] animate-pulse mb-7" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[132px] rounded-xl bg-charcoal border border-hairline animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
