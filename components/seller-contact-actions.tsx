'use client';

import { useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function SellerContactActions() {
  const { requireAuth } = useAuth();
  const [numberRevealed, setNumberRevealed] = useState(false);

  return (
    <div className="mt-5 space-y-2">
      <button
        type="button"
        onClick={() => requireAuth(() => setNumberRevealed(true), 'purchase')}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:opacity-90"
      >
        <Phone size={16} /> {numberRevealed ? '+91 98765 43210' : 'Show number'}
      </button>
      <button
        type="button"
        onClick={() => requireAuth(undefined, 'purchase')}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-hover"
      >
        <MessageCircle size={16} /> Chat with seller
      </button>
    </div>
  );
}
