import { revalidateTag } from 'next/cache';
import { BRAND_THEME_TAG } from '@/lib/brand-theme';

// Called by the admin panel after saving a new brand colour, so every page
// picks it up on its next request. It only drops a cache entry — the colour
// itself is still read from the backend — so it needs no auth.
export async function POST() {
  revalidateTag(BRAND_THEME_TAG);
  return Response.json({ revalidated: true });
}
