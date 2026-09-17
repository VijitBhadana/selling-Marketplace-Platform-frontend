'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Briefcase, Check, Eye, EyeOff, Loader2, Lock, Mail, Phone, ShoppingBag, User } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
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

type Role = 'BUYER' | 'SELLER';

const roles = [
  { value: 'BUYER', label: 'Buyer', text: 'Browse, book & buy', icon: ShoppingBag },
  { value: 'SELLER', label: 'Seller', text: 'List shop & services', icon: Briefcase },
] as const;

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('BUYER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.register({ name, email, password, phone, role });
      const params = new URLSearchParams({ email });
      if (next) params.set('next', next);
      startTopLoader(`/verify-otp?${params.toString()}`);
      router.push(`/verify-otp?${params.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. The backend server may be offline.');
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">I want to sign up as</p>
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ value, label, text, icon: Icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  aria-pressed={active}
                  className={`relative flex flex-col items-start gap-2.5 rounded-2xl border p-3.5 text-left transition-all ${
                    active
                      ? 'border-brand bg-brand-soft/70 ring-4 ring-brand/10'
                      : 'border-border hover:border-ink-muted/40 hover:bg-surface-hover'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      active ? 'bg-brand text-brand-ink' : 'bg-bg text-ink-muted'
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>{label}</span>
                    <span className="block text-xs text-ink-muted">{text}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                      active ? 'border-brand bg-brand text-brand-ink' : 'border-border'
                    }`}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AuthField id="register-name" label="Full name" icon={User}>
          <input
            id="register-name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className={`${authInputClass} pl-11 pr-4`}
          />
        </AuthField>

        <AuthField id="register-email" label="Email" icon={Mail}>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${authInputClass} pl-11 pr-4`}
          />
        </AuthField>

        <AuthField id="register-phone" label="Phone" hint="For OTP verification" icon={Phone}>
          <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 border-r border-border pr-2.5 text-[15px] text-ink-muted">
            +91
          </span>
          <input
            id="register-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            className={`${authInputClass} pl-[5.6rem] pr-4`}
          />
        </AuthField>

        <AuthField
          id="register-password"
          label="Password"
          icon={Lock}
          after={
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
                password.length >= 6 ? 'text-brand' : 'text-ink-muted'
              }`}
            >
              <Check size={13} strokeWidth={2.5} /> At least 6 characters
            </p>
          }
        >
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
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
              <Loader2 size={17} className="animate-spin" /> Creating account…
            </>
          ) : (
            <>
              {`Create account as ${role === 'BUYER' ? 'Buyer' : 'Seller'}`}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <AuthSwitch
        prompt="Already have an account?"
        href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
        cta="Log in"
      />
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      panelTitle="Open your dukan on the cloud."
      panelText="Join buyers and sellers discovering shops, services, jobs and bookings near them."
      title="Create your account"
      subtitle="Buy, sell, and book across every Cloude."
    >
      <Suspense fallback={<AuthFormFallback fields={5} />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
