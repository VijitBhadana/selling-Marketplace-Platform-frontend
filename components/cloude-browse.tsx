'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import Link from 'next/link';
import { LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react';
import { getCloudeBySlug } from '@/lib/cloudes-data';
import { categoryTone } from './category-tones';
import { Icon } from './icon';

// Browse controls on a Cloude page. On phones a search bar filters this Cloude's
// category chips and shop cards as you type, and the categories panel shows the first
// few chips behind a "View All" toggle. From lg up the panel is the full sidebar list.

const PREVIEW_COUNT = 8;

type BrowseState = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
};

const BrowseContext = createContext<BrowseState>({
  query: '',
  setQuery: () => {},
  expanded: false,
  setExpanded: () => {},
});

export function CloudeBrowseProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  // The search bar is phone-only — drop a leftover search once the screen widens
  // (e.g. rotating to landscape), or it would keep filtering with no box to clear it.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setQuery('');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(() => ({ query, setQuery, expanded, setExpanded }), [query, expanded]);
  return <BrowseContext.Provider value={value}>{children}</BrowseContext.Provider>;
}

export function useCloudeBrowse() {
  return useContext(BrowseContext);
}

/** The search text, trimmed and lower-cased — '' outside a CloudeBrowseProvider. */
export function useCloudeQuery() {
  return useContext(BrowseContext).query.trim().toLowerCase();
}

export function CloudeSearchBar({ cloudeSlug }: { cloudeSlug: string }) {
  const { query, setQuery, expanded, setExpanded } = useCloudeBrowse();
  const inputRef = useRef<HTMLInputElement>(null);
  const canExpand = (getCloudeBySlug(cloudeSlug)?.categories.length ?? 0) > PREVIEW_COUNT;

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
      }}
      className="mb-4 md:hidden"
    >
      <div className="group/search flex h-12 items-center gap-2 rounded-2xl border border-border bg-surface pl-3.5 pr-1.5 shadow-card transition-colors focus-within:border-brand/60">
        <Search
          size={18}
          strokeWidth={2.2}
          className="shrink-0 text-ink-muted transition-colors group-focus-within/search:text-brand"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories, stores or services…"
          aria-label="Search categories, stores or services"
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 text-ellipsis bg-transparent text-[13px] text-ink placeholder:text-ink-muted/80 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
        {canExpand && (
          <>
            <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Show fewer categories' : 'Show all categories'}
              aria-pressed={expanded}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                expanded ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
              }`}
            >
              <SlidersHorizontal size={17} />
            </button>
          </>
        )}
      </div>
    </form>
  );
}

const chip =
  'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors lg:block lg:rounded-lg lg:px-3 lg:py-2 lg:text-sm';
const chipActive =
  'border-brand bg-brand font-semibold text-brand-ink shadow-[0_4px_14px_-6px_rgb(var(--brand)/0.8)] lg:bg-brand-soft lg:text-brand lg:shadow-none';
const chipIdle =
  'border-border bg-bg/60 text-ink hover:border-brand hover:text-brand lg:border-transparent lg:bg-transparent lg:text-ink-muted';

export function CloudeCategoryPanel({
  cloudeSlug,
  activeSlug,
  allLabel,
}: {
  cloudeSlug: string;
  activeSlug?: string;
  allLabel: string;
}) {
  const { query: rawQuery, expanded, setExpanded } = useCloudeBrowse();
  const query = rawQuery.trim().toLowerCase();

  // Each category borrows its group's icon; loose ones ("Other …") get a generic one.
  const categories = useMemo(() => {
    const cloude = getCloudeBySlug(cloudeSlug);
    return (cloude?.categories ?? []).map((cat) => {
      const group = cloude?.groups?.find((g) => g.items.some((it) => it.slug === cat.slug));
      return { ...cat, icon: group?.icon ?? 'Layers', tone: categoryTone(cloudeSlug, cat.slug).text };
    });
  }, [cloudeSlug]);

  const shown = query ? categories.filter((c) => c.name.toLowerCase().includes(query)) : categories;
  const canExpand = !query && categories.length > PREVIEW_COUNT;

  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4 lg:bg-brand/15 lg:py-3">
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-ink lg:text-sm lg:font-semibold lg:normal-case lg:tracking-normal lg:text-brand">
          Categories
        </h2>
        <span className="rounded-full border border-brand/40 bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand lg:hidden">
          {categories.length} available
        </span>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="ml-auto shrink-0 text-xs font-semibold text-brand hover:underline lg:hidden"
          >
            {expanded ? 'Show less' : 'View All'}
          </button>
        )}
      </div>
      <ul className="no-scrollbar flex flex-wrap gap-2 overflow-y-auto p-4 pt-3 lg:min-h-0 lg:flex-col lg:flex-nowrap lg:gap-1.5 lg:pt-4">
        <li className="max-w-full shrink-0">
          <Link href={`/cloudes/${cloudeSlug}`} className={`${chip} ${!activeSlug ? chipActive : chipIdle}`}>
            <LayoutGrid size={14} className={`shrink-0 lg:hidden ${activeSlug ? 'text-brand' : ''}`} />
            {allLabel}
          </Link>
        </li>
        {shown.map((cat, i) => {
          const active = activeSlug === cat.slug;
          // Beyond the preview only phones collapse — the lg sidebar always lists everything.
          const collapsed = canExpand && !expanded && i >= PREVIEW_COUNT && !active;
          return (
            <li key={cat.slug} className={`max-w-full shrink-0 break-words ${collapsed ? 'max-lg:hidden' : ''}`}>
              <Link
                href={`/cloudes/${cloudeSlug}?category=${cat.slug}`}
                className={`${chip} ${active ? chipActive : chipIdle}`}
              >
                <Icon name={cat.icon} size={14} className={`shrink-0 lg:hidden ${active ? '' : cat.tone}`} />
                <span className="min-w-0">{cat.name}</span>
              </Link>
            </li>
          );
        })}
        {query && shown.length === 0 && (
          <li className="w-full px-1 text-xs text-ink-muted">No category matches “{rawQuery.trim()}”.</li>
        )}
      </ul>
    </aside>
  );
}
