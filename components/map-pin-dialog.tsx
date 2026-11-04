'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Check, Loader2, MapPin, Search, X } from 'lucide-react';
import { formatDistance, locationLabel, placeAt, searchPlace } from '@/lib/user-location';
import type { LatLng } from './pin-map';

const PinMap = dynamic(() => import('./pin-map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <Loader2 size={22} className="animate-spin text-brand" />
    </div>
  ),
});

/**
 * "Confirm your location on the map" — the detected spot is never saved unseen: browsers
 * can report a confident position kilometres off. The visitor drags the map (or searches
 * an area) until the pin sits on their spot. Rendered into <body> because the navbar's
 * backdrop blur would otherwise trap a fixed overlay inside it.
 */
export function MapPinDialog({
  start,
  accuracy,
  onConfirm,
  onClose,
}: {
  start: LatLng;
  /** Metres, only for a rough reading (see isApproximate) — tells the visitor why it may be off. */
  accuracy?: number;
  /** Saves the chosen spot; a thrown Error's message is shown in the dialog. */
  onConfirm: (spot: LatLng) => Promise<void>;
  onClose: () => void;
}) {
  const [center, setCenter] = useState<LatLng>(start);
  const [label, setLabel] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [flyTo, setFlyTo] = useState<LatLng | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lookup = useRef<{ id: number; timer?: ReturnType<typeof setTimeout> }>({ id: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(lookup.current.timer);
    };
  }, [onClose]);

  function handleMoveEnd(c: LatLng) {
    setCenter(c);
    setMoving(false);
    setLabel(null);
    // Only look up once the map rests: Ola calls count against the free quota, and the
    // OpenStreetMap fallback allows about one request a second.
    clearTimeout(lookup.current.timer);
    const id = ++lookup.current.id;
    lookup.current.timer = setTimeout(() => {
      placeAt(c.lat, c.lng)
        .then((place) => id === lookup.current.id && setLabel(place ? locationLabel(place) : ''))
        .catch(() => id === lookup.current.id && setLabel(''));
    }, 700);
  }

  async function search() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const hit = await searchPlace(q, center);
      if (hit) setFlyTo(hit);
      else setError(`Couldn't find "${q}" — try a nearby colony, market or landmark.`);
    } catch {
      setError('Search failed — check your internet and try again.');
    } finally {
      setSearching(false);
    }
  }

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(center);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm your location on the map"
        className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.5)] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold text-ink">Confirm your location</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {accuracy
                ? `Your device could only find a rough location (about ±${formatDistance(accuracy / 1000)}). `
                : ''}
              Move the map so the pin sits on your area, or search for it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            // React events bubble through the portal — keep a parent form (post-ad) from submitting.
            e.preventDefault();
            e.stopPropagation();
            search();
          }}
          className="flex items-center gap-1.5 px-4 pb-3"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colony, market or landmark"
            aria-label="Search area"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-ink focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || searching}
            aria-label="Search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>

        <div className="relative isolate h-[min(52dvh,360px)] border-y border-border">
          <PinMap
            start={start}
            zoom={!accuracy ? 16 : accuracy > 5000 ? 13 : 15}
            flyTo={flyTo}
            onMoveStart={() => setMoving(true)}
            onMoveEnd={handleMoveEnd}
          />
          {/* The pin's tip marks the map centre; it lifts a little while the map moves. */}
          <MapPin
            size={38}
            strokeWidth={2.2}
            aria-hidden
            className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 fill-brand text-white drop-shadow-[0_3px_4px_rgb(0_0_0_/_0.45)] transition-transform ${
              moving ? '-translate-y-[calc(100%+6px)]' : '-translate-y-full'
            }`}
          />
          <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50" />
        </div>

        <div className="space-y-2 px-4 pb-4 pt-3">
          <p className="flex min-h-5 items-center gap-1.5 text-sm text-ink">
            <MapPin size={15} className="shrink-0 text-brand" />
            <span className="truncate">
              {moving || label === null ? (
                <span className="text-ink-muted">Finding area…</span>
              ) : (
                label || <span className="text-ink-muted">Pinned spot</span>
              )}
            </span>
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="button"
            onClick={confirm}
            disabled={saving || moving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving…' : 'Confirm location'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
