'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopCard } from './shop-card';
import { getPostedListingsFor, getPostedListingsForCloude, removePostedListing } from '@/lib/posted-listings';

// Loose identity check for "is this local draft the same shop as a real backend
// listing" — good enough to dedupe within a single category's results.
function shopSignature(shopName: string, city?: string) {
  return `${shopName.trim().toLowerCase()}|${(city ?? '').trim().toLowerCase()}`;
}

export type StaticShopCardItem = {
  id: string;
  shopName: string;
  categoryName: string;
  description?: string;
  image: string;
  city?: string;
  isNew?: boolean;
};

export function CategoryShopGrid({
  cloudeSlug,
  categorySlug,
  categoryName,
  staticItems,
  postAdHref,
}: {
  cloudeSlug: string;
  /** Omit to show shops from every category in the Cloude. */
  categorySlug?: string;
  categoryName: string;
  staticItems: StaticShopCardItem[];
  postAdHref: string;
}) {
  const [postedItems, setPostedItems] = useState<StaticShopCardItem[]>([]);

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

    setPostedItems(
      stillLocalOnly.map((p) => ({
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

  const allItems = [...postedItems, ...staticItems];

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
    <div className="grid grid-cols-2 gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {allItems.map((item) => (
        <ShopCard key={item.id} {...item} />
      ))}
    </div>
  );
}
