'use client';

import { useEffect } from 'react';

// Keeps the splash up at least this long after navigation start, so a fast
// (cached) load doesn't just flash it.
const MIN_VISIBLE_MS = 600;
const FADE_MS = 400;

/** Fades out the server-rendered splash loader once the app has hydrated. */
export function SplashDismiss({ id }: { id: string }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const fadeTimer = setTimeout(
      () => {
        el.setAttribute('data-done', '');
        // display:none afterwards so its looping animations stop running.
        hideTimer = setTimeout(() => {
          el.style.display = 'none';
        }, FADE_MS);
      },
      Math.max(0, MIN_VISIBLE_MS - performance.now()),
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [id]);

  return null;
}
