'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, MailCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthError, AuthField, AuthFormFallback, AuthShell, authInputClass, authSubmitClass } from '@/components/auth-shell';
import { startTopLoader } from '@/components/top-loader';

// Matches the backend's one-code-a-minute cooldown.
const RESEND_COOLDOWN_S = 60;

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next');

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  async function sendCode() {
    await api.auth.forgotPassword(email.trim());
    setCooldown(RESEND_COOLDOWN_S);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await sendCode();
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    try {
      await sendCode();
      setInfo('A new code is on its way — check your inbox and spam folder.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code.');
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    try {
      await api.auth.resetPassword(email.trim(), otp, password);
      const params = new URLSearchParams({ reset: '1', email: email.trim() });
      if (next) params.set('next', next);
      startTopLoader(`/login?${params.toString()}`);
      router.push(`/login?${params.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset the password. The backend server may be offline.');
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <>
        <form onSubmit={handleSendCode} className="space-y-5">
          <AuthField id="forgot-email" label="Email" icon={Mail}>
            <input
              id="forgot-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${authInputClass} pl-11 pr-4`}
            />
          </AuthField>

          {error && <AuthError message={error} />}

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Sending code…
              </>
            ) : (
              <>
                Send reset code
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <BackToLogin href={loginHref} />
      </>
    );
  }

  return (
    <>
      <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm text-brand">
        <MailCheck size={16} className="mt-0.5 shrink-0" />
        <span>
          If <span className="font-semibold">{email.trim()}</span> has an account, a 6-digit code is on its way. It expires
          in 10 minutes.
        </span>
      </p>

      <form onSubmit={handleReset} className="space-y-5">
        <AuthField id="reset-otp" label="Reset code" icon={KeyRound}>
          <input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className={`${authInputClass} pl-11 pr-4 tracking-[0.4em]`}
          />
        </AuthField>

        <AuthField id="reset-password" label="New password" hint="At least 6 characters" icon={Lock}>
          <input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
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

        <AuthField id="reset-confirm" label="Confirm new password" icon={Lock}>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`${authInputClass} pl-11 pr-4`}
          />
        </AuthField>

        {error && <AuthError message={error} />}
        {info && <p className="rounded-xl bg-brand-soft px-4 py-3 text-[13px] text-brand">{info}</p>}

        <button type="submit" disabled={loading || otp.length !== 6} className={authSubmitClass}>
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Updating password…
            </>
          ) : (
            <>
              Reset password
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setOtp('');
            setError(null);
            setInfo(null);
          }}
          className="font-medium text-ink-muted transition-colors hover:text-ink"
        >
          Use a different email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-medium text-brand hover:underline disabled:pointer-events-none disabled:text-ink-muted"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <BackToLogin href={loginHref} />
    </>
  );
}

function BackToLogin({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand hover:underline"
    >
      <ArrowLeft size={15} /> Back to log in
    </Link>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      panelTitle="Locked out? It happens."
      panelText="We'll email you a code so you can set a new password and get back to your chats, listings and bookings."
      title="Forgot password?"
      subtitle="Enter the email you signed up with and we'll send you a 6-digit reset code."
    >
      <Suspense fallback={<AuthFormFallback fields={1} />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
