'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Megaphone, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Segmented, inputClass } from './shared';

type Audience = 'ALL' | 'BUYER' | 'SELLER';

/** Sends an announcement to every buyer and/or seller's notification bell. */
export function AnnouncementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('ALL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setBody('');
    setAudience('ALL');
    setError(null);
    setSent(null);
    setBusy(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const valid = title.trim().length >= 3 && body.trim().length >= 3;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.admin.announce({ title: title.trim(), body: body.trim(), audience }, token);
      setSent(res.sent);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the announcement.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announce-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Megaphone size={20} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {sent !== null ? (
          <div className="mt-4">
            <h2 id="announce-title" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <CheckCircle2 size={18} className="text-emerald-500" /> Announcement sent
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Delivered to {sent} {sent === 1 ? 'account' : 'accounts'}. It shows up in their notification bell.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 h-10 w-full rounded-xl bg-brand text-sm font-semibold text-brand-ink transition hover:brightness-110"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="mt-4 space-y-4">
            <div>
              <h2 id="announce-title" className="font-display text-lg font-bold text-ink">
                New announcement
              </h2>
              <p className="mt-1 text-sm text-ink-muted">Posts a notification to everyone in the audience you pick.</p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-muted">Audience</p>
              <Segmented
                label="Audience"
                value={audience}
                onChange={setAudience}
                options={[
                  { value: 'ALL', label: 'Everyone' },
                  { value: 'BUYER', label: 'Buyers' },
                  { value: 'SELLER', label: 'Sellers' },
                ]}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-muted">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Diwali sale starts Friday"
                className={inputClass}
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex justify-between text-xs font-semibold text-ink-muted">
                Message <span className="font-normal tabular-nums">{body.length}/500</span>
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="What should everyone know?"
                className={`${inputClass} h-auto resize-none py-2.5`}
              />
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="h-10 flex-1 rounded-xl border border-border text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!valid || busy}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
