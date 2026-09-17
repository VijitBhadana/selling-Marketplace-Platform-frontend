import type { MetadataRoute } from 'next';
import { cloudes } from '@/lib/cloudes-data';
import { api } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';

// Rebuilt hourly so newly posted shops reach Google without a redeploy.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: Entry[] = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/jobs'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/post-ad'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  const cloudeRoutes = cloudes.flatMap((c): Entry[] => [
    { url: absoluteUrl(`/cloudes/${c.slug}`), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...c.categories.map((cat): Entry => ({
      url: absoluteUrl(`/cloudes/${c.slug}?category=${cat.slug}`),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    })),
  ]);

  // Real shops from the backend. If the API is unreachable (e.g. during the
  // build) the sitemap still ships the static pages and retries on revalidate.
  const listings = await api.listings.sitemap().catch(() => []);
  const listingRoutes = listings.map((l): Entry => ({
    url: absoluteUrl(`/listing/${l.id}`),
    lastModified: new Date(l.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...cloudeRoutes, ...listingRoutes];
}
