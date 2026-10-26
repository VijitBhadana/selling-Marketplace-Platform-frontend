import type { MetadataRoute } from 'next';
import { cloudes } from '@/lib/cloudes-data';
import { categoryKey, getSitemapEntries } from '@/lib/sitemap-data';
import { absoluteUrl } from '@/lib/site';

// Rebuilt hourly so newly posted shops reach Google without a redeploy.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // /jobs is left out: it shows demo jobs and is noindexed. Real jobs are listed below.
  const staticRoutes: Entry[] = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/post-ad'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    ...['/privacy-policy', '/terms', '/refund-policy', '/shipping-policy'].map(
      (path): Entry => ({ url: absoluteUrl(path), lastModified: now, changeFrequency: 'yearly', priority: 0.2 }),
    ),
  ];

  // Real shops and jobs from the backend. If the API is unreachable (e.g. during the
  // build) the sitemap still ships the static pages and retries on revalidate.
  const { listings, jobs, filledCategories } = await getSitemapEntries();

  const cloudeRoutes = cloudes.flatMap((c): Entry[] => [
    { url: absoluteUrl(`/cloudes/${c.slug}`), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...c.categories
      .filter((cat) => !filledCategories || filledCategories.has(categoryKey(c.slug, cat.slug)))
      .map((cat): Entry => ({
        url: absoluteUrl(`/cloudes/${c.slug}?category=${cat.slug}`),
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      })),
  ]);

  const listingRoutes = listings.map((l): Entry => ({
    url: absoluteUrl(`/listing/${l.id}`),
    lastModified: new Date(l.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const jobRoutes = jobs.map((j): Entry => ({
    url: absoluteUrl(`/jobs/${j.id}`),
    lastModified: new Date(j.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...cloudeRoutes, ...listingRoutes, ...jobRoutes];
}
