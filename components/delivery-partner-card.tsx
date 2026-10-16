'use client';

import { Bike, CheckCircle2, Circle, IdCard, Phone, UserRound } from 'lucide-react';
import {
  BUYER_DELIVERY_STATUS,
  SELLER_DELIVERY_STATUS,
  vehicleLabel,
  type DeliveryStatus,
  type OrderDelivery,
} from '@/lib/delivery';

function time(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString('en-IN', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * A delivery order's progress and the partner carrying it — name, phone, vehicle, number
 * plate and (masked) licence. Shown to the buyer in their orders and to the shop.
 */
export function DeliveryPartnerCard({ order, viewer }: { order: OrderDelivery; viewer: 'buyer' | 'seller' }) {
  const status = order.deliveryStatus as DeliveryStatus;
  const p = order.deliveryPartner;
  const steps = [
    { label: 'Accepted', at: order.deliveryAcceptedAt },
    { label: 'Picked up', at: order.pickedUpAt },
    { label: 'Delivered', at: order.deliveredAt },
  ];

  return (
    <div className="mt-3 rounded-xl border border-brand/25 bg-brand-soft/40 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
        <Bike size={14} className="shrink-0" />
        {(viewer === 'seller' ? SELLER_DELIVERY_STATUS : BUYER_DELIVERY_STATUS)[status]}
      </p>

      {status !== 'SEARCHING' && (
        <ol className="mt-2.5 grid grid-cols-3 gap-1.5">
          {steps.map((s) => (
            <li key={s.label} className="min-w-0">
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${s.at ? 'text-ink' : 'text-ink-muted'}`}>
                {s.at ? <CheckCircle2 size={12} className="shrink-0 text-brand" /> : <Circle size={12} className="shrink-0 opacity-50" />}
                <span className="truncate">{s.label}</span>
              </span>
              <span className="block truncate pl-4 text-[10px] text-ink-muted">{time(s.at) ?? '—'}</span>
            </li>
          ))}
        </ol>
      )}

      {p && (
        <div className="mt-3 flex flex-wrap items-start gap-3 rounded-lg border border-border bg-surface p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-ink">
            {p.name.charAt(0).toUpperCase()}
          </span>
          <dl className="min-w-0 flex-1 space-y-0.5 text-xs">
            <dt className="sr-only">Delivery partner</dt>
            <dd className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <UserRound size={13} className="shrink-0 text-ink-muted" /> {p.name}
            </dd>
            {p.phone && (
              <>
                <dt className="sr-only">Phone</dt>
                <dd className="flex items-center gap-1.5 text-ink">
                  <Phone size={12} className="shrink-0 text-ink-muted" /> +91 {p.phone}
                </dd>
              </>
            )}
            {(p.vehicleType || p.vehicleNumber) && (
              <>
                <dt className="sr-only">Vehicle</dt>
                <dd className="flex items-center gap-1.5 text-ink">
                  <Bike size={12} className="shrink-0 text-ink-muted" />
                  {p.vehicleType ? vehicleLabel(p.vehicleType) : 'Vehicle'}
                  {p.vehicleNumber && (
                    <span className="rounded border border-border bg-bg px-1.5 py-px font-mono text-[11px] font-semibold tracking-wide">
                      {p.vehicleNumber}
                    </span>
                  )}
                </dd>
              </>
            )}
            {p.licenseNumber && (
              <>
                <dt className="sr-only">Driving licence</dt>
                <dd className="flex items-center gap-1.5 text-ink-muted">
                  <IdCard size={12} className="shrink-0" /> DL {p.licenseNumber}
                </dd>
              </>
            )}
          </dl>
          {p.phone && status !== 'DELIVERED' && (
            <a
              href={`tel:+91${p.phone}`}
              className="flex shrink-0 items-center gap-1 self-center rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-ink transition-opacity hover:opacity-90"
            >
              <Phone size={12} /> Call
            </a>
          )}
        </div>
      )}
    </div>
  );
}
