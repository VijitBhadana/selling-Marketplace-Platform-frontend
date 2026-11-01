'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AdminUser } from './shared';

const WHO: Record<AdminUser['role'], string> = { BUYER: 'buyer', SELLER: 'seller', DELIVERY: 'delivery partner' };

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Confirms deleting an account for good, then calls the API. */
export function DeleteUserDialog({
  user,
  onClose,
  onDone,
}: {
  user: Pick<AdminUser, 'id' | 'name' | 'email' | 'role' | '_count'> | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const userId = user?.id;

  useEffect(() => {
    setBusy(false);
    setError(null);
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busyRef.current && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [userId]);

  if (!user) return null;
  const orders = user._count.ordersAsBuyer + user._count.ordersAsSeller;
  const linked = [
    user._count.listings > 0 && plural(user._count.listings, 'shop'),
    user._count.jobsPosted > 0 && plural(user._count.jobsPosted, 'job post'),
    orders > 0 && plural(orders, 'order'),
  ].filter(Boolean);

  async function confirm() {
    if (!token || !user) return;
    setBusy(true);
    setError(null);
    try {
      await api.admin.deleteUser(user.id, token);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the account.');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title" className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-card animate-fade-in-up">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
          <Trash2 size={20} />
        </span>
        <h2 id="delete-user-title" className="mt-4 font-display text-lg font-bold text-ink">
          Delete this {WHO[user.role]}?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">{user.name}</span> ({user.email}) will be deleted from the database for good, with their
          shops, job posts, orders, chats, reviews and documents. This can’t be undone.
        </p>
        {linked.length > 0 && (
          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-600 dark:text-red-400">
            This removes {linked.join(', ')}
            {orders > 0 ? ' — orders also disappear from the other buyer’s or seller’s history.' : '.'}
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-10 flex-1 rounded-xl border border-border text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
