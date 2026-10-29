// Single source of truth for the brand and public domain — used by metadata,
// sitemap.xml, robots.txt, JSON-LD and the generated OG images.
// NEXT_PUBLIC_SITE_URL overrides the URL per environment; when it's unset,
// production builds use the live domain and `next dev` uses localhost.

export const SITE_NAME = 'DukanCloude';
export const SITE_DOMAIN = 'dukancloude.com';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? `https://${SITE_DOMAIN}` : 'http://localhost:3000')
).replace(/\/+$/, '');

export const SITE_TAGLINE = 'Local Shops, Services, Jobs & Bookings Near You';

export const SITE_DESCRIPTION =
  "DukanCloude is India's local marketplace — discover shops, services, jobs and bookings near you across 13 Cloudes. Post a free ad in 2 minutes with OTP-verified sellers.";

// Other ways people write the brand — WebSite.alternateName in the JSON-LD.
export const SITE_ALTERNATE_NAMES = ['Dukan Cloude', 'DukanCloud', 'Dukan Cloud', SITE_DOMAIN];

// Official brand profiles — Organization.sameAs in the JSON-LD, so Google ties
// them to this site. Add each new profile URL here (no tracking params).
export const SITE_SOCIAL_LINKS = [
  'https://www.instagram.com/dukancloude',
  'https://www.facebook.com/profile.php?id=61593463500038',
];

export const SITE_KEYWORDS = [
  'DukanCloude',
  'Dukan Cloude',
  'DukanCloud',
  'Dukan Cloud',
  'dukancloude.com',
  'local marketplace India',
  'online dukan',
  'local shops near me',
  'services near me',
  'post free ad',
  'buy and sell online',
  'home tutor near me',
  'repair services near me',
  'jobs near me',
  'wedding venues',
  'property for rent',
  'OLX alternative',
];

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
