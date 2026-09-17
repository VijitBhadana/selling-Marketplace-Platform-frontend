import { Skeleton, SkeletonGroup } from '@/components/skeleton';

// Job details are fetched uncached on every request — mirror the header card,
// skills / description sections and the salary + apply panel.
export default function Loading() {
  return (
    <SkeletonGroup label="Loading job…" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-4 w-64 max-w-full" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="mt-3 h-7 w-2/3" />
                <Skeleton className="mt-2 h-4 w-40" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {['w-20', 'w-24', 'w-28', 'w-32'].map((w) => (
                <Skeleton key={w} className={`h-7 rounded-full ${w}`} />
              ))}
            </div>
            <div className="mt-4 flex gap-5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-3 flex flex-wrap gap-2">
              {['w-16', 'w-24', 'w-20', 'w-28', 'w-16'].map((w, i) => (
                <Skeleton key={i} className={`h-8 rounded-lg ${w}`} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-5/6" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        </div>

        <div className="lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-6 w-40" />
            <Skeleton className="mt-2 h-3 w-48" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-full" />
              <Skeleton className="h-9 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonGroup>
  );
}
