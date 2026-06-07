// Skeleton shell for the parent dashboard — matches the header + athlete-list
// layout so the page doesn't jump on hydration.
export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[960px]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-12">
          <div className="h-[60px] w-[105px] rounded-md bg-cream/[0.06] animate-pulse" />
          <div className="h-[38px] w-[88px] rounded-pill bg-cream/[0.06] animate-pulse" />
        </div>

        {/* Section heading skeleton */}
        <div className="mb-6">
          <div className="h-3 w-[100px] rounded-sm bg-gold/[0.18] animate-pulse mb-3" />
          <div className="h-7 w-[200px] rounded-sm bg-cream/[0.08] animate-pulse" />
        </div>

        {/* Athlete card skeletons — two rows (name+actions, then rhythm) to
            match the real card height and avoid a layout jump on hydration. */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[14px] border border-hairline bg-charcoal px-5 py-4 mb-3 animate-pulse"
          >
            {/* Top row: name + actions */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-4 w-[120px] rounded-sm bg-cream/[0.10] mb-2" />
                <div className="h-3 w-[80px] rounded-sm bg-cream/[0.06]" />
              </div>
              <div className="h-[34px] w-[72px] rounded-pill bg-cream/[0.06]" />
            </div>
            {/* Rhythm row: ring + copy */}
            <div className="flex items-center gap-4 pt-4 border-t border-hairline">
              <div className="h-16 w-16 rounded-full bg-cream/[0.06]" />
              <div>
                <div className="h-2.5 w-[90px] rounded-sm bg-gold/[0.14] mb-2" />
                <div className="h-3.5 w-[130px] rounded-sm bg-cream/[0.08]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
