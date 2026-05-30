// Skeleton shell for the athlete dashboard — matches the header + card layout
// so the page doesn't jump on hydration.
export default function AthleteLoading() {
  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-12">
          <div className="h-[60px] w-[105px] rounded-md bg-cream/[0.06] animate-pulse" />
          <div className="h-[38px] w-[88px] rounded-pill bg-cream/[0.06] animate-pulse" />
        </div>

        {/* Eyebrow + heading skeleton */}
        <div className="mb-10">
          <div className="h-3 w-[140px] rounded-sm bg-gold/[0.18] animate-pulse mb-3" />
          <div className="h-8 w-[260px] rounded-sm bg-cream/[0.08] animate-pulse mb-2" />
          <div className="h-8 w-[200px] rounded-sm bg-cream/[0.06] animate-pulse" />
        </div>

        {/* Primary card skeleton */}
        <div className="rounded-[18px] border border-hairline bg-charcoal p-5 mb-5 animate-pulse">
          <div className="h-3 w-[100px] rounded-sm bg-cream/[0.08] mb-4" />
          <div className="h-5 w-[220px] rounded-sm bg-cream/[0.10] mb-2" />
          <div className="h-4 w-[180px] rounded-sm bg-cream/[0.06] mb-5" />
          <div className="h-11 w-full rounded-pill bg-gold/[0.14]" />
        </div>

        {/* Secondary card skeleton */}
        <div className="rounded-[14px] border border-hairline bg-charcoal px-4 py-4 animate-pulse">
          <div className="h-4 w-[160px] rounded-sm bg-cream/[0.08]" />
        </div>
      </div>
    </main>
  );
}
