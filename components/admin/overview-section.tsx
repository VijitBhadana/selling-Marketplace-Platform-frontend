'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, Briefcase, CircleSlash, CreditCard, ShoppingBag, Store, Tag, UserPlus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  AdminUser,
  Avatar,
  ErrorNote,
  LoadingRow,
  RoleBadge,
  SectionHeader,
  StatusBadge,
  cardClass,
  formatDate,
} from './shared';

type Stats = {
  buyers: number;
  sellers: number;
  suspended: number;
  newUsersLast30Days: number;
  listings: number;
  jobs: number;
  activeSubscriptions: number;
  inactiveSubscriptions: number;
};

export function OverviewSection({ onOpenUser, onNavigate }: { onOpenUser: (id: string) => void; onNavigate: (tab: string) => void }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [s, r] = await Promise.all([api.admin.stats(token), api.admin.users({ pageSize: 6 }, token)]);
      setStats(s);
      setRecent(r.users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the dashboard.');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const tiles = stats
    ? [
        { label: 'Buyers', value: stats.buyers, icon: <ShoppingBag size={18} />, tab: 'users' },
        { label: 'Sellers', value: stats.sellers, icon: <Store size={18} />, tab: 'users' },
        { label: 'New in 30 days', value: stats.newUsersLast30Days, icon: <UserPlus size={18} />, tab: 'users' },
        { label: 'Suspended', value: stats.suspended, icon: <Ban size={18} />, tab: 'users' },
        { label: 'Shops & ads', value: stats.listings, icon: <Tag size={18} /> },
        { label: 'Job posts', value: stats.jobs, icon: <Briefcase size={18} /> },
        { label: 'Active subscriptions', value: stats.activeSubscriptions, icon: <CreditCard size={18} />, tab: 'subscriptions' },
        { label: 'Inactive subscriptions', value: stats.inactiveSubscriptions, icon: <CircleSlash size={18} />, tab: 'subscriptions' },
      ]
    : [];

  return (
    <div>
      <SectionHeader title="Overview" subtitle="A quick look at everyone on DukanCloude." />

      {error && <ErrorNote message={error} onRetry={load} />}
      {!stats && !error && <LoadingRow label="Loading dashboard…" />}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => {
              const body = (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">{t.icon}</span>
                  <p className="mt-3 truncate font-display text-2xl font-bold tabular-nums text-ink">{t.value}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-ink-muted">{t.label}</p>
                </>
              );
              return t.tab ? (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => onNavigate(t.tab!)}
                  className={`${cardClass} p-4 text-left transition-colors hover:border-brand`}
                >
                  {body}
                </button>
              ) : (
                <div key={t.label} className={`${cardClass} p-4`}>
                  {body}
                </div>
              );
            })}
          </div>

          <div className={`${cardClass} mt-6 overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Latest sign-ups</h2>
              <button type="button" onClick={() => onNavigate('users')} className="text-xs font-semibold text-brand hover:underline">
                View all users
              </button>
            </div>
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">No users have signed up yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => onOpenUser(u.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                    >
                      <Avatar name={u.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{u.name}</span>
                        <span className="block truncate text-xs text-ink-muted">{u.email}</span>
                      </span>
                      <span className="hidden flex-col items-end gap-1 sm:flex">
                        <span className="flex gap-1.5">
                          <RoleBadge role={u.role} />
                          <StatusBadge user={u} />
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-ink-muted">
                        <span className="block sm:hidden">
                          <RoleBadge role={u.role} />
                        </span>
                        <span className="mt-1 block sm:mt-0">{formatDate(u.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
