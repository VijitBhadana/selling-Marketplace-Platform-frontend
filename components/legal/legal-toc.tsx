'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ListOrdered } from 'lucide-react';

type TocItem = { id: string; title: string };

// A section counts as "current" once its top passes this far below the fixed navbar.
const ACTIVE_OFFSET = 140;

/** "On this page" list for the policy pages — highlights the section being read and tracks progress. */
export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const ids = items.map((item) => item.id).join('|');

  useEffect(() => {
    const sections = ids
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= ACTIVE_OFFSET) current = section.id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sections[sections.length - 1].id;
      setActive(current);

      const start = sections[0].getBoundingClientRect().top + window.scrollY - ACTIVE_OFFSET;
      const end = sections[sections.length - 1].getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      const ratio = (window.scrollY - start) / Math.max(1, end - start);
      setProgress(Math.min(1, Math.max(0, ratio)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === active));
  const percent = Math.round(progress * 100);

  const list = (
    <ol className="space-y-0.5">
      {items.map((item, i) => {
        const isActive = item.id === active;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              aria-current={isActive ? 'location' : undefined}
              className={`flex items-start gap-3 rounded-lg px-2.5 py-2 text-sm leading-snug transition-colors ${
                isActive ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
              }`}
            >
              <span className="mt-px w-5 shrink-0 font-display text-xs tabular-nums opacity-70">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{item.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Phones & tablets: collapsible */}
      <div className="rounded-2xl border border-border bg-surface shadow-card lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <ListOrdered size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-muted/80">
              On this page · {activeIndex + 1}/{items.length}
            </span>
            <span className="block truncate text-sm font-semibold text-ink">{items[activeIndex]?.title}</span>
          </span>
          <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="mx-4 h-1 overflow-hidden rounded-full bg-border/70">
          <div className="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${percent}%` }} />
        </div>
        {open && <div className="animate-slide-down px-2 pb-3 pt-2">{list}</div>}
        {!open && <div className="h-3" />}
      </div>

      {/* Desktop: sticky sidebar */}
      <nav aria-label="On this page" className="hidden rounded-2xl border border-border bg-surface p-3 shadow-card lg:block">
        <div className="flex items-center justify-between px-2.5 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted/80">On this page</p>
          <span className="text-xs font-semibold tabular-nums text-brand">{percent}%</span>
        </div>
        <div className="mx-2.5 mb-3 mt-2.5 h-1 overflow-hidden rounded-full bg-border/70">
          <div className="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${percent}%` }} />
        </div>
        {list}
      </nav>
    </>
  );
}
