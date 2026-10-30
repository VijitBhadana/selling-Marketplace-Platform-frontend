// The live Cloude catalogue: the built-in one in cloudes-data.ts with the admin's
// changes from the backend (Admin panel → Cloudes) layered on top.
//
// - Built-in Cloudes keep their name, icon, groups and sub-tabs from cloudes-data.ts;
//   categories the admin deleted drop out, renamed ones take the new name, and new
//   ones are added to the Cloude's loose ("other") categories.
// - Cloudes the admin added are appended after the built-in ones.
// - If the backend can't be reached, the built-in catalogue is used unchanged.

import { api } from './api';
import { cloudes as builtInCloudes, type Cloude, type CloudeCategory } from './cloudes-data';

/** A row of GET /cloudes. */
export type RemoteCloude = {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  categories: { name: string; slug: string }[];
};

// prisma/seed.ts still creates the old "Jobs Cloude"; on the site Jobs & Freelancing
// lives under the 'software' slug, so this one is never shown.
export const RETIRED_CLOUDE_SLUGS = new Set(['jobs']);

const builtInSlugs = new Set(builtInCloudes.map((c) => c.slug));

export function isBuiltInCloude(slug: string) {
  return builtInSlugs.has(slug);
}

function withRemote(cloude: Cloude, remote: RemoteCloude): Cloude {
  const names = new Map(remote.categories.map((c) => [c.slug, c.name]));
  const known = new Set(cloude.categories.map((c) => c.slug));
  const added = remote.categories.filter((c) => !known.has(c.slug)).map((c) => ({ name: c.name, slug: c.slug }));
  const unchanged =
    added.length === 0 && cloude.categories.every((c) => names.get(c.slug) === c.name);
  if (unchanged) return cloude;

  const live = (items: CloudeCategory[]) =>
    items.filter((c) => names.has(c.slug)).map((c) => ({ ...c, name: names.get(c.slug)! }));

  const categories = live(cloude.categories);
  // New categories go before a trailing "Other Services / Products", which stays last.
  if (categories.at(-1)?.slug.startsWith('other')) categories.splice(categories.length - 1, 0, ...added);
  else categories.push(...added);

  const groups = cloude.groups?.map((g) => ({ ...g, items: live(g.items) })).filter((g) => g.items.length > 0);
  const goneGroups = new Set(cloude.groups?.filter((g) => !groups?.some((k) => k.slug === g.slug)).map((g) => g.slug));

  return {
    ...cloude,
    categories,
    groups,
    subTabs: cloude.subTabs?.filter((t) => !t.anchor || !goneGroups.has(t.anchor)),
  };
}

function customCloude(remote: RemoteCloude): Cloude {
  return {
    name: remote.name,
    slug: remote.slug,
    description: remote.description ?? '',
    icon: remote.icon || 'Layers',
    categories: remote.categories.map((c) => ({ name: c.name, slug: c.slug })),
    // Same browse layout as the built-in Cloudes: categories on the left, shops on the right.
    sidebarBrowse: true,
  };
}

export function mergeCatalogue(remote: unknown): Cloude[] {
  if (!Array.isArray(remote) || remote.length === 0) return builtInCloudes;
  const rows = remote as RemoteCloude[];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const builtIn = builtInCloudes.flatMap((c) => {
    const r = bySlug.get(c.slug);
    return r ? [withRemote(c, r)] : [];
  });
  const custom = rows
    .filter((r) => !builtInSlugs.has(r.slug) && !RETIRED_CLOUDE_SLUGS.has(r.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(customCloude);
  return [...builtIn, ...custom];
}

/** Server side: the live catalogue (cached for 60s like every /cloudes read). */
export async function getCatalogue(): Promise<Cloude[]> {
  return mergeCatalogue(await api.cloudes.list().catch(() => null));
}

export async function getCatalogueCloude(slug: string | undefined) {
  if (!slug) return undefined;
  return (await getCatalogue()).find((c) => c.slug === slug);
}
