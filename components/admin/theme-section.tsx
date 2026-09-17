'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, RotateCcw, ShoppingBasket, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_BRAND_COLOR, applyBrandColor, isHexColor } from '@/lib/brand-theme';
import { ErrorNote, LoadingRow, SectionHeader, cardClass, inputClass } from './shared';

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

export function ThemeSection() {
  const { token } = useAuth();
  const [saved, setSaved] = useState<string | null | undefined>(undefined);
  const [color, setColor] = useState(DEFAULT_BRAND_COLOR);
  const [hexInput, setHexInput] = useState(DEFAULT_BRAND_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.settings
      .theme()
      .then((t) => {
        setSaved(t.brandColor);
        setColor(t.brandColor ?? DEFAULT_BRAND_COLOR);
        setHexInput(t.brandColor ?? DEFAULT_BRAND_COLOR);
      })
      .catch(() => {
        setSaved(null);
        setError('Could not load the current colour.');
      });
  }, []);

  const savedColor = saved ?? DEFAULT_BRAND_COLOR;

  // Live preview across the admin panel; leaving without saving restores the saved colour.
  useEffect(() => {
    if (saved === undefined) return;
    applyBrandColor(color.toUpperCase() === DEFAULT_BRAND_COLOR && !saved ? null : color);
  }, [color, saved]);

  const savedRef = useRef(saved);
  savedRef.current = saved;
  useEffect(() => {
    return () => {
      if (savedRef.current !== undefined) applyBrandColor(savedRef.current);
    };
  }, []);

  function pick(hex: string) {
    setColor(hex.toUpperCase());
    setHexInput(hex.toUpperCase());
    setNotice(null);
  }

  async function save(next: string | null) {
    if (!token) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.admin.updateTheme(next, token);
      setSaved(res.brandColor);
      setColor(res.brandColor ?? DEFAULT_BRAND_COLOR);
      setHexInput(res.brandColor ?? DEFAULT_BRAND_COLOR);
      // Refresh the cached colour every storefront page is rendered with.
      await fetch('/api/revalidate-theme', { method: 'POST' }).catch(() => {});
      setNotice(next ? 'Saved — the whole site now uses this colour.' : 'Reset to the default sky blue.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the colour.');
    } finally {
      setSaving(false);
    }
  }

  if (saved === undefined) return <LoadingRow label="Loading theme…" />;

  const dirty = color.toUpperCase() !== savedColor.toUpperCase();

  return (
    <div>
      <SectionHeader title="Theme colour" subtitle="Pick the brand colour used for buttons, links, badges and highlights across the whole site." />

      {error && (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-ink">Presets</h2>
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {PRESETS.map((p) => {
              const active = p.hex === color.toUpperCase();
              return (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => pick(p.hex)}
                  aria-label={p.name}
                  aria-pressed={active}
                  title={p.name}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-white ring-offset-2 ring-offset-surface transition-transform group-hover:scale-105 dark:border-white/25 ${
                      active ? 'ring-2 ring-ink' : ''
                    }`}
                    style={{ background: p.hex }}
                  >
                    {active && <Check size={18} />}
                  </span>
                  <span className="max-w-full truncate text-[11px] text-ink-muted">{p.name}</span>
                </button>
              );
            })}
          </div>

          <h2 className="mt-6 text-sm font-semibold text-ink">Custom colour</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border" style={{ background: color }}>
              <span className="sr-only">Choose a colour</span>
              <input type="color" value={color} onChange={(e) => pick(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
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
              className={`${inputClass.replace('w-full', 'w-32')} font-mono uppercase`}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row">
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => save(color)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save colour
            </button>
            {dirty && (
              <button
                type="button"
                disabled={saving}
                onClick={() => pick(savedColor)}
                className="h-11 rounded-xl border border-border px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
              >
                Discard
              </button>
            )}
            {saved && (
              <button
                type="button"
                disabled={saving}
                onClick={() => save(null)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <RotateCcw size={15} /> Reset to default
              </button>
            )}
          </div>
          {notice && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{notice}</p>}
        </div>

        {/* Preview uses the live brand variables, so it shows exactly what the site will look like. */}
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-ink">Preview</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{dirty ? 'Not saved yet' : 'Live on the site'}</p>
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-bg p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-ink">DukanCloude</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-brand">
                <ShoppingBasket size={15} />
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
              <Sparkles size={11} /> Featured shop
            </span>
            <p className="text-sm text-ink-muted">
              Fresh groceries near you. <span className="font-semibold text-brand">View offers</span>
            </p>
            <div className="flex gap-2">
              <span className="flex h-9 flex-1 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-ink">Post Your Ad</span>
              <span className="flex h-9 flex-1 items-center justify-center rounded-full border border-brand text-xs font-semibold text-brand">Log in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
