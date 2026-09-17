// Admin-chosen brand colour. globals.css defines the default --brand palette;
// when the admin picks a colour, this builds a stylesheet that overrides those
// variables for both the light and dark themes, so every `bg-brand`,
// `text-brand`, `border-brand`, `bg-brand-soft`... across the site follows it.

export const DEFAULT_BRAND_COLOR = '#007AFF';
export const BRAND_STYLE_ID = 'brand-theme';
export const BRAND_THEME_TAG = 'brand-theme';

type Rgb = [number, number, number];

const LIGHT_BG: Rgb = [255, 255, 255];
const DARK_BG: Rgb = [14, 18, 24];
const LIGHT_INK: Rgb = [255, 255, 255];
const DARK_INK: Rgb = [12, 20, 24];

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: Rgb, b: Rgb, amountOfB: number): Rgb {
  return a.map((v, i) => Math.round(v + (b[i] - v) * amountOfB)) as Rgb;
}

function luminance([r, g, b]: Rgb) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** White text on the brand colour, unless the colour is too light for it (yellow, pastel...). */
function inkFor(bg: Rgb): Rgb {
  return contrast(bg, LIGHT_INK) >= 3 ? LIGHT_INK : DARK_INK;
}

const triplet = (c: Rgb) => c.join(' ');

/** CSS overriding the brand variables, or '' to keep the built-in palette. */
export function brandThemeCss(hex: string | null | undefined): string {
  if (!isHexColor(hex)) return '';
  const brand = hexToRgb(hex);
  // Very dark picks are lifted in dark mode so they stay visible on the dark background.
  const darkBrand = luminance(brand) < 0.12 ? mix(brand, LIGHT_BG, 0.35) : mix(brand, LIGHT_BG, 0.12);

  return [
    `html:root{--brand:${triplet(brand)};--brand-soft:${triplet(mix(brand, LIGHT_BG, 0.86))};` +
      `--brand-ink:${triplet(inkFor(brand))};--scrollbar-thumb-hover:${triplet(brand)}}`,
    `html.dark{--brand:${triplet(darkBrand)};--brand-soft:${triplet(mix(darkBrand, DARK_BG, 0.8))};` +
      `--brand-ink:${triplet(inkFor(darkBrand))};--scrollbar-thumb-hover:${triplet(darkBrand)}}`,
  ].join('\n');
}

/** Applies a colour to the open page immediately (the admin's live preview / save). */
export function applyBrandColor(hex: string | null) {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(BRAND_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = BRAND_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = brandThemeCss(hex);
}
