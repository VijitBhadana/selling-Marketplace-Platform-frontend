'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Loader2,
  Lock,
  Pencil,
  RotateCcw,
  ShoppingBasket,
  Sparkles,
  Star,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_BRAND_COLOR, DEFAULT_GLOW, applyBrandColor, isHexColor, type GlowLevel } from '@/lib/brand-theme';
import { ErrorNote, LoadingRow, StatusBadge, cardClass, formatDate } from './shared';

const PRESETS = [
  { name: 'Sky blue', hex: '#007AFF' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Pink', hex: '#DB2777' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Cyan', hex: '#0891B2' },
  { name: 'Slate', hex: '#334155' },
  { name: 'Black', hex: '#111827' },
];

const GLOW_OPTIONS: { value: GlowLevel; title: string; text: string }[] = [
  { value: 'VIVID', title: 'Vivid Glow', text: 'Full brand halos on CTAs & pills' },
  { value: 'SUBTLE', title: 'Subtle Ring', text: 'Softer halos with quiet feedback' },
  { value: 'MINIMAL', title: 'Clean Minimal', text: 'Solid fills with zero bloom shadows' },
];

// 50 → 900, the shades a brand colour is stretched into across the site.
const TINTS = [50, 200, 400, 500, 700, 900] as const;

type Rgb = [number, number, number];

const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const mix = (a: Rgb, b: Rgb, amount: number): Rgb => a.map((v, i) => Math.round(v + (b[i] - v) * amount)) as Rgb;

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

/** The shade ramp the colour produces — 50 is the lightest tint, 900 the deepest. */
function tintFor(hex: string, step: number): string {
  const base = hexToRgb(hex);
  if (step === 500) return hex.toUpperCase();
  if (step < 500) return toHex(mix(base, [255, 255, 255], (500 - step) / 500));
  return toHex(mix(base, [0, 0, 0], (step - 500) / 900));
}

export function ThemeSection() {
  const { token } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [savedColor, setSavedColor] = useState<string | null>(null);
  const [savedGlow, setSavedGlow] = useState<GlowLevel>(DEFAULT_GLOW);
  const [history, setHistory] = useState<{ updatedBy: string | null; updatedAt: string | null }>({ updatedBy: null, updatedAt: null });
  const [color, setColor] = useState(DEFAULT_BRAND_COLOR);
  const [glow, setGlow] = useState<GlowLevel>(DEFAULT_GLOW);
  const [hexInput, setHexInput] = useState(DEFAULT_BRAND_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<'storefront' | 'catalog' | 'admin'>('storefront');

  useEffect(() => {
    if (!token) return;
    api.admin
      .theme(token)
      .then((t) => {
        setSavedColor(t.brandColor);
        setSavedGlow(t.glow ?? DEFAULT_GLOW);
        setHistory({ updatedBy: t.updatedBy, updatedAt: t.updatedAt });
        setColor(t.brandColor ?? DEFAULT_BRAND_COLOR);
        setHexInput(t.brandColor ?? DEFAULT_BRAND_COLOR);
        setGlow(t.glow ?? DEFAULT_GLOW);
      })
      .catch(() => setError('Could not load the current theme.'))
      .finally(() => setLoaded(true));
  }, [token]);

  const activeColor = savedColor ?? DEFAULT_BRAND_COLOR;

  // Live preview across the admin panel; leaving without saving restores what's saved.
  useEffect(() => {
    if (!loaded) return;
    applyBrandColor(color.toUpperCase() === DEFAULT_BRAND_COLOR && !savedColor ? null : color, glow);
  }, [color, glow, loaded, savedColor]);

  const restoreRef = useRef({ savedColor, savedGlow, loaded });
  restoreRef.current = { savedColor, savedGlow, loaded };
  useEffect(() => {
    return () => {
      const { savedColor: c, savedGlow: g, loaded: l } = restoreRef.current;
      if (l) applyBrandColor(c, g);
    };
  }, []);

  function pick(hex: string) {
    setColor(hex.toUpperCase());
    setHexInput(hex.toUpperCase());
    setNotice(null);
  }

  async function save(reset = false) {
    if (!token) return;
    const nextColor = reset ? null : color;
    const nextGlow = reset ? DEFAULT_GLOW : glow;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.admin.updateTheme({ brandColor: nextColor, glow: nextGlow }, token);
      setSavedColor(res.brandColor);
      setSavedGlow(res.glow);
      setHistory({ updatedBy: res.updatedBy, updatedAt: res.updatedAt });
      setColor(res.brandColor ?? DEFAULT_BRAND_COLOR);
      setHexInput(res.brandColor ?? DEFAULT_BRAND_COLOR);
      setGlow(res.glow);
      // Refresh the cached theme every storefront page is rendered with.
      await fetch('/api/revalidate-theme', { method: 'POST' }).catch(() => {});
      setNotice(reset ? 'Reset to the default sky blue.' : 'Saved — the whole site now uses this theme.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the theme.');
    } finally {
      setSaving(false);
    }
  }

  async function copyHex() {
    try {
      await navigator.clipboard.writeText(color.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — nothing to do
    }
  }

  // Mirrors brand-theme.ts: button text is white unless the colour is too light for it.
  const { ratio, level, ink } = useMemo(() => {
    const brand = hexToRgb(isHexColor(color) ? color : DEFAULT_BRAND_COLOR);
    const white = contrast(brand, [255, 255, 255]);
    const usesWhite = white >= 3;
    const best = usesWhite ? white : contrast(brand, [12, 20, 24]);
    return {
      ratio: best,
      level: best >= 7 ? 'AAA' : best >= 4.5 ? 'AA' : best >= 3 ? 'AA Large' : 'Fail',
      ink: usesWhite ? 'white' : 'dark',
    };
  }, [color]);

  if (!loaded) return <LoadingRow label="Loading theme…" />;

  const presetName = PRESETS.find((p) => p.hex === activeColor.toUpperCase())?.name ?? 'Custom';
  const dirty = color.toUpperCase() !== activeColor.toUpperCase() || glow !== savedGlow;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex flex-col gap-4 py-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Theme colour</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Active: {presetName} ({activeColor.toUpperCase()})
            </span>
          </div>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Pick the brand colour used for buttons, links, badges, interactive states and glowing accents across the whole site.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || (!savedColor && savedGlow === DEFAULT_GLOW)}
            className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <RotateCcw size={15} /> Reset to Default
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={!dirty || saving}
            className="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="my-4">
          <ErrorNote message={error} />
        </div>
      )}
      {notice && (
        <p className="my-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Presets */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Presets</h2>
                <p className="mt-0.5 text-xs text-ink-muted">Curated high-contrast accent schemes, tested in light and dark mode</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                {PRESETS.length} Ready Presets
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {PRESETS.map((p) => {
                const active = p.hex === color.toUpperCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => pick(p.hex)}
                    aria-pressed={active}
                    title={p.hex}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
                      active ? 'border-brand bg-brand-soft/40' : 'border-border hover:border-ink-muted/30'
                    }`}
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-white dark:border-white/20"
                      style={{ background: p.hex }}
                    >
                      {active && <Check size={18} strokeWidth={3} />}
                    </span>
                    <span className={`max-w-full truncate text-[11px] font-medium ${active ? 'text-brand' : 'text-ink-muted'}`}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Custom colour */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="font-display text-lg font-bold text-ink">Custom colour</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Specify any hex value to override the presets</p>

            <div className="mt-5 grid gap-3 lg:grid-cols-[auto_1fr_minmax(0,300px)]">
              <label
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-white shadow-inner ring-1 ring-inset ring-black/10 dark:ring-white/20"
                style={{ background: color }}
                title="Open the colour picker"
              >
                <Pencil size={16} className={ink === 'white' ? 'text-white' : 'text-ink'} />
                <span className="sr-only">Choose a colour</span>
                <input
                  type="color"
                  value={isHexColor(color) ? color : DEFAULT_BRAND_COLOR}
                  onChange={(e) => pick(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>

              <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-bg/60 pl-3 pr-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Hex</span>
                <input
                  value={hexInput}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setHexInput(v);
                    const withHash = v.startsWith('#') ? v : `#${v}`;
                    if (isHexColor(withHash)) pick(withHash);
                  }}
                  maxLength={7}
                  aria-label="Hex colour"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase tracking-wide text-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyHex}
                  aria-label="Copy hex"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg/60 p-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    level === 'Fail' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  {level === 'Fail' ? <Sparkles size={15} /> : <Check size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">Contrast: {ratio.toFixed(1)}:1</p>
                  <p className={`text-[11px] ${level === 'Fail' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {level === 'Fail' ? 'Too low for button text' : `WCAG ${level} with ${ink} text`}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-muted">
                  {ratio >= 7 ? 'High' : ratio >= 4.5 ? 'Good' : 'Low'}
                </span>
              </div>
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-ink-muted">System tint hierarchy</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TINTS.map((step) => {
                const shade = tintFor(isHexColor(color) ? color : DEFAULT_BRAND_COLOR, step);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => pick(shade)}
                    title={`Use ${shade}`}
                    className={`rounded-xl border p-2 transition-all hover:-translate-y-0.5 ${
                      step === 500 ? 'border-brand' : 'border-border hover:border-ink-muted/30'
                    }`}
                  >
                    <span className="block h-8 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/10" style={{ background: shade }} />
                    <span className="mt-1.5 block text-center text-[10px] font-semibold text-ink-muted">
                      {step}
                      {step === 500 && <span className="block text-brand">(Base)</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Glow */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="font-display text-lg font-bold text-ink">Atmosphere &amp; glow intensity</h2>
            <p className="mt-0.5 text-xs text-ink-muted">How strong the brand-tinted halos around buttons and pills are, site-wide</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {GLOW_OPTIONS.map((o) => {
                const active = glow === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setGlow(o.value);
                      setNotice(null);
                    }}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      active ? 'border-brand bg-brand-soft/30' : 'border-border hover:border-ink-muted/30'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{o.title}</span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? 'border-brand' : 'border-border'
                        }`}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-ink-muted">{o.text}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Save bar */}
          <section className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-5`}>
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Clock size={14} />
              {history.updatedAt ? (
                <span>
                  Last saved: {formatDate(history.updatedAt, true)}
                  {history.updatedBy ? (
                    <>
                      {' by '}
                      <span className="font-semibold text-ink">{history.updatedBy}</span>
                    </>
                  ) : null}
                </span>
              ) : (
                <span>Using the built-in default theme</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => save()}
              disabled={!dirty || saving}
              className="flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-ink transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save colour
            </button>
          </section>
        </div>

        {/* Preview — uses the live brand variables, so it shows exactly what the site will look like. */}
        <aside className={`${cardClass} h-fit p-5 sm:p-6 xl:sticky xl:top-24`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Preview</h2>
              <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${dirty ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {dirty ? 'Not saved yet' : 'Live on the site'}
              </p>
            </div>
            <div className="flex rounded-xl border border-border bg-bg/60 p-1 text-xs font-semibold">
              {(['storefront', 'catalog', 'admin'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPreview(t)}
                  className={`rounded-lg px-2.5 py-1.5 capitalize transition-colors ${
                    preview === t ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {t === 'admin' ? 'Admin UI' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-border bg-bg p-4">
            {preview === 'storefront' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-ink">DukanCloude</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-brand">
                    <Lock size={14} />
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                  <Sparkles size={11} /> Featured shop
                </span>
                <p className="text-sm text-ink-muted">
                  Fresh groceries near you. <span className="font-semibold text-brand">View offers</span>
                </p>
                <div className="flex gap-2">
                  <span className="flex h-10 flex-1 items-center justify-center rounded-xl bg-brand text-xs font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/calc(0.9*var(--glow)))]">
                    Post Your Ad
                  </span>
                  <span className="flex h-10 flex-1 items-center justify-center rounded-xl border border-brand text-xs font-semibold text-brand">
                    Log in
                  </span>
                </div>
              </>
            )}

            {preview === 'catalog' && (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-ink">DC</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">Sample shop card</p>
                    <p className="truncate text-xs text-ink-muted">Sector 14 · 1.2 km away</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Open now
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <Star size={13} className="fill-amber-400 text-amber-400" /> 4.9
                    <span className="font-normal text-ink-muted">(sample rating)</span>
                  </span>
                  <span className="text-xs font-semibold text-brand">Visit store ›</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <span className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-brand-ink">Active filter</span>
                  <span className="rounded-full border border-brand px-3 py-1.5 text-[11px] font-semibold text-brand">Outline pill</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <ShoppingBasket size={13} />
                  </span>
                </div>
              </>
            )}

            {preview === 'admin' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-ink">
                    <Check size={13} /> Primary action
                  </span>
                  <span className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-ink">Secondary</span>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-[11px] font-semibold text-ink-muted">Buyers</p>
                  <p className="mt-1 font-display text-2xl font-bold text-ink">128</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover">
                    <div className="h-full w-2/3 rounded-full bg-brand" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <span className="text-xs text-ink">Account status</span>
                  <StatusBadge user={{ isSuspended: false, suspendedBy: null }} />
                </div>
              </>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
            Sample content styled with the colour above — nothing here is a live listing.
          </p>
        </aside>
      </div>
    </div>
  );
}
