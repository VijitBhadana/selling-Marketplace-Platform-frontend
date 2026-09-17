import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    // Private pages (login, OTP, bucket list, search results) opt out with a
    // noindex meta tag rather than Disallow — a disallowed URL is never
    // crawled, so Google wouldn't see the noindex and could still list it.
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
