'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShopCard, type ShopCardProps } from './shop-card';
import { useCloudeBrowse, useCloudeQuery } from './cloude-browse';
import { getPostedListingsFor, getPostedListingsForCloude, removePostedListing } from '@/lib/posted-listings';

// Loose identity check for "is this local draft the same shop as a real backend
// listing" — good enough to dedupe within a single category's results.
function shopSignature(shopName: string, city?: string) {
  return `${shopName.trim().toLowerCase()}|${(city ?? '').trim().toLowerCase()}`;
}

export type StaticShopCardItem = ShopCardProps;

export function CategoryShopGrid({
  cloudeSlug,
  categorySlug,
  categoryName,
  staticItems,
  postAdHref,
  mobileHeading,
}: {
  cloudeSlug: string;
  /** Omit to show shops from every category in the Cloude. */
  categorySlug?: string;
  categoryName: string;
  staticItems: StaticShopCardItem[];
  postAdHref: string;
  /** Section title above the cards on phones (the desktop page header covers it). */
  mobileHeading?: { title: string; subtitle: string };
}) {
  const [postedItems, setPostedItems] = useState<StaticShopCardItem[]>([]);
  const query = useCloudeQuery();
  const { setQuery } = useCloudeBrowse();

  useEffect(() => {
    const posted = categorySlug
      ? getPostedListingsFor(cloudeSlug, categorySlug)
      : getPostedListingsForCloude(cloudeSlug);
    const backendSignatures = new Set(staticItems.map((it) => shopSignature(it.shopName, it.city)));

    const stillLocalOnly = posted.filter((p) => {
      const isNowOnBackend = backendSignatures.has(shopSignature(p.shopName || p.title, p.city));
      if (isNowOnBackend) removePostedListing(p.id);
      return !isNowOnBackend;
    });

    // Nearly always empty — keep the same array then, so the grid doesn't re-render for nothing.
    setPostedItems((prev) =>
      prev.length === 0 && stillLocalOnly.length === 0
        ? prev
        : stillLocalOnly.map((p) => ({
            id: p.id,
            shopName: p.shopName || p.title,
            categoryName: p.categoryName,
            description: p.description,
            image: p.image,
            city: p.city,
            isNew: true,
          })),
    );
  }, [cloudeSlug, categorySlug, staticItems]);

  const allItems = useMemo(() => [...postedItems, ...staticItems], [postedItems, staticItems]);
  // The phone search bar on the Cloude page narrows the cards as you type.
  const shownItems = useMemo(
    () =>
      query
        ? allItems.filter((it) =>
            [it.shopName, it.categoryName, it.description, it.city].some((f) => f?.toLowerCase().includes(query)),
          )
        : allItems,
    [allItems, query],
  );

  if (allItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-ink-muted">
        No shops posted yet in {categoryName} — be the first to{' '}
        <Link href={postAdHref} className="font-medium text-brand hover:underline">
          post an ad
        </Link>
        .
      </div>
    );
  }

  return (
    <>
      {mobileHeading && (
        <div className="mb-3 flex items-end justify-between gap-3 md:hidden">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 font-display text-base font-bold leading-tight text-ink">
              {mobileHeading.title}
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgb(var(--brand))]" />
            </h2>
            <p className="mt-0.5 truncate text-xs text-ink-muted">{mobileHeading.subtitle}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-brand">
            {shownItems.length} {shownItems.length === 1 ? 'store' : 'stores'}
          </span>
        </div>
      )}
      {shownItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-ink-muted">
          No stores match “{query}”.{' '}
          <button type="button" onClick={() => setQuery('')} className="font-medium text-brand hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] md:gap-4">
          {shownItems.map((item) => (
            <ShopCard key={item.id} {...item} cloudeSlug={cloudeSlug} />
          ))}
        </div>
      )}
    </>
  );
}
