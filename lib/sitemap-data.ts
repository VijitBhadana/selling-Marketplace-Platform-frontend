import { api, type SitemapEntry } from './api';

export const categoryKey = (cloudeSlug: string, categorySlug: string) => `${cloudeSlug}/${categorySlug}`;

// Live shops and open jobs for sitemap.xml, plus the categories that hold at least
// one of them. Hundreds of empty category pages read as thin content to Google, so
// only filled ones go in the sitemap and the rest are noindexed.
// filledCategories is null when the backend can't say (unreachable, or too old to
// send categories) — callers then treat every category as indexable, as before.
export async function getSitemapEntries(): Promise<{
  listings: SitemapEntry[];
  jobs: SitemapEntry[];
  filledCategories: Set<string> | null;
}> {
  const [listings, jobs] = await Promise.all([
    api.listings.sitemap().catch(() => null),
    api.jobs.sitemap().catch(() => null),
  ]);
  const all = [...(listings ?? []), ...(jobs ?? [])];
  const known = listings !== null && jobs !== null && all.every((e) => e.category);
  const filledCategories = known
    ? new Set(all.map((e) => categoryKey(e.category!.cloude.slug, e.category!.slug)))
    : null;
  return { listings: listings ?? [], jobs: jobs ?? [], filledCategories };
}
