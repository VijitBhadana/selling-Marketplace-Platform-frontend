// Client-side cache of ads posted through /post-ad. The backend is the source of
// truth once connected; this lets freshly posted shop cards show up immediately
// in this browser even when running against static demo data.

export type PostedListing = {
  id: string;
  title: string;
  description: string;
  shopName: string;
  price: string;
  city: string;
  pincode?: string;
  cloudeSlug: string;
  cloudeName: string;
  categorySlug: string;
  categoryName: string;
  image: string;
  postedAt: number;
};

const KEY = 'cloudmark:postedListings';

export function getPostedListings(): PostedListing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PostedListing[]) : [];
  } catch {
    return [];
  }
}

export function getPostedListingsFor(cloudeSlug: string, categorySlug: string): PostedListing[] {
  return getPostedListings().filter((l) => l.cloudeSlug === cloudeSlug && l.categorySlug === categorySlug);
}

export function getPostedListingsForCloude(cloudeSlug: string): PostedListing[] {
  return getPostedListings().filter((l) => l.cloudeSlug === cloudeSlug);
}

export function getPostedListingById(id: string): PostedListing | null {
  return getPostedListings().find((l) => l.id === id) ?? null;
}

export function addPostedListing(listing: PostedListing) {
  if (typeof window === 'undefined') return;
  const all = getPostedListings();
  all.unshift(listing);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage full or unavailable — non-critical, the ad still "published" for this session
  }
}

// Drops a local-only draft once it's been confirmed to exist for real on the
// backend (or was posted again successfully), so it stops double-rendering
// next to the real, shared listing.
export function removePostedListing(id: string) {
  if (typeof window === 'undefined') return;
  const all = getPostedListings().filter((l) => l.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // non-critical
  }
}
