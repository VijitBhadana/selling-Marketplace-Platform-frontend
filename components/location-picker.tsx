'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Crosshair, Loader2, MapPin, X } from 'lucide-react';
import {
  LOCATION_CHANGE_EVENT,
  detectLocation,
  locateTypedCity,
  readLocation,
  saveLocation,
  shouldAutoPrompt,
  type UserLocation,
} from '@/lib/user-location';

// Both the desktop and mobile pickers mount at once; only one may ask for permission.
let autoDetectStarted = false;

/**
 * Location button in the navbar search. Shows the visitor's city; clicking it lets them
 * detect it again, type another one, or go back to all cities. On a first visit it asks
 * for location once by itself, so shops near the visitor show up straight away.
 */
export const LocationPicker = memo(function LocationPicker({ variant }: { variant: 'desktop' | 'mobile' }) {
  const router = useRouter();
  const [city, setCity] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  function apply(next: UserLocation | null) {
    saveLocation(next);
    setOpen(false);
    setError(null);
    router.refresh();
  }

  async function detect(silent = false) {
    setDetecting(true);
    setError(null);
    try {
      apply(await detectLocation());
    } catch (e) {
      if (!silent) setError((e as Error).message);
    } finally {
      setDetecting(false);
    }
  }

  useEffect(() => {
    setCity(readLocation()?.city ?? null);
    const onChange = (e: Event) => setCity((e as CustomEvent<UserLocation | null>).detail?.city ?? null);
    window.addEventListener(LOCATION_CHANGE_EVENT, onChange);

    if (variant === 'desktop' && !autoDetectStarted && !readLocation() && shouldAutoPrompt()) {
      autoDetectStarted = true;
      detect(true);
    }
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function submitTyped() {
    const value = typed.trim();
    if (!value) return;
    setDetecting(true);
    try {
      apply(await locateTypedCity(value));
    } finally {
      setDetecting(false);
    }
  }

  const isDesktop = variant === 'desktop';

  return (
    <div ref={rootRef} className={isDesktop ? 'relative shrink-0' : 'relative mb-3'}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={city ? `Showing shops in ${city}` : 'Set your location'}
        className={
          isDesktop
            ? 'flex h-9 max-w-[9.5rem] items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-ink transition-colors hover:bg-surface lg:max-w-[11rem]'
            : 'flex h-11 w-full items-center gap-2 rounded-full border border-border bg-bg px-4 text-sm font-medium text-ink'
        }
      >
        {detecting ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-brand" />
        ) : (
          <MapPin size={16} strokeWidth={2.4} className={`shrink-0 ${city ? 'text-brand' : 'text-ink-muted'}`} />
        )}
        <span className={`truncate ${city ? '' : 'text-ink-muted'}`}>
          {detecting ? 'Locating…' : city ?? (isDesktop ? 'Location' : 'Set your location')}
        </span>
        <ChevronDown size={14} className={`ml-auto shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose your location"
          className={`z-50 rounded-2xl border border-border bg-surface p-3 shadow-2xl ${
            isDesktop ? 'absolute left-0 top-full mt-2 w-72' : 'mt-2'
          }`}
        >
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Your location</p>

          <button
            type="button"
            onClick={() => detect()}
            disabled={detecting}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl bg-brand-soft px-3 py-2.5 text-left text-sm font-semibold text-brand transition-colors hover:bg-brand/15 disabled:cursor-wait disabled:opacity-70"
          >
            {detecting ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            {detecting ? 'Detecting…' : 'Use my current location'}
          </button>

          <div className="mt-2 flex items-center gap-1.5">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                // The picker sits inside the search form — Enter sets the city, not a search.
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitTyped();
                }
              }}
              placeholder="Or type your city / area, e.g. Meerut"
              aria-label="City"
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={submitTyped}
              disabled={!typed.trim() || detecting}
              aria-label="Set city"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Check size={16} />
            </button>
          </div>

          {error && <p className="mt-2 px-1 text-xs text-red-500">{error}</p>}

          {city && (
            <button
              type="button"
              onClick={() => apply(null)}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={14} /> Clear — show shops from all cities
            </button>
          )}
        </div>
      )}
    </div>
  );
});
