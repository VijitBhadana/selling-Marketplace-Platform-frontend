'use client';

import { useState } from 'react';
import { Check, Clock, Loader2, MapPin, Package, Truck, Users, Weight, X } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { bookingPriceLine, formatRupees, type BookingDetails } from '@/lib/booking-details';
import {
  SERVICE_LABELS,
  TRANSPORT_VEHICLES,
  deliveryChargeText,
  formatTransportDetails,
  hasTransportRates,
  hourlyRateText,
  minHoursOf,
  offersService,
  transportQuote,
  vehicleName,
  type TransportDetails,
  type TransportFormValues,
  type TransportService,
} from '@/lib/transport-details';
import { withImageParams } from '@/lib/image-utils';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

export type TransportProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  transportDetails?: TransportDetails | null;
};

// --- Seller side ----------------------------------------------------------------------

/** The vehicle & rates part of the "Add vehicle" form. */
export function TransportFieldsEditor({ values, onChange }: { values: TransportFormValues; onChange: (values: TransportFormValues) => void }) {
  const set = (key: string, value: string | string[]) => onChange({ ...values, [key]: value });
  const text = (key: string) => (typeof values[key] === 'string' ? (values[key] as string) : '');
  const services = Array.isArray(values.services) ? values.services : [];
  const toggleService = (service: TransportService) =>
    set('services', services.includes(service) ? services.filter((s) => s !== service) : [...services, service]);
  const perKm = text('deliveryChargeUnit') === 'PER_KM';

  const textInput = (key: string, placeholder: string, max: number) => (
    <input value={text(key)} onChange={(e) => set(key, e.target.value.slice(0, max))} placeholder={placeholder} className={inputClass} />
  );
  const rupeeInput = (key: string, placeholder: string) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
      <input
        value={text(key)}
        onChange={(e) => set(key, e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
        placeholder={placeholder}
        inputMode="numeric"
        className={`${inputClass} pl-8`}
      />
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Vehicle & rates</p>

      <Field label="Vehicle type" required>
        <div className="flex flex-wrap gap-1.5">
          {TRANSPORT_VEHICLES.map((option) => (
            <Chip key={option} selected={text('vehicleType') === option} onClick={() => set('vehicleType', option)}>
              {option}
            </Chip>
          ))}
        </div>
        {text('vehicleType') === 'Other' && <div className="mt-2">{textInput('otherVehicle', 'e.g. Mahindra Jeeto', 60)}</div>}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Load capacity" required>
          {textInput('capacity', 'e.g. 750 kg / 1 ton / 40 bags', 60)}
        </Field>
        <Field label="Service area">{textInput('serviceArea', 'e.g. Meerut + 50 km', 120)}</Field>
      </div>

      <Field label="What do you offer?" required>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Chip wide selected={services.includes('DELIVERY')} onClick={() => toggleService('DELIVERY')}>
            <Package size={14} /> Goods delivery
          </Chip>
          <Chip wide selected={services.includes('HOURLY')} onClick={() => toggleService('HOURLY')}>
            <Clock size={14} /> Truck on hire (per hour)
          </Chip>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
          Tick both if buyers can send goods with you, or hire the truck with driver by the hour.
        </p>
      </Field>

      {services.includes('DELIVERY') && (
        <Field label="Delivery charge" required>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[8rem] flex-1">{rupeeInput('deliveryCharge', perKm ? '25' : '500')}</div>
            <Chip selected={!perKm} onClick={() => set('deliveryChargeUnit', 'PER_TRIP')}>
              Per trip
            </Chip>
            <Chip selected={perKm} onClick={() => set('deliveryChargeUnit', 'PER_KM')}>
              Per km
            </Chip>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
            {perKm ? 'Buyer pays this × the distance (km) of the delivery.' : 'Buyer pays this once for each delivery.'}
          </p>
        </Field>
      )}

      {services.includes('HOURLY') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rate per hour (with driver)" required>
            {rupeeInput('hourlyRate', '400')}
          </Field>
          <Field label="Minimum hours">
            <input
              value={text('minHours')}
              onChange={(e) => set('minHours', e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="e.g. 2"
              inputMode="numeric"
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <Field label="Loading / unloading help" required>
        <div className="flex gap-2">
          <Chip wide selected={text('loadingHelp') === 'YES'} onClick={() => set('loadingHelp', 'YES')}>
            Included
          </Chip>
          <Chip wide selected={text('loadingHelp') === 'NO'} onClick={() => set('loadingHelp', 'NO')}>
            Not included
          </Chip>
        </div>
      </Field>
    </div>
  );
}

// --- Buyer side: shop card and details sheet --------------------------------------------

/** A vehicle in the shop: what it is, how much it carries, its delivery charge and hourly rate. */
export function TransportCard<P extends TransportProduct>({
  product: p,
  isOwner,
  suspended,
  buying,
  added,
  actions,
  onView,
  onBuy,
}: {
  product: P;
  isOwner: boolean;
  suspended: boolean;
  buying: boolean;
  added: boolean;
  /** The seller's edit/delete buttons (shown on hover). */
  actions: React.ReactNode;
  onView: () => void;
  onBuy: () => void;
}) {
  const d = p.transportDetails;
  const ready = hasTransportRates(d);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={onView}
        aria-label={`View details of ${p.name}`}
        className="relative flex aspect-video w-full items-center justify-center bg-brand-soft text-brand"
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=480&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <Truck size={34} />
        )}
        {ready && (
          <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {vehicleName(d)}
          </span>
        )}
      </button>
      {actions}

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
        {ready ? (
          <>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
              <Weight size={11} className="shrink-0" />
              <span className="truncate">Carries up to {d.capacity}</span>
            </p>
            <div className="mt-2 space-y-1 rounded-lg bg-bg px-2.5 py-2 text-xs">
              {offersService(d, 'DELIVERY') && (
                <RateRow icon={<Package size={12} />} label="Delivery" value={deliveryChargeText(d)} />
              )}
              {offersService(d, 'HOURLY') && (
                <RateRow
                  icon={<Clock size={12} />}
                  label="On hire"
                  value={hourlyRateText(d)}
                  note={minHoursOf(d) > 1 ? `min. ${minHoursOf(d)} hrs` : undefined}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Pill icon={<Users size={10} />}>{d.loadingHelp ? 'Loading help included' : 'No loading help'}</Pill>
              {d.serviceArea && <Pill icon={<MapPin size={10} />}>{d.serviceArea}</Pill>}
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-xs leading-snug text-ink-muted">
            {isOwner ? 'Add the delivery charge and hourly rate (Edit) so buyers can book this.' : 'Rates not added yet — chat with the seller.'}
          </p>
        )}

        <div className="mt-auto flex gap-1.5 pt-3">
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded-full border border-border py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            Details
          </button>
          {!isOwner && (
            <button
              type="button"
              disabled={!ready || buying || added || suspended}
              title={suspended ? 'Your account is suspended' : undefined}
              onClick={onBuy}
              className="flex flex-[1.4] items-center justify-center gap-1 rounded-full bg-brand px-2 py-1.5 text-[11px] font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {added ? (
                <>
                  <Check size={12} /> Added
                </>
              ) : (
                <>
                  <Truck size={12} /> Book now
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RateRow({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <p className="flex items-center gap-1.5">
      <span className="shrink-0 text-brand">{icon}</span>
      <span className="text-ink-muted">{label}</span>
      <span className="ml-auto text-right">
        <span className="font-bold text-brand">{value}</span>
        {note && <span className="ml-1 text-[10px] text-ink-muted">({note})</span>}
      </span>
    </p>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex max-w-full items-center gap-1 rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-medium text-ink-muted">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Buyer side: every detail of the vehicle, with a Book action. */
export function TransportDetailsModal({
  product,
  actionLabel,
  actionDisabled,
  onAction,
  onClose,
}: {
  product: TransportProduct;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onClose: () => void;
}) {
  const d = product.transportDetails;
  const ready = hasTransportRates(d);
  const rows = formatTransportDetails(d);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-lg animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          <div className={`relative flex items-center justify-center bg-brand-soft text-brand ${product.imageUrl ? 'aspect-video' : 'h-28'}`}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={withImageParams(product.imageUrl, 'w=900&q=80&auto=format&fit=crop')} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Truck size={36} />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                {ready ? `Transport · ${d.services.map((s) => SERVICE_LABELS[s]).join(' & ')}` : 'Transport'}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h3>
            </div>

            {rows.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-border bg-bg p-3.5 text-xs">
                {rows.map((row) => (
                  <div key={row.label} className={row.value.length > 28 ? 'col-span-2' : ''}>
                    <dt className="text-[11px] text-ink-muted">{row.label}</dt>
                    <dd className="mt-0.5 break-words font-medium text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent">
                The seller hasn&apos;t added delivery / hire rates for this vehicle yet.
              </p>
            )}

            {product.description && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-ink">About this service</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {actionLabel && onAction && (
          <div className="flex gap-2 border-t border-border bg-bg/60 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              Close
            </button>
            <button
              type="button"
              disabled={actionDisabled || !ready}
              onClick={onAction}
              className="flex-[2] rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/0.9)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Buyer side: booking form ----------------------------------------------------------

const NUMERIC_KEYS = new Set(['durationHours', 'distanceKm']);

function todayIso() {
  // en-CA formats as YYYY-MM-DD in the viewer's local time zone — what <input type="date"> expects.
  return new Date().toLocaleDateString('en-CA');
}

/**
 * What the buyer fills in to book a vehicle: goods delivery or the truck on hire, from where
 * to where, what goods and how much, when — plus the hours (hire) or distance (per-km
 * delivery) the charge is worked out from. Same checks as the backend's normalizeTransportRequest().
 */
export function TransportBookingModal({
  productName,
  transport,
  initial,
  onClose,
  onSubmit,
}: {
  productName: string;
  transport: TransportDetails | null | undefined;
  initial?: BookingDetails | null;
  onClose: () => void;
  onSubmit: (details: BookingDetails) => Promise<void>;
}) {
  const offered: TransportService[] = hasTransportRates(transport) ? transport.services : [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = Object.fromEntries(
      Object.entries(initial ?? {})
        .filter(([k, val]) => k !== 'kind' && k !== 'priceUnit' && val != null)
        .map(([k, val]) => [k, String(val)]),
    );
    // Nothing to choose when there's one service; a service the seller has dropped since is cleared.
    if (!offered.includes(v.service as TransportService)) v.service = offered.length === 1 ? offered[0] : '';
    return v;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayIso();

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const setNumber = (key: string, value: string) => set(key, value.replace(/[^0-9]/g, '').slice(0, 4));

  const quote = transportQuote(transport, values.service);
  const hourly = values.service === 'HOURLY';
  const perKm = quote?.priceUnit === 'PER_KM';
  const minHours = minHoursOf(transport);

  const required = [
    'service',
    'pickup',
    'drop',
    'goodsDescription',
    'goodsQuantity',
    'startDate',
    'phone',
    ...(hourly ? ['durationHours'] : perKm ? ['distanceKm'] : []),
  ];
  const problem =
    values.phone && !/^[6-9]\d{9}$/.test(values.phone)
      ? 'Enter a valid 10-digit mobile number.'
      : hourly && values.durationHours && Number(values.durationHours) < minHours
        ? `This truck is hired out for at least ${minHours} hours.`
        : null;
  const canSubmit =
    Boolean(quote) && !problem && required.every((key) => (NUMERIC_KEYS.has(key) ? Number(values[key]) > 0 : Boolean(values[key]?.trim())));
  const rateSuffix = quote?.priceUnit === 'PER_HOUR' ? '/ hour' : perKm ? '/ km' : '/ trip';

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const details: BookingDetails = { kind: 'TRANSPORT' };
    for (const key of [...required, 'startTime', 'notes']) {
      const value = values[key]?.trim();
      if (value) details[key] = NUMERIC_KEYS.has(key) ? Number(value) : value;
    }
    try {
      await onSubmit(details);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your transport details — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const textInput = (key: string, placeholder: string) => (
    <input value={values[key] ?? ''} onChange={(e) => set(key, e.target.value.slice(0, 300))} placeholder={placeholder} className={inputClass} />
  );
  const numberInput = (key: string, placeholder: string) => (
    <input value={values[key] ?? ''} onChange={(e) => setNumber(key, e.target.value)} placeholder={placeholder} inputMode="numeric" className={inputClass} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-md animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Truck size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold text-ink">Transport details</h3>
            <p className="truncate text-xs text-ink-muted">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-xs leading-snug text-ink-muted">Tell the transporter from where to where, what goods and when.</p>

          {offered.length > 1 ? (
            <Field label="What do you need?" required>
              <div className="grid gap-2 sm:grid-cols-2">
                {offered.map((service) => {
                  const selected = values.service === service;
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => set('service', service)}
                      aria-pressed={selected}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                        selected ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-border bg-bg hover:border-brand/50'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          selected ? 'bg-brand text-brand-ink' : 'bg-surface text-ink-muted'
                        }`}
                      >
                        {service === 'DELIVERY' ? <Package size={15} /> : <Clock size={15} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{service === 'DELIVERY' ? 'Deliver my goods' : 'Hire by the hour'}</span>
                        <span className="block text-xs font-semibold text-brand">
                          {service === 'DELIVERY' ? deliveryChargeText(transport!) : hourlyRateText(transport!)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : offered.length === 1 ? (
            <p className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
              {offered[0] === 'DELIVERY' ? <Package size={13} /> : <Clock size={13} />}
              <span className="font-semibold">{SERVICE_LABELS[offered[0]]}</span>·
              {offered[0] === 'DELIVERY' ? deliveryChargeText(transport!) : hourlyRateText(transport!)}
            </p>
          ) : (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent">
              The seller hasn&apos;t added delivery / hire rates for this vehicle yet — chat with them instead.
            </p>
          )}

          <Field label="Pickup location (from)" required>
            {textInput('pickup', 'e.g. Village Rasulpur, near the temple')}
          </Field>
          <Field label="Drop location (to)" required>
            {textInput('drop', 'e.g. Meerut Sabzi Mandi, gate 2')}
          </Field>

          <Field label="What goods?" required>
            {textInput('goodsDescription', 'e.g. Potatoes, wheat bags, fertiliser')}
          </Field>
          <Field label="How much?" required>
            {textInput('goodsQuantity', 'e.g. 20 bags / 10 quintal / 500 kg')}
            {hasTransportRates(transport) && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-muted">
                <Weight size={11} className="shrink-0" /> This vehicle carries up to {transport.capacity}.
              </p>
            )}
          </Field>

          <Row>
            <Field label={hourly ? 'Date needed' : 'Pickup date'} required>
              <input type="date" value={values.startDate ?? ''} min={today} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
            </Field>
            <Field label={hourly ? 'Start time' : 'Pickup time'}>
              <input type="time" value={values.startTime ?? ''} onChange={(e) => set('startTime', e.target.value)} className={inputClass} />
            </Field>
          </Row>

          {hourly && (
            <Field label="For how many hours?" required>
              {numberInput('durationHours', minHours > 1 ? `Min. ${minHours}` : 'e.g. 3')}
            </Field>
          )}
          {perKm && (
            <Field label="Approx. distance (km)" required>
              {numberInput('distanceKm', 'e.g. 25')}
              <p className="mt-1.5 text-[11px] text-ink-muted">The delivery charge is {formatRupees(quote!.unitPrice)} × km.</p>
            </Field>
          )}

          <Field label="Your mobile number" required>
            <input
              value={values.phone ?? ''}
              onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="The driver will call you on this number"
              inputMode="tel"
              className={inputClass}
            />
          </Field>

          {hasTransportRates(transport) && (
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-muted">
              <Users size={12} className="mt-px shrink-0" />
              {transport.loadingHelp
                ? 'Loading / unloading help is included.'
                : 'Loading / unloading help is not included — arrange your own labour.'}
            </p>
          )}

          {problem && <p className="text-xs font-medium text-accent">{problem}</p>}

          <Field label="Anything else? (optional)">
            <textarea
              value={values.notes ?? ''}
              onChange={(e) => set('notes', e.target.value.slice(0, 500))}
              rows={2}
              placeholder="e.g. Narrow lane, call before coming"
              className={`${inputClass} resize-y`}
            />
          </Field>

          {quote && (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-brand/30 bg-brand-soft/50 px-3.5 py-2.5 text-xs">
              <span className="text-ink-muted">{canSubmit ? 'Estimated total' : 'Rate'}</span>
              <span className="font-semibold text-brand">
                {canSubmit
                  ? bookingPriceLine(quote.unitPrice, quote.priceUnit, {
                      durationHours: Number(values.durationHours),
                      distanceKm: Number(values.distanceKm),
                    })
                  : `${formatRupees(quote.unitPrice)} ${rateSuffix}`}
              </span>
            </div>
          )}

          {error && <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-border bg-bg/60 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/0.9)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {submitting ? 'Saving…' : initial ? 'Save details' : 'Add to bucket list'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <label className="mb-1.5 block text-xs font-semibold text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">{children}</div>;
}

function Chip({ selected, onClick, wide, children }: { selected: boolean; onClick: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${wide ? 'flex-1' : ''} ${
        selected ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand' : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
