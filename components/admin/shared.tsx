'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'BUYER' | 'SELLER';
  city: string | null;
  pincode: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedBy: 'COD_NO_SHOW' | 'ADMIN' | null;
  codStrikeCount: number;
  createdAt: string;
  updatedAt: string;
  _count: { listings: number; jobsPosted: number; ordersAsBuyer: number; ordersAsSeller: number; subscriptions: number };
};

export type Payment = {
  planName: string;
  amount: string;
  paidAt: string;
  expiresAt: string | null;
  paymentRef: string | null;
};

/** Every seller account is a subscriber, active until the admin suspends it. */
export type SellerSubscription = Pick<AdminUser, 'id' | 'name' | 'email' | 'phone' | 'city' | 'isSuspended' | 'suspendedAt' | 'suspendedBy'> & {
  subscribedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastPayment: Payment | null;
};

export type AdminUserDetail = AdminUser & {
  listings: {
    id: string;
    title: string;
    shopName: string | null;
    status: string;
    city: string | null;
    createdAt: string;
    cloude: { name: string };
    category: { name: string };
  }[];
  jobsPosted: {
    id: string;
    title: string;
    companyName: string;
    location: string | null;
    isClosed: boolean;
    isFilled: boolean;
    createdAt: string;
  }[];
  subscriptions: Payment[];
};

export function SubscriptionBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function formatAmount(value: string | number) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function Avatar({ name, className = 'h-9 w-9 text-sm' }: { name: string; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 font-bold text-brand-ink ${className}`}
    >
      {name?.charAt(0).toUpperCase() || 'U'}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        role === 'SELLER' ? 'bg-brand-soft text-brand' : 'bg-accent-soft text-accent'
      }`}
    >
      {role === 'SELLER' ? 'Seller' : 'Buyer'}
    </span>
  );
}

export function StatusBadge({ user }: { user: Pick<AdminUser, 'isSuspended' | 'suspendedBy'> }) {
  if (!user.isSuspended) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
      </span>
    );
  }
  return (
    <span
      title={user.suspendedBy === 'COD_NO_SHOW' ? 'Auto-suspended after repeated COD no-shows' : 'Suspended by admin'}
      className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {user.suspendedBy === 'COD_NO_SHOW' ? 'Suspended · COD' : 'Suspended'}
    </span>
  );
}

export function SectionHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function LoadingRow({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      <AlertTriangle size={16} className="shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-lg border border-current px-2.5 py-1 text-xs font-semibold">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">{icon}</span>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{text}</p>
    </div>
  );
}

export const cardClass = 'rounded-2xl border border-border bg-surface shadow-card';

export const inputClass =
  'h-10 w-full rounded-xl border border-border bg-bg/60 px-3 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15';

/** Segmented control used for the role / status / type filters. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-bg/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === o.value ? 'bg-brand text-brand-ink shadow-sm' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
