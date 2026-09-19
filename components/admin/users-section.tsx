'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, ChevronLeft, ChevronRight, RotateCcw, Search, Users } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  AdminUser,
  Avatar,
  EmptyState,
  ErrorNote,
  LoadingRow,
  RoleBadge,
  SectionHeader,
  Segmented,
  StatusBadge,
  cardClass,
  formatDate,
  inputClass,
} from './shared';
import { SuspendDialog } from './suspend-dialog';

type RoleFilter = 'ALL' | 'BUYER' | 'SELLER';
type StatusFilter = 'all' | 'active' | 'suspended';

const PAGE_SIZE = 20;

export function UsersSection({
  refreshKey,
  onOpenUser,
  initialQuery = '',
}: {
  refreshKey: number;
  onOpenUser: (id: string) => void;
  initialQuery?: string;
}) {
  const { token } = useAuth();
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery.trim());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; users: AdminUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<AdminUser | null>(null);

  // A new search or filter goes back to page 1 in the same update — resetting it in a
  // separate effect fetched the old page first and then page 1 (two requests, and the
  // slower one could win).
  useEffect(() => {
    const next = query.trim();
    if (next === debounced) return;
    const t = setTimeout(() => {
      setDebounced(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query, debounced]);

  const changeRole = useCallback((next: RoleFilter) => {
    setRole(next);
    setPage(1);
  }, []);

  const changeStatus = useCallback((next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.users(
        {
          role: role === 'ALL' ? undefined : role,
          status: status === 'all' ? undefined : status,
          q: debounced || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
        token,
      );
      setData({ total: res.total, users: res.users });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [token, role, status, debounced, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function onSuspendDone(updated: AdminUser) {
    setTarget(null);
    setData((d) => d && { ...d, users: d.users.map((u) => (u.id === updated.id ? updated : u)) });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const suspendButton = (u: AdminUser, compact = false) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setTarget(u);
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        u.isSuspended
          ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'
          : 'border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400'
      } ${compact ? 'flex-1' : ''}`}
    >
      {u.isSuspended ? <RotateCcw size={13} /> : <Ban size={13} />}
      {u.isSuspended ? 'Reactivate' : 'Suspend'}
    </button>
  );

  return (
    <div>
      <SectionHeader title="Users" subtitle="Every buyer and seller, with their sign-up date and account status.">
        {data && <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{data.total} users</span>}
      </SectionHeader>

      <div className={`${cardClass} mb-4 flex flex-col gap-3 p-3 md:flex-row md:items-center`}>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search users</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone or city"
            className={`${inputClass} pl-9`}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Segmented
            label="Role"
            value={role}
            onChange={changeRole}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'BUYER', label: 'Buyers' },
              { value: 'SELLER', label: 'Sellers' },
            ]}
          />
          <Segmented
            label="Status"
            value={status}
            onChange={changeStatus}
            options={[
              { value: 'all', label: 'Any status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </div>
      </div>

      {error && <ErrorNote message={error} onRetry={load} />}

      <div className={`${cardClass} overflow-hidden`}>
        {loading && !data ? (
          <LoadingRow label="Loading users…" />
        ) : data && data.users.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="No users found" text="Try a different search or filter." />
        ) : data ? (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Table — tablets and up */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg/60 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Posts</th>
                    <th className="px-4 py-3">Signed up</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.users.map((u) => (
                    <tr key={u.id} onClick={() => onOpenUser(u.id)} className="cursor-pointer transition-colors hover:bg-surface-hover">
                      <td className="max-w-[260px] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{u.name}</p>
                            <p className="truncate text-xs text-ink-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-ink-muted lg:table-cell">
                        {u._count.listings} shops · {u._count.jobsPosted} jobs
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDate(u.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge user={u} />
                      </td>
                      <td className="px-4 py-3 text-right">{suspendButton(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — phones */}
            <ul className="divide-y divide-border md:hidden">
              {data.users.map((u) => (
                <li key={u.id} className="p-4">
                  <button type="button" onClick={() => onOpenUser(u.id)} className="flex w-full items-start gap-3 text-left">
                    <Avatar name={u.name} className="h-10 w-10 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{u.name}</span>
                      <span className="block truncate text-xs text-ink-muted">{u.email}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={u.role} />
                        <StatusBadge user={u} />
                      </span>
                    </span>
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-muted">
                    <span>
                      Joined {formatDate(u.createdAt)}
                      {u.phone ? ` · ${u.phone}` : ''}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenUser(u.id)}
                      className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover"
                    >
                      View details
                    </button>
                    {suspendButton(u, true)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-ink-muted">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <SuspendDialog user={target} onClose={() => setTarget(null)} onDone={onSuspendDone} />
    </div>
  );
}
