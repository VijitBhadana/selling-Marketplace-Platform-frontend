'use client';

import { AlertTriangle, ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function BucketWarningModal() {
  const { logout } = useAuth();
  const { suspended, pendingWarning, ackWarning } = useCart();

  if (!suspended && !pendingWarning) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.5)]">
        {suspended ? (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <ShieldOff size={22} />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Account suspended</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Your account has been suspended for repeatedly not collecting or accepting Cash on Delivery orders.
              Contact support if you think this is a mistake.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <AlertTriangle size={22} />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Please don&apos;t do this again</h2>
            <p className="mt-2 text-sm text-ink-muted">
              You didn&apos;t collect or accept a Cash on Delivery order. If this happens one more time, your account
              will be suspended.
            </p>
            <button
              type="button"
              onClick={ackWarning}
              className="mt-5 w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
            >
              I understand
            </button>
          </>
        )}
      </div>
    </div>
  );
}
