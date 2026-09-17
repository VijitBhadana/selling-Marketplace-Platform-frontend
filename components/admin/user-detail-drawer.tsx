'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Ban, Briefcase, CreditCard, ExternalLink, RotateCcw, Store, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  AdminUser,
  AdminUserDetail,
  Avatar,
  ErrorNote,
  LoadingRow,
  RoleBadge,
  StatusBadge,
  SubscriptionBadge,
  formatAmount,
  formatDate,
} from './shared';
import { SuspendDialog } from './suspend-dialog';

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

function Block({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="text-brand">{icon}</span> {title}
        <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[11px] text-ink-muted">{count}</span>
      </h3>
      {children}
    </section>
  );
}

export function UserDetailDrawer({
  userId,
  onClose,
  onChanged,
}: {
  userId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setUser(null);
    setError(null);
    setConfirming(false);
    if (!userId || !token) return;
    let cancelled = false;
    api.admin
      .user(userId, token)
      .then((u) => !cancelled && setUser(u))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : 'Could not load this user.'));
    return () => {
      cancelled = true;
    };
  }, [userId, token]);

  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [userId]);

  if (!userId) return null;

  function onSuspendDone(updated: AdminUser) {
    setConfirming(false);
    setUser((u) => u && { ...u, ...updated });
    onChanged();
  }

  const isSeller = user?.role === 'SELLER';

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-ink/40 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="User details"
        className="flex h-full w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl animate-fade-in-up"
        style={{ animationDuration: '0.2s' }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">User details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {error && <ErrorNote message={error} />}
          {!user && !error && <LoadingRow label="Loading user…" />}

          {user && (
            <>
              <div className="flex items-center gap-4">
                <Avatar name={user.name} className="h-14 w-14 text-xl" />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold text-ink">{user.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <RoleBadge role={user.role} />
                    <StatusBadge user={user} />
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-border bg-bg/50 p-4 sm:grid-cols-2">
                <Detail label="Email" value={`${user.email}${user.isEmailVerified ? ' ✓' : ''}`} />
                <Detail label="Phone" value={user.phone ? `${user.phone}${user.isPhoneVerified ? ' ✓' : ''}` : '—'} />
                <Detail label="City" value={[user.city, user.pincode].filter(Boolean).join(' · ') || '—'} />
                <Detail label="Signed up" value={formatDate(user.createdAt, true)} />
                <Detail label="Last updated" value={formatDate(user.updatedAt, true)} />
                <Detail label="Orders" value={`${user._count.ordersAsBuyer} placed · ${user._count.ordersAsSeller} received`} />
                {user.codStrikeCount > 0 && <Detail label="COD no-show strikes" value={user.codStrikeCount} />}
                {user.isSuspended && (
                  <Detail
                    label="Suspended"
                    value={`${formatDate(user.suspendedAt, true)} · ${user.suspendedBy === 'COD_NO_SHOW' ? 'COD no-shows' : 'by admin'}`}
                  />
                )}
              </dl>

              {isSeller && (
                <>
                  <section className="mt-6">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                      <span className="text-brand">
                        <CreditCard size={15} />
                      </span>
                      Subscription
                    </h3>
                    <div className="rounded-xl border border-border px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink">Seller subscription</span>
                        <SubscriptionBadge active={!user.isSuspended} />
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Subscribed on {formatDate(user.createdAt)}
                        {user.isSuspended ? ` · inactive since ${formatDate(user.suspendedAt)}` : ''}
                      </p>
                      {user.subscriptions.map((p, i) => (
                        <p key={i} className="mt-1 text-xs text-ink-muted">
                          Paid {formatAmount(p.amount)} on {formatDate(p.paidAt)}
                          {p.expiresAt ? ` · valid till ${formatDate(p.expiresAt)}` : ''}
                        </p>
                      ))}
                    </div>
                  </section>

                  <Block icon={<Store size={15} />} title="Shops & ads" count={user.listings.length}>
                    {user.listings.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-ink-muted">Nothing posted.</p>
                    ) : (
                      <ul className="space-y-2">
                        {user.listings.map((l) => (
                          <li key={l.id}>
                            <Link
                              href={`/listing/${l.id}`}
                              target="_blank"
                              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-brand"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold text-ink">{l.shopName || l.title}</span>
                                <span className="block truncate text-xs text-ink-muted">
                                  {l.cloude.name} · {l.category.name} · {l.status.toLowerCase()} · {formatDate(l.createdAt)}
                                </span>
                              </span>
                              <ExternalLink size={14} className="shrink-0 text-ink-muted" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Block>

                  <Block icon={<Briefcase size={15} />} title="Job posts" count={user.jobsPosted.length}>
                    {user.jobsPosted.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-ink-muted">No jobs posted.</p>
                    ) : (
                      <ul className="space-y-2">
                        {user.jobsPosted.map((j) => (
                          <li key={j.id}>
                            <Link
                              href={`/jobs/${j.id}`}
                              target="_blank"
                              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-brand"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold text-ink">{j.title}</span>
                                <span className="block truncate text-xs text-ink-muted">
                                  {j.companyName}
                                  {j.location ? ` · ${j.location}` : ''} · {j.isClosed ? 'closed' : j.isFilled ? 'filled' : 'open'} ·{' '}
                                  {formatDate(j.createdAt)}
                                </span>
                              </span>
                              <ExternalLink size={14} className="shrink-0 text-ink-muted" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Block>
                </>
              )}
            </>
          )}
        </div>

        {user && (
          <div className="border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors ${
                user.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {user.isSuspended ? <RotateCcw size={16} /> : <Ban size={16} />}
              {user.isSuspended ? 'Reactivate account' : 'Suspend account'}
            </button>
          </div>
        )}
      </aside>

      <SuspendDialog user={confirming ? user : null} onClose={() => setConfirming(false)} onDone={onSuspendDone} />
    </div>
  );
}
