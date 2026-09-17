'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Cloud, MailCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AuthFormSkeleton } from '@/components/skeleton';
import { startTopLoader } from '@/components/top-loader';

function VerifyOtpForm() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const next = searchParams.get('next');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp(email, otp);
      setSession(res.accessToken, res.user);
      startTopLoader(next || '/');
      router.push(next || '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify the OTP. The backend server may be offline.');
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await api.auth.resendOtp(email);
      setInfo('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the OTP.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-bg px-4 py-14 sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <div className="mb-7 flex flex-col items-center text-center">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-ink">
              <MailCheck size={20} strokeWidth={2.2} />
            </span>
            <h1 className="font-display text-[1.6rem] font-bold tracking-tight text-ink">Verify your email</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              We sent a 6-digit code to <span className="font-medium text-ink">{email || 'your email'}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                OTP code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}
            {info && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] text-brand">{info}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-4 w-full text-center text-sm font-medium text-brand hover:underline disabled:opacity-50"
          >
            {resending ? 'Resending…' : "Didn't get it? Resend OTP"}
          </button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-ink-muted">
          <Cloud size={14} />
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={1} />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
