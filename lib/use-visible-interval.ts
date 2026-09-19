'use client';

import { useEffect, useRef } from 'react';

/**
 * Polls: runs `poll` right away and then every `ms`, but only while the tab is
 * visible — a background tab makes no API calls nobody would see, and polls again
 * the moment it's brought back. `key` restarts the loop when it changes (a new
 * token or conversation); `null` stops it.
 *
 * `poll` gets `isStale()`, true once the loop it was started from has been
 * stopped or restarted, so a slow response can't overwrite newer state.
 */
export function useVisibleInterval(poll: (isStale: () => boolean) => void, ms: number, key: string | null) {
  const pollRef = useRef(poll);
  useEffect(() => {
    pollRef.current = poll;
  });

  useEffect(() => {
    if (key === null) return;
    let stale = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const isStale = () => stale;
    const tick = () => pollRef.current(isStale);

    const start = () => {
      if (timer !== undefined) return;
      tick();
      timer = setInterval(tick, ms);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibilityChange = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stale = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [key, ms]);
}
