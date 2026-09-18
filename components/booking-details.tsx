'use client';

import { useRef, useState } from 'react';
import { BedDouble, Car, Check, Heart, Home, ImageUp, KeyRound, Loader2, PartyPopper, Plane, Truck, X } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { fileToResizedDataUrl } from '@/lib/image-utils';
import {
  BOOKING_TITLES,
  RENT_DOCUMENT_KEYS,
  RENT_DOCUMENT_LABELS,
  bookingDocuments,
  DELIVERY_VEHICLES,
  GOODS_VEHICLES,
  PASSENGER_VEHICLES,
  PAYMENT_PLANS,
  RENT_DURATION_KEY,
  RESIDENTIAL_TYPES,
  TENANT_TYPES,
  bookingPriceLine,
  daysBetween,
  effectivePriceUnit,
  formatBookingDetails,
  formatRupees,
  isPassengerVehicle,
  priceUnitSuffix,
  type BookingDetails,
  type BookingDocument,
  type BookingKind,
  type PriceUnit,
  type PropertyType,
  type RentSubject,
} from '@/lib/booking-details';
import { listingForOf, rentUnitWord, type PropertyDetails } from '@/lib/property-details';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

const KIND_ICONS: Record<BookingKind, React.ReactNode> = {
  STAY: <BedDouble size={18} />,
  EVENT: <PartyPopper size={18} />,
  VEHICLE: <Car size={18} />,
  GOODS: <Truck size={18} />,
  TOUR: <Plane size={18} />,
  WEDDING: <Heart size={18} />,
  PROPERTY: <Home size={18} />,
  TRANSPORT: <Truck size={18} />,
  RENT: <KeyRound size={18} />,
};

const PROPERTY_SALE_HINT = 'Tell the owner how to reach you and when you would like to visit the property.';

const KIND_HINTS: Record<BookingKind, string> = {
  STAY: 'Tell the hotel when you arrive, how long you stay and what rooms you need.',
  EVENT: 'Tell the venue when your event is, for how long and how many people are coming.',
  VEHICLE: 'Tell the operator which vehicle you need and where you are going.',
  GOODS: 'Tell the provider what you are sending, how much of it and where it goes.',
  TOUR: 'Tell the tour operator when you want to go, for how long and your budget.',
  WEDDING: 'Tell the seller from which date you need it, for how many days and how many guests are coming.',
  PROPERTY: 'Tell the owner when you want to move in, for how long, and who will use the place.',
  TRANSPORT: 'Tell the transporter from where to where, what goods and when.',
  RENT: 'Tell the owner from when to when you need it — the rent is charged per day.',
};

const RENT_SUBJECT_HINTS: Record<RentSubject, string> = {
  VEHICLE: 'A vehicle is handed over against ID, so upload a photo of your driving licence and Aadhaar card.',
  PLACE: 'Tell the owner how many people the place is for.',
  ITEM: '',
};

const NUMERIC_KEYS = new Set(['nights', 'rooms', 'guests', 'durationHours', 'passengers', 'days', 'travellers', 'budget', 'months', 'years', 'occupants']);
const OPTIONAL_KEYS = ['startTime', 'notes', 'tenantType', 'visitDate', 'paymentPlan'];

type Values = Record<string, string>;
type PropertyAsk = { forSale: boolean; durationKey: string; residential: boolean; rentSubject: RentSubject };

function requiredKeys(kind: BookingKind, v: Values, p: PropertyAsk): string[] {
  switch (kind) {
    case 'STAY':
      return ['checkIn', 'nights', 'rooms', 'guests', 'bedType'];
    case 'EVENT':
      return ['eventDate', 'durationHours', 'guests'];
    case 'VEHICLE':
      return [
        'vehicleType',
        'pickup',
        'drop',
        'startDate',
        ...(isPassengerVehicle(v.vehicleType) ? ['passengers', 'endDate'] : ['goodsDescription', 'goodsQuantity']),
      ];
    case 'GOODS':
      return ['vehicleType', 'goodsDescription', 'goodsQuantity', 'pickup', 'drop', 'startDate'];
    case 'TOUR':
      return ['startDate', 'days', 'travellers', 'budget'];
    case 'WEDDING':
      return ['startDate', 'days', 'guests'];
    case 'PROPERTY':
      if (p.forSale) return ['phone'];
      return ['startDate', p.durationKey, p.residential ? 'occupants' : 'purpose', 'phone'];
    case 'TRANSPORT':
      // Booked through TransportBookingModal (components/transport-details.tsx), never this form.
      return [];
    case 'RENT':
      // The KYC photos are checked separately — they aren't text fields.
      return ['startDate', 'endDate', ...(p.rentSubject === 'PLACE' ? ['occupants'] : [])];
  }
}

function todayIso() {
  // en-CA formats as YYYY-MM-DD in the viewer's local time zone — what <input type="date"> expects.
  return new Date().toLocaleDateString('en-CA');
}

export function BookingDetailsModal({
  kind,
  productName,
  initial,
  unitPrice,
  priceUnit = effectivePriceUnit(kind),
  property,
  propertyType,
  rentSubject,
  onClose,
  onSubmit,
}: {
  kind: BookingKind;
  productName: string;
  initial?: BookingDetails | null;
  /** Product's fixed price — shows a live total estimate. Omit for "contact for price". */
  unitPrice?: number | null;
  priceUnit?: PriceUnit;
  /** Property Cloude: the seller's details — rent or sale, minimum rent period, deposit, available from. */
  property?: PropertyDetails | null;
  /** Property Cloude: from the shop's category — decides whether we ask who will stay or what it's for. */
  propertyType?: PropertyType | null;
  /** Rent Cloude: from the shop's category — a vehicle asks for KYC photos, a place for a head count. */
  rentSubject?: RentSubject | null;
  onClose: () => void;
  onSubmit: (details: BookingDetails) => Promise<void>;
}) {
  const [values, setValues] = useState<Values>(() =>
    // Text/number answers only — a rental's KYC photos are objects and live in `docs` below.
    Object.fromEntries(
      Object.entries(initial ?? {})
        .filter(([k, v]) => k !== 'kind' && v != null && typeof v !== 'object')
        .map(([k, v]) => [k, String(v)]),
    ),
  );
  // Rent Cloude vehicles: the renter's licence and Aadhaar photos, resized in the browser
  // before they go with the booking (the same way product photos are uploaded).
  const [docs, setDocs] = useState<Record<string, BookingDocument>>(() =>
    Object.fromEntries(bookingDocuments(initial).map(({ key, doc }) => [key, doc])),
  );
  const [docError, setDocError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayIso();

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const setNumber = (key: string, value: string) => set(key, value.replace(/[^0-9]/g, ''));

  // Property Cloude: rent is asked in the seller's unit (days/months/years), never below their minimum.
  const isProperty = kind === 'PROPERTY';
  const forSale = isProperty && listingForOf(property) === 'SALE';
  const durationKey = RENT_DURATION_KEY[priceUnit] ?? 'months';
  const durationWord = rentUnitWord(priceUnit);
  const minDuration = Number(property?.minDuration) || 1;
  const residential = RESIDENTIAL_TYPES.includes((propertyType ?? property?.type) as PropertyType);
  const availableFrom = typeof property?.availableFrom === 'string' ? property.availableFrom : '';
  const deposit = isProperty && !forSale ? Number(property?.deposit) || 0 : 0;

  // Rent Cloude: rented by the day, from one date to another; what else is asked depends
  // on whether it's a vehicle (KYC photos), a place (how many people) or a plain item.
  const isRent = kind === 'RENT';
  const subject: RentSubject = rentSubject ?? 'ITEM';
  const rentDocsNeeded = isRent && subject === 'VEHICLE';
  const missingDocs = rentDocsNeeded ? RENT_DOCUMENT_KEYS.filter((key) => !docs[key]) : [];

  const required = requiredKeys(kind, values, { forSale, durationKey, residential, rentSubject: subject });
  const passengerTrip = kind === 'VEHICLE' && isPassengerVehicle(values.vehicleType);
  const dateRange = passengerTrip || isRent;
  const datesInOrder = !dateRange || !values.startDate || !values.endDate || values.endDate >= values.startDate;
  const propertyProblem = !isProperty
    ? null
    : values.phone && !/^[6-9]\d{9}$/.test(values.phone)
      ? 'Enter a valid 10-digit mobile number.'
      : !forSale && values[durationKey] && Number(values[durationKey]) < minDuration
        ? `The owner rents this out for at least ${minDuration} ${durationWord}s.`
        : !forSale && availableFrom && values.startDate && values.startDate < availableFrom
          ? 'The move-in date is before the property is available.'
          : null;
  const canSubmit =
    datesInOrder &&
    !propertyProblem &&
    missingDocs.length === 0 &&
    required.every((key) => (NUMERIC_KEYS.has(key) ? Number(values[key]) > 0 : Boolean(values[key]?.trim())));

  // Live total estimate — same maths the backend uses at checkout.
  const preview: Record<string, unknown> = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, NUMERIC_KEYS.has(k) ? Number(v) : v]),
  );
  if (dateRange && values.startDate && values.endDate && datesInOrder) {
    preview.days = daysBetween(values.startDate, values.endDate);
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const details: BookingDetails = { kind };
    for (const key of [...required, ...OPTIONAL_KEYS]) {
      const value = values[key]?.trim();
      if (value) details[key] = NUMERIC_KEYS.has(key) ? Number(value) : value;
    }
    if (rentDocsNeeded) for (const key of RENT_DOCUMENT_KEYS) details[key] = docs[key];
    try {
      await onSubmit(details);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your booking details — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const numberInput = (key: string, placeholder: string) => (
    <input value={values[key] ?? ''} onChange={(e) => setNumber(key, e.target.value)} placeholder={placeholder} inputMode="numeric" className={inputClass} />
  );
  const textInput = (key: string, placeholder: string) => (
    <input value={values[key] ?? ''} onChange={(e) => set(key, e.target.value.slice(0, 300))} placeholder={placeholder} className={inputClass} />
  );
  const dateInput = (key: string, min = today) => (
    <input type="date" value={values[key] ?? ''} min={min} onChange={(e) => set(key, e.target.value)} className={inputClass} />
  );
  const vehicleChips = (options: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Chip key={option} selected={values.vehicleType === option} onClick={() => set('vehicleType', option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
  // Optional single choice — tap again to clear.
  const optionChips = (key: string, options: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Chip key={option} selected={values[key] === option} onClick={() => set(key, values[key] === option ? '' : option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
  async function pickDocument(key: string, file: File) {
    setDocError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1400, 0.8);
      setDocs((prev) => ({ ...prev, [key]: { fileName: file.name, dataUrl } }));
    } catch {
      setDocError('Could not read that photo — try another one.');
    }
  }

  const phoneInput = (
    <input
      value={values.phone ?? ''}
      onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
      placeholder="10-digit mobile number"
      inputMode="tel"
      className={inputClass}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-md animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{KIND_ICONS[kind]}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold text-ink">{forSale ? 'Purchase enquiry' : BOOKING_TITLES[kind]}</h3>
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
          <p className="text-xs leading-snug text-ink-muted">
            {forSale ? PROPERTY_SALE_HINT : KIND_HINTS[kind]}
            {isRent && RENT_SUBJECT_HINTS[subject] ? ` ${RENT_SUBJECT_HINTS[subject]}` : ''}
          </p>

          {kind === 'STAY' && (
            <>
              <Field label="Check-in date" required>{dateInput('checkIn')}</Field>
              <Row>
                <Field label="Number of days (nights)" required>{numberInput('nights', 'e.g. 2')}</Field>
                <Field label="Rooms needed" required>{numberInput('rooms', 'e.g. 1')}</Field>
              </Row>
              <Field label="Number of guests" required>{numberInput('guests', 'e.g. 2')}</Field>
              <Field label="Bed type" required>
                <div className="flex gap-2">
                  <Chip wide selected={values.bedType === 'SINGLE'} onClick={() => set('bedType', 'SINGLE')}>Single bed</Chip>
                  <Chip wide selected={values.bedType === 'DOUBLE'} onClick={() => set('bedType', 'DOUBLE')}>Double bed</Chip>
                </div>
              </Field>
            </>
          )}

          {kind === 'EVENT' && (
            <>
              <Row>
                <Field label="Event date" required>{dateInput('eventDate')}</Field>
                <Field label="Start time">
                  <input type="time" value={values.startTime ?? ''} onChange={(e) => set('startTime', e.target.value)} className={inputClass} />
                </Field>
              </Row>
              <Row>
                <Field label="For how many hours?" required>{numberInput('durationHours', 'e.g. 4')}</Field>
                <Field label="How many people?" required>{numberInput('guests', 'e.g. 50')}</Field>
              </Row>
            </>
          )}

          {kind === 'VEHICLE' && (
            <>
              <Field label="Which vehicle do you need?" required>{vehicleChips([...PASSENGER_VEHICLES, ...GOODS_VEHICLES])}</Field>
              <Field label="Pickup location" required>{textInput('pickup', 'Where to pick up from')}</Field>
              <Field label="Drop location" required>{textInput('drop', 'Where to go')}</Field>
              {values.vehicleType && passengerTrip && (
                <>
                  <Field label="How many people?" required>{numberInput('passengers', 'e.g. 4')}</Field>
                  <Row>
                    <Field label="From date" required>{dateInput('startDate')}</Field>
                    <Field label="To date" required>{dateInput('endDate', values.startDate || today)}</Field>
                  </Row>
                  {values.startDate && values.endDate && (
                    <p className={`text-xs font-medium ${datesInOrder ? 'text-brand' : 'text-accent'}`}>
                      {datesInOrder ? `Booking for ${daysBetween(values.startDate, values.endDate)} day(s)` : 'To date must be on or after the from date.'}
                    </p>
                  )}
                </>
              )}
              {values.vehicleType && !passengerTrip && (
                <>
                  <Field label="What goods?" required>{textInput('goodsDescription', 'e.g. Furniture, cement bags, household items')}</Field>
                  <Field label="How much goods?" required>{textInput('goodsQuantity', 'e.g. 20 bags / approx. 500 kg / 1BHK')}</Field>
                  <Field label="Date needed" required>{dateInput('startDate')}</Field>
                </>
              )}
            </>
          )}

          {kind === 'GOODS' && (
            <>
              <Field label="Which vehicle do you need?" required>{vehicleChips(DELIVERY_VEHICLES)}</Field>
              <Field label="What goods?" required>{textInput('goodsDescription', 'e.g. Documents, parcel, household items')}</Field>
              <Field label="How much goods?" required>{textInput('goodsQuantity', 'e.g. 2 boxes / approx. 10 kg')}</Field>
              <Field label="Pickup address" required>{textInput('pickup', 'Where to pick up from')}</Field>
              <Field label="Delivery address" required>{textInput('drop', 'Where it should reach')}</Field>
              <Field label="Pickup date" required>{dateInput('startDate')}</Field>
            </>
          )}

          {kind === 'TOUR' && (
            <>
              <Field label="Tour start date" required>{dateInput('startDate')}</Field>
              <Row>
                <Field label="Number of days" required>{numberInput('days', 'e.g. 5')}</Field>
                <Field label="How many people?" required>{numberInput('travellers', 'e.g. 4')}</Field>
              </Row>
              <Field label="Your budget (₹)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
                  <input
                    value={values.budget ?? ''}
                    onChange={(e) => setNumber('budget', e.target.value)}
                    placeholder="25000"
                    inputMode="numeric"
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </Field>
            </>
          )}

          {kind === 'WEDDING' && (
            <>
              <Field label="Booking from date" required>{dateInput('startDate')}</Field>
              <Row>
                <Field label="For how many days?" required>{numberInput('days', 'e.g. 2')}</Field>
                <Field label="How many guests?" required>{numberInput('guests', 'e.g. 300')}</Field>
              </Row>
            </>
          )}

          {isRent && (
            <>
              <Row>
                <Field label="Rent from" required>{dateInput('startDate')}</Field>
                <Field label="Until" required>{dateInput('endDate', values.startDate || today)}</Field>
              </Row>
              {values.startDate && values.endDate && (
                <p className={`text-xs font-medium ${datesInOrder ? 'text-brand' : 'text-accent'}`}>
                  {datesInOrder
                    ? `Renting for ${daysBetween(values.startDate, values.endDate)} day(s)`
                    : 'The "until" date must be on or after the "from" date.'}
                </p>
              )}
              {subject === 'PLACE' && (
                <Field label="How many people is it for?" required>{numberInput('occupants', 'e.g. 4')}</Field>
              )}
              {rentDocsNeeded && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink">
                    Your documents <span className="text-accent">*</span>
                  </p>
                  {RENT_DOCUMENT_KEYS.map((key) => (
                    <DocumentRow
                      key={key}
                      label={RENT_DOCUMENT_LABELS[key]}
                      doc={docs[key]}
                      onPick={(file) => pickDocument(key, file)}
                      onRemove={() =>
                        setDocs((prev) => {
                          const next = { ...prev };
                          delete next[key];
                          return next;
                        })
                      }
                    />
                  ))}
                  <p className="text-[11px] leading-snug text-ink-muted">
                    Only the owner of this listing can see these photos, and only for this rental.
                  </p>
                  {docError && <p className="text-xs font-medium text-accent">{docError}</p>}
                </div>
              )}
            </>
          )}

          {isProperty && !forSale && (
            <>
              <Row>
                <Field label="Move-in date" required>{dateInput('startDate', availableFrom > today ? availableFrom : today)}</Field>
                <Field label={`For how many ${durationWord}s?`} required>
                  {numberInput(durationKey, minDuration > 1 ? `Min. ${minDuration}` : durationWord === 'month' ? 'e.g. 11' : durationWord === 'day' ? 'e.g. 3' : 'e.g. 1')}
                </Field>
              </Row>
              {residential ? (
                <>
                  <Field label="How many people will stay?" required>{numberInput('occupants', 'e.g. 2')}</Field>
                  <Field label="Who will stay?">{optionChips('tenantType', TENANT_TYPES)}</Field>
                </>
              ) : (
                <Field label="What will you use it for?" required>{textInput('purpose', 'e.g. Grocery shop, office for 10 people, storage')}</Field>
              )}
              <Field label="Your mobile number" required>{phoneInput}</Field>
            </>
          )}

          {forSale && (
            <>
              <Field label="Your mobile number" required>{phoneInput}</Field>
              <Field label="When would you like to visit?">{dateInput('visitDate')}</Field>
              <Field label="How will you pay?">{optionChips('paymentPlan', PAYMENT_PLANS)}</Field>
            </>
          )}

          {propertyProblem && <p className="text-xs font-medium text-accent">{propertyProblem}</p>}

          <Field label="Anything else? (optional)">
            <textarea
              value={values.notes ?? ''}
              onChange={(e) => set('notes', e.target.value.slice(0, 500))}
              rows={2}
              placeholder="Special requests for the seller"
              className={`${inputClass} resize-y`}
            />
          </Field>

          {unitPrice ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-brand/30 bg-brand-soft/50 px-3.5 py-2.5 text-xs">
              <span className="text-ink-muted">{forSale ? 'Sale price' : canSubmit ? 'Estimated total' : 'Price'}</span>
              <span className="font-semibold text-brand">
                {canSubmit ? bookingPriceLine(unitPrice, priceUnit, preview) : `${formatRupees(unitPrice)} ${priceUnitSuffix(kind, priceUnit)}`}
              </span>
            </div>
          ) : null}
          {deposit > 0 && (
            <p className="text-[11px] leading-snug text-ink-muted">
              Plus a {formatRupees(deposit)} refundable security deposit, settled directly with the owner (not included above).
            </p>
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
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/calc(0.9*var(--glow)))] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {submitting ? 'Saving…' : initial ? 'Save details' : 'Add to bucket list'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact label/value list of a booking — used in the bucket list, My orders and the seller's shop orders. */
export function BookingDetailsSummary({ details, className = '' }: { details: BookingDetails | null | undefined; className?: string }) {
  const rows = formatBookingDetails(details);
  const documents = bookingDocuments(details);
  if (rows.length === 0 && documents.length === 0) return null;
  return (
    <div className={`rounded-lg bg-bg px-2.5 py-2 ${className}`}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="break-words font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {documents.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {documents.map(({ key, label, doc }) => (
            <a key={key} href={doc.dataUrl} target="_blank" rel="noreferrer" className="group" title={`Open ${label}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.dataUrl} alt={label} className="h-14 w-20 rounded-lg border border-border object-cover transition-opacity group-hover:opacity-80" />
              <span className="mt-0.5 block text-[10px] text-ink-muted">{label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** One KYC photo the renter uploads — pick it, see the thumbnail, swap it out. */
function DocumentRow({
  label,
  doc,
  onPick,
  onRemove,
}: {
  label: string;
  doc?: BookingDocument;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-2.5 ${doc ? 'border-border bg-bg/50' : 'border-dashed border-border bg-bg/30'}`}>
      {doc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doc.dataUrl} alt={label} className="h-12 w-16 shrink-0 rounded-lg border border-border object-cover" />
      ) : (
        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <ImageUp size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p className="truncate text-[11px] text-ink-muted">{doc ? doc.fileName : 'Photo of the original — JPG or PNG'}</p>
      </div>
      <button
        type="button"
        onClick={() => (doc ? onRemove() : inputRef.current?.click())}
        className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
      >
        {doc ? 'Remove' : 'Upload'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
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
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${wide ? 'flex-1' : ''} ${
        selected ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand' : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
