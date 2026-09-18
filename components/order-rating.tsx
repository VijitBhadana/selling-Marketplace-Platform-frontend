'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

const LABELS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];

/**
 * Stars under a received order. The buyer's rating is what ranks shops in the home
 * page's "Fresh listings near you"; rating again (say after a later order) updates it.
 */
export function OrderRating({ orderId, initialRating, token }: { orderId: string; initialRating: number | null; token: string }) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rate(value: number) {
    const previous = rating;
    setRating(value);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.orders.rate(orderId, { rating: value }, token);
      setSaved(true);
    } catch (err) {
      setRating(previous);
      setError(err instanceof ApiError ? err.message : 'Could not save your rating.');
    } finally {
      setSaving(false);
    }
  }

  const shown = hover || rating;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3">
      <span className="text-xs font-medium text-ink-muted">{rating ? 'Your rating' : 'Rate this shop'}</span>
      <div className="flex items-center" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={saving}
            onClick={() => rate(value)}
            onMouseEnter={() => setHover(value)}
            aria-label={`${value} star${value === 1 ? '' : 's'} — ${LABELS[value]}`}
            className="p-0.5 transition-transform hover:scale-110 disabled:cursor-wait"
          >
            <Star size={18} className={value <= shown ? 'fill-amber-400 text-amber-400' : 'text-ink-muted/40'} />
          </button>
        ))}
      </div>
      {shown > 0 && <span className="text-xs font-semibold text-ink">{LABELS[shown]}</span>}
      {saved && !hover && <span className="text-xs text-emerald-600">Thanks — saved!</span>}
      {error && <span className="w-full text-xs text-red-500">{error}</span>}
    </div>
  );
}
