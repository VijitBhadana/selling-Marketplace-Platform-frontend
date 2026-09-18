'use client';

import { useRef } from 'react';
import { ArrowUpRight, ImageIcon, Sparkles, Store, X } from 'lucide-react';

export type AdCardContent = {
  kind: 'SHOP' | 'SERVICE';
  name: string;
  description?: string | null;
  imageUrl: string | null;
  linkUrl?: string | null;
};

const KIND = {
  SHOP: { label: 'Featured shop', cta: 'Visit shop', icon: Store },
  SERVICE: { label: 'Featured service', cta: 'View service', icon: Sparkles },
} as const;

/**
 * An advertisement drawn as a 3D slab: coloured back plates give it depth, it
 * floats and sways on its own, tilts toward the mouse, and the close button and
 * badge hover in front of the face. Used by the landing pop-up and the admin's
 * live preview.
 */
export function AdvertisementCard({
  ad,
  titleId,
  enterClass = 'ad3d-enter',
  onClose,
  onAction,
  closeButtonRef,
}: {
  ad: AdCardContent;
  titleId?: string;
  /** Animation the card comes in with — the first pop-up flies in, later ones flip over. */
  enterClass?: string;
  onClose?: () => void;
  onAction?: () => void;
  closeButtonRef?: React.Ref<HTMLButtonElement>;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const meta = KIND[ad.kind];

  // Measured off the stage, not the tilting card, so the tilt can't feed back into itself.
  function tilt(e: React.PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty('--ry', `${(x - 0.5) * 24}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 18}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.setProperty('--glare', '1');
  }

  function untilt() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--glare', '0');
  }

  return (
    <div className="ad3d-stage relative select-none" onPointerMove={tilt} onPointerLeave={untilt}>
      <div className={`ad3d-3d ${enterClass}`}>
        <div className="ad3d-3d ad3d-float">
          <div ref={tiltRef} className="ad3d-3d ad3d-tilt relative">
            {/* Behind the face: a pulsing glow and two coloured plates, so the card reads as a thick slab when it turns. */}
            <div
              aria-hidden
              className="ad3d-glow pointer-events-none absolute -inset-5 rounded-[44px] bg-gradient-to-br from-brand via-accent/70 to-brand blur-2xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-brand to-accent"
              style={{ transform: 'translateZ(-28px)' }}
            />
            <div aria-hidden className="absolute inset-0 rounded-[28px] bg-brand/70" style={{ transform: 'translateZ(-14px)' }} />

            {/* Face */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-surface shadow-[0_40px_90px_-30px_rgb(0_0_0_/_0.7)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-hover">
                {ad.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.imageUrl} alt={ad.name} draggable={false} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand/25 to-accent/20 text-ink-muted">
                    <ImageIcon size={30} />
                    <span className="text-xs font-medium">Your photo shows here</span>
                  </div>
                )}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/25" />
                <div
                  aria-hidden
                  className="ad3d-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
                <span className="absolute bottom-3.5 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/30 backdrop-blur-md">
                  <meta.icon size={12} /> {meta.label}
                </span>
              </div>

              <div className="px-5 pb-5 pt-4 sm:px-6">
                <h2
                  id={titleId}
                  className="break-words pr-14 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink"
                >
                  {ad.name || (ad.kind === 'SHOP' ? 'Shop name' : 'Service name')}
                </h2>
                {ad.description && (
                  <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-ink-muted">{ad.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-ink-muted">Promoted on DukanCloude</span>
                  {ad.linkUrl && (
                    <button
                      type="button"
                      onClick={onAction}
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink shadow-[0_10px_24px_-8px_rgb(var(--brand)_/_0.7)] transition hover:brightness-110 active:scale-[0.97]"
                    >
                      {meta.cta} <ArrowUpRight size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Light catching the card where the pointer is. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{
                  opacity: 'var(--glare, 0)',
                  background: 'radial-gradient(circle at var(--mx, 50%) var(--my, 0%), rgb(255 255 255 / 0.22), transparent 55%)',
                }}
              />
            </div>

            {/* In front of the face */}
            <span
              aria-hidden
              className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-md"
              style={{ transform: 'translateZ(40px)' }}
            >
              Sponsored
            </span>
            <div aria-hidden className="ad3d-3d pointer-events-none absolute inset-x-0 top-0 aspect-[4/3]">
              <span
                className="absolute -bottom-7 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white shadow-[0_16px_30px_-10px_rgb(0_0_0_/_0.6)] ring-4 ring-surface"
                style={{ transform: 'translateZ(55px)' }}
              >
                <meta.icon size={24} />
              </span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close advertisement"
              className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/30 backdrop-blur-md transition hover:bg-black/70 hover:ring-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ transform: 'translateZ(65px)' }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      {/* Shadow on the "floor" — shrinks as the card floats up. */}
      <div aria-hidden className="ad3d-shadow mx-auto mt-7 h-5 w-2/3 rounded-[50%] bg-black/50 blur-xl" />
    </div>
  );
}
