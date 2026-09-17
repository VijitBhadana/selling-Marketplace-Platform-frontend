'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import {
  AuthError,
  AuthField,
  AuthFormFallback,
  AuthShell,
  AuthSwitch,
  authInputClass,
  authSubmitClass,
} from '@/components/auth-shell';
import { startTopLoader } from '@/components/top-loader';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
  const next = searchParams.get('next');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ranPendingAction = await login(email, password);
      if (!ranPendingAction) {
        startTopLoader(next || '/');
        router.push(next || '/');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Make sure the backend server is running.');
      setLoading(false);
    }
  }

  return (
    <>
      {justRegistered && (
        <p className="mb-6 flex items-center gap-2.5 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
          <Sparkles size={16} className="shrink-0" /> Account created — log in to get started.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField id="login-email" label="Email" icon={Mail}>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${authInputClass} pl-11 pr-4`}
          />
        </AuthField>

        <AuthField id="login-password" label="Password" icon={Lock}>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`${authInputClass} pl-11 pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </AuthField>

        {error && <AuthError message={error} />}

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Logging in…
            </>
          ) : (
            <>
              Log in
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <AuthSwitch
        prompt="New to DukanCloude?"
        href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
        cta="Create a new account"
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      panelTitle="Your local market, right where you left it."
      panelText="Pick up your chats, saved listings and bookings across every Cloude."
      title="Welcome back"
      subtitle="Log in to access your listings, chats, and wishlist."
    >
      <Suspense fallback={<AuthFormFallback fields={2} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
