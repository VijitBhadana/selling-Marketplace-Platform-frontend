// Loading placeholders. Pure markup — no state, effects or client JS — so they
// cost nothing to render and work in server components (loading.tsx, Suspense
// fallbacks) and client components alike. A group pulses as one unit: a single
// opacity animation the browser runs on the compositor, instead of one per
// block. The prefers-reduced-motion rule in globals.css stills it.

/** One placeholder block. Defaults to `rounded-md` unless a `rounded-*` class is passed. */
export function Skeleton({ className = '' }: { className?: string }) {
  const radius = className.includes('rounded') ? '' : 'rounded-md ';
  return <div className={`${radius}bg-surface-hover ${className}`} />;
}

/** Pulses its blocks together and announces the loading state to screen readers. */
export function SkeletonGroup({
  label = 'Loading…',
  className = '',
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className={`animate-pulse ${className}`}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// Same shell as ShopCard: photo band, overlapping avatar, name/category, two buttons.
export function ShopCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="aspect-[16/10] w-full bg-surface-hover" />
      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div className="-mt-6 mb-2 h-12 w-12 rounded-2xl border-4 border-surface bg-surface-hover" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-2/3" />
        <div className="mt-auto flex gap-2 pt-4">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Same shell as JobCard: gradient band, avatar, title/company, chips, salary, actions.
export function JobCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="h-20 w-full bg-surface-hover" />
      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div className="-mt-6 mb-2 h-12 w-12 rounded-2xl border-4 border-surface bg-surface-hover" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-2/5" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <Skeleton className="mt-3 h-3 w-1/2" />
        <div className="mt-auto flex gap-2 pt-4">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Rows for the navbar dropdowns (shops, chats, notifications): thumbnail + two lines.
export function ListRowsSkeleton({ count = 3, label }: { count?: number; label?: string }) {
  return (
    <SkeletonGroup label={label} className="flex flex-col">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

// Centered card used by the login / register / verify-OTP pages.
export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-bg px-4 py-14 sm:px-6">
      <SkeletonGroup className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <div className="mb-7 flex flex-col items-center">
            <Skeleton className="mb-4 h-11 w-11 rounded-xl" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="mt-2.5 h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: fields }, (_, i) => (
              <div key={i}>
                <Skeleton className="mb-1.5 h-3 w-20" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="mx-auto mt-6 h-4 w-56" />
      </SkeletonGroup>
    </div>
  );
}
