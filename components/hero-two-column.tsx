'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FeatureTimeline } from './hero-scroll-features';

// How far below the fixed navbar the pinned row sits.
const OFFSET_TOP = 140;
// Scroll distance (px) the row stays pinned for while the timeline reveals.
// Kept as a small fixed pixel value (not vh-based) so the reserved space is
// just enough for the reveal and never leaves a big empty gap behind.
const RUNWAY_PX = 320;

type PinState = 'before' | 'pinned' | 'after';

export function HeroTwoColumn({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [leftHeight, setLeftHeight] = useState<number | null>(null);
  const [pinState, setPinState] = useState<PinState>('before');
  const [pinRect, setPinRect] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = leftRef.current;
    if (!el) return;

    const update = () => setLeftHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;

    const measure = () => {
      ticking = false;
      const rect = track.getBoundingClientRect();

      if (rect.top > OFFSET_TOP) {
        setPinState('before');
        setProgress(0);
        return;
      }

      const scrolled = OFFSET_TOP - rect.top;
      if (scrolled >= RUNWAY_PX) {
        setPinState('after');
        setProgress(1);
        return;
      }

      setPinState('pinned');
      setPinRect({ left: rect.left, width: rect.width });
      setProgress(scrolled / RUNWAY_PX);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const rowStyle: CSSProperties =
    pinState === 'pinned'
      ? { position: 'fixed', top: OFFSET_TOP, left: pinRect.left, width: pinRect.width, zIndex: 10 }
      : pinState === 'after'
        ? { position: 'absolute', bottom: 0, left: 0, right: 0 }
        : {};

  return (
    <>
      {/* Desktop: the row (left content + right points) pins in place for a short,
          fixed scroll distance while the timeline reveals right-to-left, then
          releases and scrolls away with the rest of the page. The track's height
          is content height + a small fixed runway, so there's no leftover gap. */}
      <div
        ref={trackRef}
        className="relative hidden lg:block"
        style={{ height: leftHeight ? `${leftHeight + RUNWAY_PX}px` : undefined }}
      >
        <div className="flex items-start justify-between gap-12" style={rowStyle}>
          <div ref={leftRef} className="max-w-2xl">
            {children}
          </div>
          <FeatureTimeline progress={progress} heightPx={leftHeight} className="mr-16 xl:mr-32" />
        </div>
      </div>

      {/* Mobile/tablet: normal stacked flow, points shown fully revealed and static */}
      <div className="lg:hidden">
        <div className="max-w-2xl">{children}</div>
        <FeatureTimeline progress={1} className="mt-10" />
      </div>
    </>
  );
}
