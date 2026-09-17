'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, ShieldAlert, Store } from 'lucide-react';
import { getPostedListingById, type PostedListing } from '@/lib/posted-listings';
import { getCloudeBySlug } from '@/lib/cloudes-data';
import { withImageParams } from '@/lib/image-utils';
import { SmartImage } from '@/components/smart-image';
import { SellerContactActions } from './seller-contact-actions';
import { Skeleton, SkeletonGroup } from './skeleton';

// Renders the detail page for an ad posted through /post-ad in this browser
// (kept in localStorage). Used as a client-side fallback when a listing id
// isn't found in the static sample data.
export function PostedListingDetail({ id }: { id: string }) {
  const [listing, setListing] = useState<PostedListing | null | undefined>(undefined);

  useEffect(() => {
    setListing(getPostedListingById(id));
  }, [id]);

  // Server HTML and the first client render land here (localStorage isn't read yet).
  if (listing === undefined) return <ListingDetailSkeleton />;

  if (!listing) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Listing not found</h1>
        <p className="text-sm text-ink-muted">This ad may have been posted in a different browser, or has expired.</p>
        <Link href="/" className="mt-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink hover:opacity-90">
          Back to home
        </Link>
      </div>
    );
  }

  const cloude = getCloudeBySlug(listing.cloudeSlug);
  const postedAgo = new Date(listing.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-1.5">/</span>
        {cloude && (
          <>
            <Link href={`/cloudes/${cloude.slug}`} className="hover:text-brand">{cloude.name}</Link>
            <span className="mx-1.5">/</span>
          </>
        )}
        <span className="text-ink">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-brand-soft">
            <SmartImage
              src={withImageParams(listing.image, 'w=1200&q=80&auto=format&fit=crop')}
              alt={listing.title}
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
              className="object-cover"
            />
          </div>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              {listing.shopName && (
                <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-brand">
                  <Store size={12} /> {listing.shopName}
                </span>
              )}
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{listing.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                <span className="flex items-center gap-1"><MapPin size={14} /> {listing.city}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {postedAgo}</span>
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">{listing.categoryName}</span>
              </div>
            </div>
          </div>

          <p className="mt-2 font-display text-2xl font-extrabold text-brand">{listing.price}</p>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{listing.description || 'No description provided.'}</p>
          </div>
        </div>

        {/* Seller card */}
        <aside className="h-fit rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Seller</h2>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft font-display font-bold text-brand">
              {(listing.shopName || listing.title).trim().charAt(0).toUpperCase() || 'S'}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{listing.shopName || 'DukanCloude Seller'}</p>
              <p className="text-xs text-ink-muted">Posted {postedAgo} · {listing.city}</p>
            </div>
          </div>

          <SellerContactActions />

          <button className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-ink-muted hover:text-accent">
            <ShieldAlert size={13} /> Report this seller
          </button>
        </aside>
      </div>
    </div>
  );
}

function ListingDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading listing…" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="aspect-video w-full rounded-2xl bg-surface-hover" />
          <Skeleton className="mt-6 h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-3 h-7 w-32" />
          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
        </div>
        <div className="h-fit rounded-2xl border border-border bg-surface p-5">
          <Skeleton className="mb-4 h-4 w-16" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          </div>
          <Skeleton className="mt-5 h-10 w-full rounded-full" />
          <Skeleton className="mt-2 h-10 w-full rounded-full" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
