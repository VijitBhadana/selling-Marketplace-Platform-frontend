import { BRAND_STYLE_ID, BRAND_THEME_TAG, brandThemeCss, DEFAULT_GLOW, type GlowLevel } from '@/lib/brand-theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function fetchTheme(): Promise<{ brandColor: string | null; glow: GlowLevel }> {
  try {
    const res = await fetch(`${API_URL}/settings/theme`, {
      // Cached, and busted by /api/revalidate-theme as soon as the admin saves.
      next: { revalidate: 300, tags: [BRAND_THEME_TAG] },
    });
    if (!res.ok) return { brandColor: null, glow: DEFAULT_GLOW };
    const data = await res.json();
    return { brandColor: data?.brandColor ?? null, glow: data?.glow ?? DEFAULT_GLOW };
  } catch {
    return { brandColor: null, glow: DEFAULT_GLOW }; // backend offline — keep the default palette
  }
}

/** Server-rendered, so the admin's colour is there on first paint (no blue flash). */
export async function BrandThemeStyle() {
  const { brandColor, glow } = await fetchTheme();
  const css = brandThemeCss(brandColor, glow);
  return <style id={BRAND_STYLE_ID} dangerouslySetInnerHTML={{ __html: css }} />;
}
