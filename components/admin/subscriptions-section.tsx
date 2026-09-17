'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Search } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Avatar,
  EmptyState,
  ErrorNote,
  LoadingRow,
  SectionHeader,
  Segmented,
  SellerSubscription,
  SubscriptionBadge,
  cardClass,
  formatAmount,
  formatDate,
  inputClass,
} from './shared';

type StatusFilter = 'all' | 'active' | 'inactive';

function lastPaymentText(s: SellerSubscription) {
  const p = s.lastPayment;
  return p ? `${formatAmount(p.amount)} · ${formatDate(p.paidAt)}` : null;
}

export function SubscriptionsSection({ onOpenUser }: { onOpenUser: (id: string) => void }) {
  const { token } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [subs, setSubs] = useState<SellerSubscription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setSubs(await api.admin.subscriptions({ status: status === 'all' ? undefined : status, q: debounced || undefined }, token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, [token, status, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const active = subs?.filter((s) => s.status === 'ACTIVE').length ?? 0;
  const showPayments = subs?.some((s) => s.lastPayment) ?? false;

  return (
    <div>
      <SectionHeader title="Subscriptions" subtitle="Every seller account has a subscription — active until the account is suspended.">
        {subs && subs.length > 0 && (
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {subs.length} sellers · {active} active
          </span>
        )}
      </SectionHeader>

      <div className={`${cardClass} mb-4 flex flex-col gap-3 p-3 md:flex-row md:items-center`}>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search sellers</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search seller name, email, phone or city"
            className={`${inputClass} pl-9`}
          />
        </label>
        <Segmented
          label="Subscription status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {error && <ErrorNote message={error} onRetry={load} />}

      <div className={`${cardClass} overflow-hidden`}>
        {loading && !subs ? (
          <LoadingRow label="Loading subscriptions…" />
        ) : subs && subs.length === 0 ? (
          <EmptyState icon={<CreditCard size={22} />} title="No subscriptions found" text="No seller account matches this search or filter." />
        ) : subs ? (
          <div className={loading ? 'opacity-60' : ''}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg/60 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="hidden px-4 py-3 lg:table-cell">City</th>
                    <th className="px-4 py-3">Subscribed on</th>
                    {showPayments && <th className="px-4 py-3">Last payment</th>}
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subs.map((s) => (
                    <tr key={s.id} onClick={() => onOpenUser(s.id)} className="cursor-pointer transition-colors hover:bg-surface-hover">
                      <td className="max-w-[280px] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{s.name}</p>
                            <p className="truncate text-xs text-ink-muted">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{s.phone ?? '—'}</td>
                      <td className="hidden px-4 py-3 text-ink-muted lg:table-cell">{s.city ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{formatDate(s.subscribedAt)}</td>
                      {showPayments && <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{lastPaymentText(s) ?? '—'}</td>}
                      <td className="whitespace-nowrap px-4 py-3">
                        <SubscriptionBadge active={s.status === 'ACTIVE'} />
                        {s.status === 'INACTIVE' && s.suspendedAt && (
                          <span className="mt-1 block text-[11px] text-ink-muted">since {formatDate(s.suspendedAt)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {subs.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onOpenUser(s.id)} className="flex w-full items-start gap-3 p-4 text-left">
                    <Avatar name={s.name} className="h-10 w-10 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{s.name}</span>
                          <span className="block truncate text-xs text-ink-muted">{s.email}</span>
                        </span>
                        <SubscriptionBadge active={s.status === 'ACTIVE'} />
                      </span>
                      <span className="mt-2 block text-xs text-ink-muted">
                        Subscribed on <span className="font-medium text-ink">{formatDate(s.subscribedAt)}</span>
                        {s.phone ? ` · ${s.phone}` : ''}
                      </span>
                      {lastPaymentText(s) && <span className="mt-1 block text-xs text-ink-muted">Last payment {lastPaymentText(s)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
