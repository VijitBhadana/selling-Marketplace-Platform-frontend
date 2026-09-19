'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type Advertisement } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { AdvertisementCard } from './advertisement-card';

// Pages where a pop-up would only get in the way.
const QUIET_PATHS = ['/admin', '/login', '/register', '/verify-otp'];

/**
 * Pops the admin's advertisements up for a buyer or seller when they land on the
 * site. An ad keeps coming back on every visit until they've seen it and closed
 * the pop-up — so everyone in the audience sees it at least once.
 */
export function AdvertisementPopup() {
  const { user, token } = useAuth();
  const { suspended, pendingWarning } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Ads shown in this pop-up; only these are marked seen on close, the rest wait for the next visit.
  const viewed = useRef(new Set<string>());
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeX = useRef<number | null>(null);

  const role = user?.role;
  useEffect(() => {
    setAds([]);
    setIndex(0);
    setFlipped(false);
    viewed.current.clear();
    if (!token || (role !== 'BUYER' && role !== 'SELLER')) return;
    let cancelled = false;
    // Let the page settle before the card flies in.
    const timer = setTimeout(() => {
      api.advertisements
        .pending(token)
        .then((list) => !cancelled && setAds(list))
        .catch(() => {});
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, role]);

  const quiet = QUIET_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
  // The COD warning / suspension notice goes first; the ad waits behind it.
  const open = ads.length > 0 && !quiet && !suspended && !pendingWarning;
  const ad = open ? ads[Math.min(index, ads.length - 1)] : null;

  useEffect(() => {
    if (ad) viewed.current.add(ad.id);
  }, [ad]);

  const close = useCallback(() => {
    const ids = [...viewed.current];
    setAds([]);
    if (token && ids.length) api.advertisements.markSeen(ids, token).catch(() => {});
  }, [token]);

  const go = useCallback(
    (step: number) => {
      setFlipped(true);
      setIndex((i) => (i + step + ads.length) % ads.length);
    },
    [ads.length],
  );

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && ads.length > 1) go(1);
      else if (e.key === 'ArrowLeft' && ads.length > 1) go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, go, ads.length]);

  if (!ad) return null;

  function visit() {
    const link = ad?.linkUrl;
    close();
    if (!link) return;
    if (link.startsWith('/')) router.push(link);
    else window.open(link, '_blank', 'noopener,noreferrer');
  }

  const closeOnBackdrop = (e: React.MouseEvent) => e.target === e.currentTarget && close();

  return (
    <div className="ad-fade fixed inset-0 z-[70] overflow-y-auto bg-black/65 backdrop-blur-md" onMouseDown={closeOnBackdrop}>
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-[110px]"
      />
      <div className="flex min-h-full items-center justify-center px-6 py-12" onMouseDown={closeOnBackdrop}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ad-popup-title"
          aria-roledescription="advertisement"
          className="relative w-full max-w-[440px]"
          onTouchStart={(e) => (swipeX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (swipeX.current === null || ads.length < 2) return;
            const dx = e.changedTouches[0].clientX - swipeX.current;
            swipeX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          <AdvertisementCard
            key={ad.id}
            ad={ad}
            titleId="ad-popup-title"
            enterClass={flipped ? 'ad-swap' : 'ad-enter'}
            onClose={close}
            onAction={visit}
            closeButtonRef={closeRef}
          />

          {ads.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous advertisement"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                {ads.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      if (i === index) return;
                      setFlipped(true);
                      setIndex(i);
                    }}
                    aria-label={`Advertisement ${i + 1} of ${ads.length}`}
                    aria-current={i === index ? 'true' : undefined}
                    className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next advertisement"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
