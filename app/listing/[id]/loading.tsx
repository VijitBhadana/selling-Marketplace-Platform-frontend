import { Skeleton, SkeletonGroup } from '@/components/skeleton';

// Buyers land straight on a shop's product catalog (the listing header is
// owner-only), so the placeholder is the products grid.
export default function Loading() {
  return (
    <SkeletonGroup label="Loading shop…" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border">
              <div className="aspect-square bg-surface-hover" />
              <div className="p-2">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="mt-1.5 h-3 w-1/2" />
                <Skeleton className="mt-2 h-6 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonGroup>
  );
}
