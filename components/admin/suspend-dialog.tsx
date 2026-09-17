'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, Loader2, RotateCcw } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AdminUser } from './shared';

/** Confirms suspending / reactivating an account, then calls the API. */
export function SuspendDialog({
  user,
  onClose,
  onDone,
}: {
  user: Pick<AdminUser, 'id' | 'name' | 'email' | 'role' | 'isSuspended'> | null;
  onClose: () => void;
  onDone: (updated: AdminUser) => void;
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const userId = user?.id;

  useEffect(() => {
    setBusy(false);
    setError(null);
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [userId]);

  if (!user) return null;
  const suspending = !user.isSuspended;
  const who = user.role === 'SELLER' ? 'seller' : 'buyer';

  async function confirm() {
    if (!token || !user) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api.admin.setSuspended(user.id, suspending, token);
      onDone(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the account.');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="suspend-title" className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-card animate-fade-in-up">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            suspending ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {suspending ? <Ban size={20} /> : <RotateCcw size={20} />}
        </span>
        <h2 id="suspend-title" className="mt-4 font-display text-lg font-bold text-ink">
          {suspending ? `Suspend this ${who}?` : `Reactivate this ${who}?`}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">{user.name}</span> ({user.email}){' '}
          {suspending
            ? 'will be logged out and won’t be able to log in, order, or manage their posts until you reactivate the account.'
            : 'will be able to log in and use DukanCloude again. Any COD no-show strikes are cleared.'}
        </p>
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
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              suspending ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {suspending ? 'Suspend' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}
