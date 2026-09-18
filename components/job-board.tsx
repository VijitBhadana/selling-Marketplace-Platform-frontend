'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  Briefcase,
  CalendarClock,
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { DATE_POSTED_OPTIONS, JOB_TYPE_OPTIONS, WORK_MODE_OPTIONS, type Job } from '@/lib/jobs';
import { useMyJobApplications } from '@/lib/use-my-job-applications';
import { JobCard } from './job-card';
import { JobCardSkeleton, SkeletonGroup } from './skeleton';

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 48;

const SORT_OPTIONS: { value: 'latest' | 'oldest'; label: string }[] = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' },
];
const JOB_TYPE_FILTER_OPTIONS = [{ value: '', label: 'All job types' }, ...JOB_TYPE_OPTIONS];
const WORK_MODE_FILTER_OPTIONS = [{ value: '', label: 'Any work mode' }, ...WORK_MODE_OPTIONS];

type Option<T extends string> = { value: T; label: string };

// Themed replacement for a native <select> — the OS dropdown list ignores the
// site's dark theme. Same contract: a value, its options, and onChange.
function FilterDropdown<T extends string>({
  label,
  icon: IconCmp,
  value,
  defaultValue,
  placeholder,
  options,
  onChange,
}: {
  /** Accessible name + popover heading, e.g. "Sort by". */
  label: string;
  icon: LucideIcon;
  value: T;
  /** The "no filter" value — the trigger is highlighted whenever value differs from it. */
  defaultValue: T;
  /** Trigger text while value === defaultValue (falls back to the option label). */
  placeholder?: string;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const active = value !== defaultValue;
  const selected = options.find((o) => o.value === value);
  const triggerText = !active && placeholder ? placeholder : selected?.label ?? placeholder ?? label;

  useEffect(() => {
    if (!open) return;
    // Focus the current choice so arrow keys start from it.
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    optionRefs.current[idx]?.focus();

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    const items = optionRefs.current.filter(Boolean) as HTMLButtonElement[];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(current + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(current - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        className={`group inline-flex h-10 items-center gap-2 rounded-xl border pl-3 pr-2.5 text-sm font-medium transition-all ${
          active
            ? 'border-brand/50 bg-brand-soft text-brand'
            : open
              ? 'border-brand bg-surface text-ink ring-4 ring-brand/10'
              : 'border-border bg-bg text-ink hover:border-ink-muted/40 hover:bg-surface-hover'
        }`}
      >
        <IconCmp size={15} className={active ? 'text-brand' : 'text-ink-muted group-hover:text-ink'} />
        <span className="whitespace-nowrap">{triggerText}</span>
        <ChevronDown
          size={15}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} ${active ? 'text-brand' : 'text-ink-muted'}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className="absolute left-0 top-full z-30 mt-2 w-max min-w-[210px] max-w-[calc(100vw-2rem)] animate-slide-down overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0_/_0.45)]"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <button
                key={o.value || 'any'}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
                className={`flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors focus-visible:bg-surface-hover ${
                  isSelected ? 'bg-brand-soft font-semibold text-brand' : 'text-ink hover:bg-surface-hover'
                }`}
              >
                {o.label}
                <Check size={15} strokeWidth={2.5} className={isSelected ? 'opacity-100' : 'opacity-0'} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex animate-fade-in-up items-center gap-1 rounded-lg border border-brand/30 bg-brand-soft py-1 pl-2.5 pr-1 text-xs font-medium text-brand">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-brand/15"
      >
        <X size={12} />
      </button>
    </span>
  );
}

// Right-hand section of the Jobs & Freelancing Cloude: search + filters above the job cards.
// Starts from the server-rendered jobs and only refetches once a filter is used.
export function JobBoard({
  cloudeSlug,
  categorySlug,
  categoryName,
  initialJobs,
  initialTotal,
  postJobHref,
  near,
}: {
  cloudeSlug: string;
  /** Omit to show jobs from every category in the Cloude. */
  categorySlug?: string;
  categoryName: string;
  initialJobs: Job[];
  initialTotal: number;
  postJobHref: string;
  /** The visitor's area from the navbar location picker — filtered jobs stay near them too. */
  near?: Record<string, string | undefined>;
}) {
  const { byJob, markApplied } = useMyJobApplications();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest');
  const [postedWithin, setPostedWithin] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const filtersActive = !!(debouncedQuery || sort !== 'latest' || postedWithin || jobType || workMode);

  useEffect(() => {
    if (!filtersActive) {
      setJobs(initialJobs);
      setTotal(initialTotal);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    api.jobs
      .list({
        cloudeSlug,
        categorySlug,
        q: debouncedQuery || undefined,
        sort,
        postedWithinDays: postedWithin || undefined,
        jobType: jobType || undefined,
        workMode: workMode || undefined,
        pageSize: PAGE_SIZE,
        ...near,
      })
      .then((data) => {
        if (cancelled) return;
        setJobs(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load jobs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filtersActive, cloudeSlug, categorySlug, debouncedQuery, sort, postedWithin, jobType, workMode, initialJobs, initialTotal, near]);

  function clearFilters() {
    setQuery('');
    setDebouncedQuery('');
    setSort('latest');
    setPostedWithin('');
    setJobType('');
    setWorkMode('');
  }

  // Chips for every non-default filter — each one resets just that filter.
  const activeChips = [
    debouncedQuery && { key: 'q', label: `“${debouncedQuery}”`, onRemove: () => setQuery('') },
    sort !== 'latest' && { key: 'sort', label: SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort, onRemove: () => setSort('latest') },
    postedWithin && {
      key: 'posted',
      label: DATE_POSTED_OPTIONS.find((o) => o.value === postedWithin)?.label ?? postedWithin,
      onRemove: () => setPostedWithin(''),
    },
    jobType && { key: 'type', label: JOB_TYPE_OPTIONS.find((o) => o.value === jobType)?.label ?? jobType, onRemove: () => setJobType('') },
    workMode && { key: 'mode', label: WORK_MODE_OPTIONS.find((o) => o.value === workMode)?.label ?? workMode, onRemove: () => setWorkMode('') },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];
  const filterCount = activeChips.filter((c) => c.key !== 'q').length;

  return (
    <div>
      <div className="relative mb-5 rounded-2xl border border-border bg-surface p-3 shadow-card sm:p-4">
        {/* Search */}
        <div className="group flex h-12 items-center gap-3 rounded-xl border border-border bg-bg pl-1.5 pr-3 transition-all hover:border-ink-muted/40 focus-within:border-brand focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors group-focus-within:bg-brand group-focus-within:text-brand-ink">
            {loading && debouncedQuery ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 100))}
            placeholder={`Search jobs in ${categoryName} — title, company, skill or city`}
            aria-label="Search jobs"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <SlidersHorizontal size={14} /> Filters
            {filterCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-ink">
                {filterCount}
              </span>
            )}
          </span>
          <FilterDropdown label="Sort by" icon={ArrowUpDown} value={sort} defaultValue="latest" options={SORT_OPTIONS} onChange={setSort} />
          <FilterDropdown
            label="Date posted"
            icon={CalendarClock}
            value={postedWithin}
            defaultValue=""
            placeholder="Date posted"
            options={DATE_POSTED_OPTIONS}
            onChange={setPostedWithin}
          />
          <FilterDropdown
            label="Job type"
            icon={Briefcase}
            value={jobType}
            defaultValue=""
            placeholder="Job type"
            options={JOB_TYPE_FILTER_OPTIONS}
            onChange={setJobType}
          />
          <FilterDropdown
            label="Work mode"
            icon={MapPin}
            value={workMode}
            defaultValue=""
            placeholder="Work mode"
            options={WORK_MODE_FILTER_OPTIONS}
            onChange={setWorkMode}
          />
        </div>

        {/* Active filters */}
        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-xs text-ink-muted">Active:</span>
            {activeChips.map((c) => (
              <ActiveChip key={c.key} label={c.label} onRemove={c.onRemove} />
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-ink-muted" aria-live="polite">
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin text-brand" /> Searching…
          </>
        ) : (
          <>
            <span className="inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 font-bold text-brand">{total}</span>
            job{total === 1 ? '' : 's'} found
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{error}</div>
      )}

      {jobs.length === 0 && !loading ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            {filtersActive ? <SearchX size={24} /> : <Briefcase size={24} />}
          </span>
          {filtersActive ? (
            <>
              <p className="mt-4 text-sm font-semibold text-ink">No jobs match your search.</p>
              <p className="mt-1 text-xs text-ink-muted">Try a different keyword or loosen a filter.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-semibold text-ink">No jobs posted yet in {categoryName}</p>
              <p className="mt-1 text-xs text-ink-muted">Be the first — it takes about 2 minutes.</p>
              <Link
                href={postJobHref}
                className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
              >
                Post a job
              </Link>
            </>
          )}
        </div>
      ) : loading && jobs.length === 0 ? (
        // Nothing to dim yet — show card placeholders. With results already on
        // screen, those stay visible (dimmed) while the refined search loads.
        <SkeletonGroup label="Loading jobs…" className="grid gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {Array.from({ length: 6 }, (_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </SkeletonGroup>
      ) : (
        <div className={`grid gap-4 transition-opacity sm:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] ${loading ? 'opacity-60' : ''}`}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} application={byJob[job.id]} onApplied={markApplied} />
          ))}
        </div>
      )}
    </div>
  );
}
