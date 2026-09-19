import { ShopCardSkeleton, Skeleton, SkeletonGroup } from '@/components/skeleton';

// Mirrors the sidebar-browse layout every Cloude uses: breadcrumb, header card,
// category sidebar and the shop grid.
const CATEGORY_WIDTHS = [
  'w-20 lg:w-1/2',
  'w-28 lg:w-3/4',
  'w-24 lg:w-2/3',
  'w-32 lg:w-4/5',
  'w-20 lg:w-1/2',
  'w-24 lg:w-2/3',
  'w-28 lg:w-3/4',
  'w-16 lg:w-2/5',
];

export default function Loading() {
  return (
    <SkeletonGroup label="Loading shops…" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-8">
      <Skeleton className="mb-4 hidden h-4 w-40 md:block" />

      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5 md:mb-8 md:gap-4 md:p-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl md:h-14 md:w-14 md:rounded-2xl" />
          <div className="min-w-0">
            <Skeleton className="h-5 w-32 md:h-7 md:w-48" />
            <Skeleton className="mt-2 h-3 w-40 md:h-4 md:w-72" />
          </div>
        </div>
        <Skeleton className="h-8 w-16 shrink-0 rounded-full md:h-10 md:w-44" />
      </div>

      <Skeleton className="mb-4 h-12 rounded-2xl md:hidden" />

      <div className="grid gap-5 md:gap-8 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card lg:self-start">
          <div className="flex items-center gap-2 px-4 pt-4 lg:h-11 lg:bg-surface-hover lg:p-0">
            <Skeleton className="h-4 w-24 lg:hidden" />
            <Skeleton className="h-4 w-16 rounded-full lg:hidden" />
          </div>
          <div className="flex flex-wrap gap-2 p-4 pt-3 lg:flex-col lg:gap-1.5 lg:pt-4">
            {CATEGORY_WIDTHS.map((w, i) => (
              <Skeleton key={i} className={`h-8 rounded-full lg:rounded-lg ${w}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] md:gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </SkeletonGroup>
  );
}
