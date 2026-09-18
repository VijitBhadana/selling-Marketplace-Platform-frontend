'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Ban,
  Briefcase,
  CalendarDays,
  ChevronDown,
  CircleSlash,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  Gift,
  Info,
  Megaphone,
  MoreVertical,
  PieChart,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AdminUser, ErrorNote, LoadingRow, StatusBadge, cardClass, formatDate } from './shared';
import { SuspendDialog } from './suspend-dialog';
import { PlatformInsights } from './platform-insights';

export type RangeDays = 7 | 30 | 90;
export const RANGE_OPTIONS: RangeDays[] = [7, 30, 90];

type Stats = {
  buyers: number;
  sellers: number;
  suspended: number;
  days: number;
  newUsers: number;
  listings: number;
  jobs: number;
  activeSubscriptions: number;
  inactiveSubscriptions: number;
};

type RoleFilter = '' | 'BUYER' | 'SELLER';
const PAGE_SIZE = 5;

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (days < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  return formatDate(iso);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? 'U') + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '')).toUpperCase();
}

/** Dropdown for the stats window, shared by the top bar and the hero. */
export function RangeSelect({ value, onChange, compact = false }: { value: RangeDays; onChange: (d: RangeDays) => void; compact?: boolean }) {
  return (
    <label
      className={`relative flex shrink-0 items-center gap-2 rounded-xl border border-border bg-bg/60 text-ink transition-colors hover:border-ink-muted/30 ${
        compact ? 'h-9 px-3 text-xs font-semibold' : 'h-10 px-3.5 text-sm font-medium'
      }`}
    >
      <CalendarDays size={compact ? 14 : 16} className="text-brand" />
      <span>Last {value} Days</span>
      <ChevronDown size={14} className="text-ink-muted" />
      <select
        aria-label="Date range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as RangeDays)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {RANGE_OPTIONS.map((d) => (
          <option key={d} value={d}>
            Last {d} days
          </option>
        ))}
      </select>
    </label>
  );
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OverviewSection({
  days,
  onDaysChange,
  onOpenUser,
  onNavigate,
  onAnnounce,
  onAdvertise,
  refreshKey,
}: {
  days: RangeDays;
  onDaysChange: (d: RangeDays) => void;
  onOpenUser: (id: string) => void;
  onNavigate: (tab: string) => void;
  onAnnounce: () => void;
  onAdvertise: () => void;
  refreshKey: number;
}) {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setStats(await api.admin.stats(token, days));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the dashboard.');
    }
  }, [token, days]);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  async function exportReport() {
    if (!token || !stats) return;
    setExporting(true);
    try {
      const res = await api.admin.users({ pageSize: 100 }, token);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`dukancloude-report-${date}.csv`, [
        ['DukanCloude platform report', date],
        [],
        ['Metric', 'Value'],
        ['Buyers', stats.buyers],
        ['Sellers', stats.sellers],
        [`New sign-ups (last ${stats.days} days)`, stats.newUsers],
        ['Suspended accounts', stats.suspended],
        ['Shops & ads', stats.listings],
        ['Job posts', stats.jobs],
        ['Active subscriptions', stats.activeSubscriptions],
        ['Inactive subscriptions', stats.inactiveSubscriptions],
        [],
        ['Name', 'Email', 'Phone', 'Role', 'Status', 'City', 'Joined'],
        ...res.users.map((u: AdminUser) => [
          u.name,
          u.email,
          u.phone ?? '',
          u.role,
          u.isSuspended ? 'Suspended' : 'Active',
          u.city ?? '',
          formatDate(u.createdAt),
        ]),
      ]);
    } catch {
      setError('Could not export the report.');
    } finally {
      setExporting(false);
    }
  }

  const people = stats ? stats.buyers + stats.sellers : 0;
  const posts = stats ? stats.listings + stats.jobs : 0;

  const tiles = stats
    ? [
        {
          label: 'Buyers',
          sub: 'Active buyers across categories',
          value: stats.buyers,
          icon: ShoppingBag,
          badge: `${pct(stats.buyers, people)}% of users`,
          badgeIcon: PieChart,
          bar: pct(stats.buyers, people),
          tab: 'users',
        },
        {
          label: 'Sellers',
          sub: 'Merchant stores onboarded',
          value: stats.sellers,
          icon: Store,
          badge: `${stats.activeSubscriptions} active`,
          badgeIcon: BadgeCheck,
          bar: pct(stats.sellers, people),
          tab: 'users',
        },
        {
          label: `New in ${stats.days} days`,
          sub: 'New platform registrations',
          value: stats.newUsers,
          icon: UserPlus,
          badge: `+${pct(stats.newUsers, people)}%`,
          badgeIcon: TrendingUp,
          bar: pct(stats.newUsers, people),
          tab: 'users',
        },
        {
          label: 'Suspended',
          sub: stats.suspended ? 'Accounts blocked from the platform' : 'Compliant standing, zero blocks',
          value: stats.suspended,
          icon: ShieldCheck,
          badge: `${100 - pct(stats.suspended, people)}% Clean`,
          bar: pct(stats.suspended, people),
          tone: 'plain' as const,
          iconTone: 'text-amber-500',
          tab: 'users',
        },
        {
          label: 'Shops & ads',
          sub: 'Live listings & store showcases',
          value: stats.listings,
          icon: Gift,
          badge: stats.sellers ? `${(stats.listings / stats.sellers).toFixed(1)} / seller` : 'No sellers',
          badgeIcon: Zap,
          bar: pct(stats.listings, posts),
        },
        {
          label: 'Job posts',
          sub: 'Freelance & neighbourhood hiring',
          value: stats.jobs,
          icon: Briefcase,
          badge: `${pct(stats.jobs, posts)}% of posts`,
          bar: pct(stats.jobs, posts),
          tone: 'accent' as const,
          iconTone: 'text-amber-500',
        },
        {
          label: 'Active subscriptions',
          sub: 'Paid store tier renewals',
          value: stats.activeSubscriptions,
          icon: CreditCard,
          badge: `${pct(stats.activeSubscriptions, stats.sellers)}% active`,
          bar: pct(stats.activeSubscriptions, stats.sellers),
          tab: 'subscriptions',
        },
        {
          label: 'Inactive subscriptions',
          sub: 'Lapsed or suspended seller tiers',
          value: stats.inactiveSubscriptions,
          icon: CircleSlash,
          badge: `${pct(stats.inactiveSubscriptions, stats.sellers)}% Churn`,
          bar: pct(stats.inactiveSubscriptions, stats.sellers),
          tone: 'plain' as const,
          iconTone: 'text-ink-muted',
          tab: 'subscriptions',
        },
      ]
    : [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/15 via-surface to-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Overview</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                </span>
                Live platform metrics
              </span>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
              A quick look at everyone and active operations on DukanCloude. Live account totals, store catalogs, and
              onboarding activity.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-start lg:items-end">
            <div className="flex flex-wrap gap-2">
              <RangeSelect value={days} onChange={onDaysChange} />
              <button
                type="button"
                onClick={exportReport}
                disabled={!stats || exporting}
                className="flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                <Download size={16} className={exporting ? 'animate-bounce' : ''} /> Export Report
              </button>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={onAnnounce}
                className="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 active:scale-[0.98]"
              >
                <Megaphone size={16} /> New Announcement
              </button>
              <button
                type="button"
                onClick={onAdvertise}
                className="flex h-10 items-center gap-2 rounded-xl border border-brand/40 bg-brand-soft px-4 text-sm font-semibold text-brand shadow-sm transition hover:border-brand hover:bg-brand hover:text-brand-ink active:scale-[0.98]"
              >
                <Sparkles size={16} /> New Advertisement
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        {error && <ErrorNote message={error} onRetry={loadStats} />}
        {!stats && !error && <LoadingRow label="Loading dashboard…" />}
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
          {tiles.map((t) => {
            const BadgeIcon = t.badgeIcon;
            const body = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-surface-hover ${t.iconTone ?? 'text-brand'}`}>
                    <t.icon size={20} />
                  </span>
                  <span
                    className={`inline-flex max-w-[60%] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      t.tone === 'plain'
                        ? 'bg-surface-hover text-ink'
                        : t.tone === 'accent'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-brand-soft text-brand'
                    }`}
                  >
                    {BadgeIcon && <BadgeIcon size={11} className="shrink-0" />}
                    <span className="truncate">{t.badge}</span>
                  </span>
                </div>
                <p className="mt-5 font-display text-4xl font-bold tabular-nums leading-none text-ink">{t.value}</p>
                <p className="mt-2 truncate font-display text-base font-semibold text-ink">{t.label}</p>
                <p className="mt-1 truncate text-xs text-ink-muted">{t.sub}</p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${t.tone === 'accent' ? 'bg-amber-500' : 'bg-brand'}`}
                    style={{ width: `${t.bar}%` }}
                  />
                </div>
              </>
            );
            return t.tab ? (
              <button
                key={t.label}
                type="button"
                onClick={() => onNavigate(t.tab!)}
                className={`${cardClass} p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40`}
              >
                {body}
              </button>
            ) : (
              <div key={t.label} className={`${cardClass} p-5`}>
                {body}
              </div>
            );
          })}
        </div>
      )}

      <LatestSignups total={people} refreshKey={refreshKey} onOpenUser={onOpenUser} onNavigate={onNavigate} onChanged={loadStats} />

      <PlatformInsights days={days} refreshKey={refreshKey} onNavigate={onNavigate} />
    </div>
  );
}

function LatestSignups({
  total,
  refreshKey,
  onOpenUser,
  onNavigate,
  onChanged,
}: {
  total: number;
  refreshKey: number;
  onOpenUser: (id: string) => void;
  onNavigate: (tab: string) => void;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState<RoleFilter>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; users: AdminUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // The table scrolls sideways, so the row menu is rendered `fixed` at the button's position.
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; up: boolean }>({ top: 0, right: 0, up: false });
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => setPage(1), [debounced, role]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.users({ q: debounced || undefined, role: role || undefined, page, pageSize: PAGE_SIZE }, token);
      setData({ total: res.total, users: res.users });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [token, debounced, role, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!menuFor) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuFor(null);
    const close = () => setMenuFor(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menuFor]);

  async function copyEmail(u: AdminUser) {
    setMenuFor(null);
    try {
      await navigator.clipboard.writeText(u.email);
      setCopied(u.id);
      setTimeout(() => setCopied((c) => (c === u.id ? null : c)), 1500);
    } catch {
      // clipboard blocked — nothing to do
    }
  }

  function onSuspendDone(updated: AdminUser) {
    setTarget(null);
    setData((d) => d && { ...d, users: d.users.map((u) => (u.id === updated.id ? updated : u)) });
    onChanged();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const from = data && data.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min(page * PAGE_SIZE, data.total) : 0;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <section className={`${cardClass} mt-6 overflow-hidden`}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-brand">
            <Users size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-ink">Latest sign-ups</h2>
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold text-ink">{total} Registered</span>
            </div>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-muted">
              Newest accounts first, with identity verification and account status.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 sm:items-start lg:items-stretch">
          <div className="flex flex-wrap gap-2.5">
            <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                aria-label="Search sign-ups"
                className="h-10 w-full rounded-xl border border-border bg-bg/60 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand/60 focus:outline-none"
              />
            </div>
            <label className="relative flex h-10 items-center gap-6 rounded-xl border border-border bg-bg/60 px-3 text-sm font-medium text-ink">
              {role === '' ? 'All Roles' : role === 'BUYER' ? 'Buyers' : 'Sellers'}
              <ChevronDown size={14} className="text-ink-muted" />
              <select
                aria-label="Filter by role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleFilter)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">All Roles</option>
                <option value="BUYER">Buyers</option>
                <option value="SELLER">Sellers</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="flex h-10 w-fit items-center gap-1.5 rounded-xl border border-border bg-bg/60 px-3.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
          >
            View all users <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="px-5 pb-5">
          <ErrorNote message={error} onRetry={load} />
        </div>
      ) : !data ? (
        <LoadingRow label="Loading sign-ups…" />
      ) : data.users.length === 0 ? (
        <p className="border-t border-border px-6 py-12 text-center text-sm text-ink-muted">
          {debounced || role ? 'No accounts match these filters.' : 'No users have signed up yet.'}
        </p>
      ) : (
        <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-bg/60 text-[11px] font-bold uppercase tracking-wide text-ink">
              <tr>
                <th className="px-6 py-3.5">User details</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Account status</th>
                <th className="px-4 py-3.5">Joined date</th>
                <th className="px-4 py-3.5">Last updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const seller = u.role === 'SELLER';
                const verified = u.isEmailVerified || u.isPhoneVerified;
                const fresh = Date.now() - new Date(u.updatedAt).getTime() < 24 * 3600 * 1000;
                return (
                  <tr key={u.id} className="border-t border-border/60 transition-colors hover:bg-surface-hover/50">
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => onOpenUser(u.id)} className="flex min-w-0 items-center gap-3 text-left">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            seller ? 'bg-brand-soft text-brand' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {initials(u.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold text-ink">
                            <span className="truncate">{u.name}</span>
                            {verified ? (
                              <BadgeCheck size={14} className="shrink-0 text-brand" aria-label="Verified" />
                            ) : (
                              <Info size={13} className="shrink-0 text-ink-muted" aria-label="Not verified" />
                            )}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">{copied === u.id ? 'Email copied ✓' : u.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${
                          seller ? 'bg-brand-soft text-brand' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {seller ? <Store size={12} /> : <ShoppingBag size={12} />}
                        {seller ? 'Seller' : 'Buyer'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge user={u} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-ink">{formatDate(u.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 ${fresh ? 'text-ink' : 'text-ink-muted'}`}>
                        <Clock size={13} className={fresh ? 'text-brand' : ''} />
                        {timeAgo(u.updatedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative flex items-center justify-end gap-1" ref={menuFor === u.id ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={() => onOpenUser(u.id)}
                          aria-label={`View ${u.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            const up = window.innerHeight - r.bottom < 150;
                            setMenuPos({ top: up ? r.top - 4 : r.bottom + 4, right: window.innerWidth - r.right, up });
                            setMenuFor((m) => (m === u.id ? null : u.id));
                          }}
                          aria-label={`More actions for ${u.name}`}
                          aria-expanded={menuFor === u.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                        >
                          <MoreVertical size={17} />
                        </button>
                        {menuFor === u.id && (
                          <div
                            style={{ top: menuPos.top, right: menuPos.right }}
                            className={`fixed z-50 w-48 rounded-xl ${menuPos.up ? '-translate-y-full' : 'animate-slide-down'} border border-border bg-surface p-1 text-left shadow-[0_16px_40px_-14px_rgb(0_0_0_/_0.35)]`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setMenuFor(null);
                                onOpenUser(u.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink hover:bg-surface-hover"
                            >
                              <Eye size={14} /> View details
                            </button>
                            <button
                              type="button"
                              onClick={() => copyEmail(u)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink hover:bg-surface-hover"
                            >
                              <Copy size={14} /> Copy email
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuFor(null);
                                setTarget(u);
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                                u.isSuspended
                                  ? 'text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'
                                  : 'text-red-600 hover:bg-red-500/10 dark:text-red-400'
                              }`}
                            >
                              {u.isSuspended ? <RotateCcw size={14} /> : <Ban size={14} />}
                              {u.isSuspended ? 'Reactivate account' : 'Suspend account'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
          <p className="text-xs text-ink-muted sm:text-sm">
            Showing {from}–{to} of {data.total} registered {data.total === 1 ? 'account' : 'accounts'}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="h-8 rounded-lg px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Previous
            </button>
            {pages.map((p, i) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-xs text-ink-muted">…</span>}
                <button
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-bold transition-colors ${
                    p === page ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              className="h-8 rounded-lg px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <SuspendDialog user={target} onClose={() => setTarget(null)} onDone={onSuspendDone} />
    </section>
  );
}
