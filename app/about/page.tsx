import { cloudes } from '@/lib/cloudes-data';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About DukanCloude',
  description:
    "DukanCloude brings every kind of local shop, product and service onto one platform — organised into 13 Cloudes, from handmade crafts to home tutors, wedding venues and repair services.",
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">About DukanCloude</h1>
      <p className="mt-4 text-ink-muted">
        DukanCloude is a multi-category marketplace, similar in concept to OLX, but built around the idea
        of "Cloudes" — sector-based groupings that bring both products and services onto a single
        platform. A buyer can purchase a product directly, or discover and contact a relevant service
        provider, across {cloudes.length} Cloudes covering everything from handmade crafts to
        healthcare discovery.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cloudes.map((c) => (
          <div key={c.slug} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-display text-sm font-bold text-ink">{c.name}</h2>
            <p className="mt-1 text-xs text-ink-muted">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
