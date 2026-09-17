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
    <SkeletonGroup label="Loading shops…" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-4 w-40" />

      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-4 w-56 sm:w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-full sm:w-44" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card lg:self-start">
          <div className="h-11 bg-surface-hover" />
          <div className="flex flex-wrap gap-2 p-4 lg:flex-col lg:gap-1.5">
            {CATEGORY_WIDTHS.map((w, i) => (
              <Skeleton key={i} className={`h-8 rounded-lg ${w}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {Array.from({ length: 6 }, (_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </SkeletonGroup>
  );
}
