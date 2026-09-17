'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ShoppingBag, Tag, X } from 'lucide-react';
import { useAuth, type AuthIntent } from '@/lib/auth-context';

const INTENT_COPY: Record<AuthIntent, { title: string; subtitle: string; icon: React.ReactNode }> = {
  default: {
    title: 'Log in to continue',
    subtitle: 'Access your listings, chats, and wishlist.',
    icon: <Lock size={18} strokeWidth={2} />,
  },
  'post-ad': {
    title: 'Log in to post your ad',
    subtitle: "You're one step away from listing on DukanCloude — log in first.",
    icon: <Tag size={18} strokeWidth={2} />,
  },
  purchase: {
    title: 'Log in to continue',
    subtitle: 'Please log in so the seller knows who is reaching out.',
    icon: <ShoppingBag size={18} strokeWidth={2} />,
  },
};

export function AuthModal() {
  const { isAuthModalOpen, authIntent, login, cancelAuthModal, hideAuthModal } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setLoading(false);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancelAuthModal();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen, cancelAuthModal]);

  if (!isAuthModalOpen) return null;

  const copy = INTENT_COPY[authIntent];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Could not log in. Check your details, or make sure the backend server is running.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/50 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && cancelAuthModal()}
    >
      <div className="relative w-full max-w-[380px] rounded-2xl border border-border bg-surface p-7 shadow-card animate-fade-in-up" style={{ animationDuration: '0.22s' }}>
        <button
          type="button"
          onClick={cancelAuthModal}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <X size={15} />
        </button>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
          {copy.icon}
        </span>
        <h2 className="mt-4 font-display text-[1.15rem] font-bold tracking-tight text-ink">{copy.title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/90 disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="pt-1 text-center text-[13px] text-ink-muted">
            New to DukanCloude?{' '}
            <Link href="/register" onClick={hideAuthModal} className="font-semibold text-brand hover:underline">
              Create a new account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
