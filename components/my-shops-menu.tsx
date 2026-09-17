'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, Loader2, Store, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { withImageParams } from '@/lib/image-utils';
import { ListRowsSkeleton } from './skeleton';

type MyShop = {
  id: string;
  title: string;
  shopName: string | null;
  coverImageUrl: string | null;
  cloude: { name: string; slug: string };
  category: { name: string; slug: string };
  _count?: { products: number };
};

// Jobs & Freelancing: jobs are posted without a shop, so they're listed separately.
type MyJob = {
  id: string;
  title: string;
  category: { name: string };
  _count?: { applications: number };
};

// Takes no props — memoized so it doesn't re-render whenever Navbar re-renders
// for unrelated reasons (search input typing, scroll state, profile toggle).
export const MyShopsMenu = memo(function MyShopsMenu() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<MyShop[] | null>(null);
  const [jobs, setJobs] = useState<MyJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // id of the shop/job being deleted, or 'all' while "Delete all" runs.
  const [deleting, setDeleting] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open || shops !== null || !token) return;
    api.listings
      .mine(token)
      .then((data) => setShops(data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your shops.'));
  }, [open, shops, token]);

  // Refetched on every open so the response counts stay current.
  useEffect(() => {
    if (!open || !token) return;
    api.jobs
      .mine(token)
      .then((data) => setJobs(data))
      .catch(() => setJobs([]));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user || user.role !== 'SELLER') return null;

  // Leaves the page of something that no longer exists.
  function leaveIfViewing(paths: string[]) {
    if (paths.includes(pathname)) router.push('/');
    else router.refresh();
  }

  async function deleteShop(shop: MyShop) {
    if (!token || deleting) return;
    const name = shop.shopName || shop.title;
    if (!window.confirm(`Delete "${name}"? All its products, orders and chats will be deleted too. This cannot be undone.`)) return;
    setDeleting(shop.id);
    setError(null);
    try {
      await api.listings.remove(shop.id, token);
      setShops((prev) => prev?.filter((s) => s.id !== shop.id) ?? null);
      leaveIfViewing([`/listing/${shop.id}`]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the shop.');
    } finally {
      setDeleting(null);
    }
  }

  async function deleteJob(job: MyJob) {
    if (!token || deleting) return;
    if (!window.confirm(`Delete the job "${job.title}"? All its responses will be deleted too. This cannot be undone.`)) return;
    setDeleting(job.id);
    setError(null);
    try {
      await api.jobs.remove(job.id, token);
      setJobs((prev) => prev?.filter((j) => j.id !== job.id) ?? null);
      leaveIfViewing([`/jobs/${job.id}`]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the job.');
    } finally {
      setDeleting(null);
    }
  }

  async function deleteAll() {
    if (!token || deleting) return;
    const shopCount = shops?.length ?? 0;
    const jobCount = jobs?.length ?? 0;
    const what = [
      shopCount && `${shopCount} shop${shopCount === 1 ? '' : 's'} (with all their products)`,
      jobCount && `${jobCount} job post${jobCount === 1 ? '' : 's'} (with all their responses)`,
    ]
      .filter(Boolean)
      .join(' and ');
    if (!window.confirm(`Delete all ${what}? This cannot be undone.`)) return;
    setDeleting('all');
    setError(null);
    try {
      await Promise.all([api.listings.removeAllMine(token), api.jobs.removeAllMine(token)]);
      const paths = [...(shops ?? []).map((s) => `/listing/${s.id}`), ...(jobs ?? []).map((j) => `/jobs/${j.id}`)];
      setShops([]);
      setJobs([]);
      leaveIfViewing(paths);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete everything.');
      // Some of it may have gone — reload both lists.
      setShops(null);
      api.jobs.mine(token).then(setJobs).catch(() => setJobs([]));
    } finally {
      setDeleting(null);
    }
  }

  const hasAnything = (shops?.length ?? 0) + (jobs?.length ?? 0) > 0;

  return (
    <div className="sm:relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="My shops"
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          open ? 'border-brand bg-brand-soft text-brand' : 'border-border text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand'
        }`}
      >
        <Store size={17} />
      </button>

      {open && (
        <div className="absolute inset-x-4 top-full z-50 mt-1 rounded-2xl sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:mt-0 sm:w-80 border border-border bg-surface p-2 shadow-[0_16px_40px_-14px_rgb(0_0_0_/_0.3)]">
          <div className="flex items-center justify-between px-2.5 py-2">
            <p className="text-sm font-semibold text-ink">My shops</p>
            <Link href="/post-ad" onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              <PlusCircle size={12} /> Post a new one
            </Link>
          </div>
          <div className="my-1 h-px bg-border" />

          <div className="max-h-80 overflow-y-auto">
            {shops === null && !error && <ListRowsSkeleton label="Loading your shops…" />}
            {error && <p className="px-2.5 py-4 text-center text-xs text-accent">{error}</p>}
            {shops?.length === 0 && !jobs?.length && (
              <div className="px-2.5 py-4 text-center text-xs text-ink-muted">
                You haven't posted a shop yet.{' '}
                <Link href="/post-ad" onClick={() => setOpen(false)} className="font-medium text-brand hover:underline">
                  Post your first ad
                </Link>
                .
              </div>
            )}
            {shops?.map((shop) => (
              <div key={shop.id} className="flex items-center gap-1 rounded-xl transition-colors hover:bg-surface-hover">
              <Link
                href={`/listing/${shop.id}`}
                onClick={() => setOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-2.5"
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                  {shop.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={withImageParams(shop.coverImageUrl, 'w=80&q=70&auto=format&fit=crop')}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{shop.shopName || shop.title}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {shop.cloude.name.replace(' Cloude', '')} → {shop.category.name}
                    {typeof shop._count?.products === 'number' && ` · ${shop._count.products} product${shop._count.products === 1 ? '' : 's'}`}
                  </p>
                </div>
              </Link>
              <DeleteButton label={`Delete ${shop.shopName || shop.title}`} busy={deleting === shop.id} disabled={!!deleting} onClick={() => deleteShop(shop)} />
              </div>
            ))}

            {jobs && jobs.length > 0 && (
              <>
                <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">My job posts</p>
                {jobs.map((job) => {
                  const responses = job._count?.applications ?? 0;
                  return (
                    <div key={job.id} className="flex items-center gap-1 rounded-xl transition-colors hover:bg-surface-hover">
                    <Link
                      href={`/jobs/${job.id}#responses`}
                      onClick={() => setOpen(false)}
                      className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-2.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                        <Briefcase size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {job.category.name} · {responses} response{responses === 1 ? '' : 's'}
                        </p>
                      </div>
                    </Link>
                    <DeleteButton label={`Delete ${job.title}`} busy={deleting === job.id} disabled={!!deleting} onClick={() => deleteJob(job)} />
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {hasAnything && (
            <>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={deleteAll}
                disabled={!!deleting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
              >
                {deleting === 'all' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete all shops &amp; jobs
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

function DeleteButton({ label, busy, disabled, onClick }: { label: string; busy: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Delete"
      onClick={onClick}
      disabled={disabled}
      className="mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
