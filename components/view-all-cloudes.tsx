'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, LayoutGrid, X } from 'lucide-react';
import { cardStyles } from './cloude-card';
import { Icon } from './icon';
import { startTopLoader } from './top-loader';

export type CloudeLink = { slug: string; name: string; icon: string; description: string; categoryCount: number };

// "View all" on the home page's Fresh listings — opens a modal listing every Cloude
// top to bottom; picking one takes the user straight into that Cloude.
export function ViewAllCloudes({ cloudes }: { cloudes: CloudeLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand hover:underline">
        View all
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-all-cloudes-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <LayoutGrid size={18} />
                </span>
                <div>
                  <h2 id="view-all-cloudes-title" className="font-display text-base font-bold text-ink">
                    Browse all Cloudes
                  </h2>
                  <p className="text-xs text-ink-muted">Pick a Cloude to see its live shops</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto p-2">
              {cloudes.map((c) => {
                const style = cardStyles[c.slug];
                const Glyph = style?.icon;
                const href = `/cloudes/${c.slug}`;
                return (
                  <li key={c.slug}>
                    <Link
                      href={href}
                      onClick={() => {
                        startTopLoader(href);
                        setOpen(false);
                      }}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 ${
                          style?.tile ?? 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-500/15 dark:border-cyan-400/40 dark:text-cyan-300'
                        }`}
                      >
                        {Glyph ? <Glyph size={18} /> : <Icon name={c.icon} size={18} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand">
                          {style?.title ?? c.name.replace(' Cloude', '')}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">{style?.blurb ?? c.description}</span>
                      </span>
                      <span className="hidden shrink-0 text-[11px] text-ink-muted min-[420px]:inline">
                        {c.categoryCount} categories
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
