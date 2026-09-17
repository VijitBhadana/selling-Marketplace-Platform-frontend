import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { sampleListings } from '@/lib/sample-listings';
import { ListingCard } from '@/components/listing-card';
import { pageMetadata, truncate } from '@/lib/seo';

type Props = { searchParams: { q?: string } };

// Internal search results are thin, near-duplicate pages — keep them out of
// the index, but let crawlers follow the listing links on them.
export function generateMetadata({ searchParams }: Props): Metadata {
  const q = truncate(searchParams.q ?? '', 60);
  return pageMetadata({
    title: q ? `Search results for "${q}"` : 'Search listings',
    description: 'Search local shops, products, services and jobs on DukanCloude.',
    path: '/search',
    noindex: true,
  });
}

export default function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q ?? '').trim();
  const results = q
    ? sampleListings.filter((l) => l.title.toLowerCase().includes(q.toLowerCase()))
    : sampleListings;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2 text-ink-muted">
        <Search size={18} />
        <h1 className="font-display text-xl font-bold text-ink">
          {q ? `Results for "${q}"` : 'All listings'}
        </h1>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-ink-muted">
          No listings matched "{q}". Try a different search term, or browse a Cloude from the menu.
        </div>
      )}
    </div>
  );
}
