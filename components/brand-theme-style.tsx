import { BRAND_STYLE_ID, BRAND_THEME_TAG, brandThemeCss } from '@/lib/brand-theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function fetchBrandColor(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/settings/theme`, {
      // Cached, and busted by /api/revalidate-theme as soon as the admin saves.
      next: { revalidate: 300, tags: [BRAND_THEME_TAG] },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.brandColor ?? null;
  } catch {
    return null; // backend offline — keep the default palette
  }
}

/** Server-rendered, so the admin's colour is there on first paint (no blue flash). */
export async function BrandThemeStyle() {
  const css = brandThemeCss(await fetchBrandColor());
  return <style id={BRAND_STYLE_ID} dangerouslySetInnerHTML={{ __html: css }} />;
}
