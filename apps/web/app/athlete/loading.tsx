// Skeleton shell for the athlete hub — matches header + ring + 3-card layout
// so the page doesn't shift on hydration. (FV-111: updated from old 2-card layout)
export default function AthleteLoading() {
  return (
    <main className="min-h-screen bg-onyx pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      <div className="px-5 pt-10 pb-8 sm:px-8 max-w-[640px] mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-[64px] w-[90px] rounded-md bg-cream/[0.06] animate-pulse" />
          <div className="h-[38px] w-[88px] rounded-pill bg-cream/[0.06] animate-pulse" />
        </div>

        {/* Ring + greeting skeleton */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-[80px] h-[80px] rounded-full bg-cream/[0.06] animate-pulse flex-none" />
          <div className="flex-1">
            <div className="h-7 w-[180px] rounded-sm bg-cream/[0.10] animate-pulse mb-2" />
            <div className="h-4 w-[140px] rounded-sm bg-cream/[0.06] animate-pulse" />
          </div>
        </div>

        {/* Card skeletons — 3 compact rows */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-hairline bg-charcoal px-5 py-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream/[0.07] flex-none" />
                <div className="flex-1">
                  <div className="h-2.5 w-[60px] rounded-sm bg-gold/[0.15] mb-1.5" />
                  <div className="h-5 w-[160px] rounded-sm bg-cream/[0.10] mb-1" />
                  <div className="h-3.5 w-[200px] rounded-sm bg-cream/[0.06]" />
                </div>
                <div className="w-4 h-4 rounded-sm bg-cream/[0.06] flex-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
