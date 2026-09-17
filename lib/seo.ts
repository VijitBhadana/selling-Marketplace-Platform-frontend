import type { Metadata } from 'next';
import { SITE_NAME, absoluteUrl } from './site';

type PageSeo = {
  title: string;
  description: string;
  /** Canonical path — include the query string when the page is keyed by one (e.g. ?category=). */
  path: string;
  /** Hosted image for social previews; defaults to a generated /og card. */
  image?: string;
  /** Second line on the generated /og card. */
  ogSubtitle?: string;
  noindex?: boolean;
};

export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function ogImageUrl(title: string, subtitle?: string) {
  const qs = new URLSearchParams({ title });
  if (subtitle) qs.set('subtitle', subtitle);
  return `/og?${qs.toString()}`;
}

// Listing/product photos can be stored as base64 data URLs — never put those in
// <meta> tags or JSON-LD: they bloat the HTML and crawlers can't fetch them.
export function isPublicImageUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\//.test(url);
}

// Per-page metadata with a self-referencing canonical plus matching Open Graph /
// Twitter cards. Child metadata replaces (not merges) the root layout's
// openGraph/twitter objects, so every indexable page should go through this.
export function pageMetadata({ title, description, path, image, ogSubtitle, noindex }: PageSeo): Metadata {
  const desc = truncate(description, 160);
  const socialTitle = `${title} | ${SITE_NAME}`;
  const images = [image ?? ogImageUrl(title, ogSubtitle)];

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'en_IN', siteName: SITE_NAME, url: path, title: socialTitle, description: desc, images },
    twitter: { card: 'summary_large_image', title: socialTitle, description: desc, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export type JsonLdNode = Record<string, unknown>;

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
