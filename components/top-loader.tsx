'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Thin progress bar pinned to the top of the viewport. The App Router has no
// route-change events, so a navigation "starts" on an internal link click (or
// an explicit startTopLoader() right before router.push) and "ends" once the
// pathname / search params change. On a hard load the bar is server-rendered
// already animating and completes on window "load".
//
// Links whose onClick may cancel navigation (e.g. auth-gated ones) should carry
// data-no-progress and call startTopLoader() themselves when they do navigate.

let bar: HTMLDivElement | null = null;
let progress = 0;
let active = false;
let lastUrl = '';
let trickleTimer: ReturnType<typeof setInterval> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let failsafeTimer: ReturnType<typeof setTimeout> | undefined;

const currentUrl = () => location.pathname + location.search;

function paint(animate = true) {
  if (!bar) return;
  bar.style.transition = animate ? 'transform 200ms ease-out, opacity 300ms ease' : 'none';
  bar.style.transform = `translate3d(${progress - 100}%,0,0)`;
}

function begin() {
  if (!bar) return;
  clearTimeout(hideTimer);
  if (active) return;
  active = true;
  bar.classList.remove('top-loader-boot');
  bar.style.opacity = '1';
  progress = 0;
  paint(false);
  bar.getBoundingClientRect(); // flush so the next paint animates from 0
  progress = 12;
  paint();
  // Creeps towards 94% and waits there for the route to actually change.
  trickleTimer = setInterval(() => {
    progress += (94 - progress) * 0.07;
    paint();
  }, 250);
  // A navigation that never commits (cancelled, errored) must not leave the bar stuck.
  failsafeTimer = setTimeout(finish, 15000);
}

function finish() {
  if (!bar || !active) return;
  active = false;
  clearInterval(trickleTimer);
  clearTimeout(failsafeTimer);
  progress = 100;
  paint();
  hideTimer = setTimeout(() => {
    if (bar) bar.style.opacity = '0';
    hideTimer = setTimeout(() => {
      progress = 0;
      paint(false);
    }, 300);
  }, 200);
}

/** Start the bar for a programmatic navigation. No-op when `href` is the current page or off-site. */
export function startTopLoader(href?: string) {
  if (href) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || url.pathname + url.search === currentUrl()) return;
  }
  begin();
}

function onDocumentClick(e: MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (!(e.target instanceof Element)) return;
  const a = e.target.closest('a[href]');
  if (!(a instanceof HTMLAnchorElement)) return;
  if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-progress')) return;
  startTopLoader(a.href);
}

function onPopState() {
  // Back/forward to a different page (hash-only jumps keep the same URL here).
  if (currentUrl() !== lastUrl) begin();
}

function RouteWatcher() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();

  useEffect(() => {
    lastUrl = currentUrl();
    finish();
  }, [pathname, search]);

  return null;
}

export function TopLoader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    bar = el;

    // Hand the CSS boot animation over to the JS bar and complete it.
    function endBoot() {
      if (!el || !el.classList.contains('top-loader-boot')) return;
      progress = Math.min(100, (el.getBoundingClientRect().right / window.innerWidth) * 100);
      el.style.opacity = '1';
      el.classList.remove('top-loader-boot');
      paint(false);
      el.getBoundingClientRect();
      active = true;
      finish();
    }
    if (document.readyState === 'complete') endBoot();
    else window.addEventListener('load', endBoot, { once: true });

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('load', endBoot);
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('popstate', onPopState);
      if (bar === el) bar = null;
    };
  }, []);

  return (
    <>
      <div ref={ref} className="top-loader top-loader-boot" role="presentation" aria-hidden="true">
        <div className="top-loader-peg" />
      </div>
      <Suspense fallback={null}>
        <RouteWatcher />
      </Suspense>
    </>
  );
}
