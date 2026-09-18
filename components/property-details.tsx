'use client';

import { MapPin, X } from 'lucide-react';
import { effectivePriceUnit, priceUnitLabel, type PriceUnit, type PropertyType } from '@/lib/booking-details';
import {
  PROPERTY_FIELDS,
  PROPERTY_TYPE_LABELS,
  RENT_ONLY_TYPES,
  RENT_UNIT_OPTIONS,
  fieldApplies,
  formatPropertyDetails,
  isFieldRequired,
  listingForOf,
  propertyFormListingFor,
  propertyPriceText,
  rentUnitWord,
  type PropertyDetails,
  type PropertyField,
  type PropertyFormValues,
} from '@/lib/property-details';
import { withImageParams } from '@/lib/image-utils';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

/** Seller side: the property-specific part of the "Add a property" form. */
export function PropertyFieldsEditor({
  type,
  values,
  onChange,
  rentUnit,
  onRentUnitChange,
}: {
  type: PropertyType;
  values: PropertyFormValues;
  onChange: (values: PropertyFormValues) => void;
  rentUnit: PriceUnit;
  onRentUnitChange: (unit: PriceUnit) => void;
}) {
  const listingFor = propertyFormListingFor(type, values);
  const set = (key: string, value: string | string[]) => onChange({ ...values, [key]: value });
  const fields = listingFor ? PROPERTY_FIELDS.filter((field) => fieldApplies(field, type, listingFor)) : [];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{PROPERTY_TYPE_LABELS[type]} details</p>

      {!RENT_ONLY_TYPES.includes(type) && (
        <Field label="Listing for" required>
          <div className="flex gap-2">
            <Chip wide selected={listingFor === 'RENT'} onClick={() => set('listingFor', 'RENT')}>For rent</Chip>
            <Chip wide selected={listingFor === 'SALE'} onClick={() => set('listingFor', 'SALE')}>For sale</Chip>
          </div>
        </Field>
      )}

      {listingFor === 'RENT' && (
        <Field label="Rent is charged">
          <div className="flex flex-wrap gap-1.5">
            {RENT_UNIT_OPTIONS[type].map((unit) => (
              <Chip key={unit} selected={rentUnit === unit} onClick={() => onRentUnitChange(unit)}>
                {priceUnitLabel('PROPERTY', unit)}
              </Chip>
            ))}
          </div>
        </Field>
      )}

      {fields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'select' || field.type === 'multi' || field.key === 'address' ? 'sm:col-span-2' : ''}>
              <Field
                label={field.key === 'minDuration' ? `Minimum rent period (${rentUnitWord(rentUnit)}s)` : field.label}
                required={isFieldRequired(field, type)}
              >
                <FieldInput field={field} value={values[field.key]} onChange={(value) => set(field.key, value)} />
              </Field>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PropertyField;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  const text = typeof value === 'string' ? value : '';
  switch (field.type) {
    case 'select':
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options!.map((option) => (
            <Chip key={option} selected={text === option} onClick={() => onChange(text === option ? '' : option)}>
              {option}
            </Chip>
          ))}
        </div>
      );
    case 'multi': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options!.map((option) => (
            <Chip
              key={option}
              selected={selected.includes(option)}
              onClick={() => onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option])}
            >
              {option}
            </Chip>
          ))}
        </div>
      );
    }
    case 'number':
      return (
        <input
          value={text}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
          placeholder={field.placeholder}
          inputMode="numeric"
          className={inputClass}
        />
      );
    case 'date':
      return <input type="date" value={text} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    default:
      return <input value={text} onChange={(e) => onChange(e.target.value.slice(0, 200))} placeholder={field.placeholder} className={inputClass} />;
  }
}

/** Every detail the seller filled in, as a two-column fact sheet. */
export function PropertyFacts({ details, priceUnit, className = '' }: { details: PropertyDetails | null | undefined; priceUnit: PriceUnit; className?: string }) {
  const rows = formatPropertyDetails(details, priceUnit);
  if (rows.length === 0) return null;
  return (
    <dl className={`grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-border bg-bg p-3.5 text-xs ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className={row.value.length > 28 ? 'col-span-2' : ''}>
          <dt className="text-[11px] text-ink-muted">{row.label}</dt>
          <dd className="mt-0.5 break-words font-medium text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type PropertyProduct = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  priceType: 'FIXED' | 'CONTACT_FOR_PRICE';
  priceUnit?: string | null;
  propertyDetails?: PropertyDetails | null;
};

/** Buyer side: the full property — photo, price, address, every detail and the description. */
export function PropertyDetailsModal({
  product,
  propertyType,
  actionLabel,
  actionDisabled,
  onAction,
  onClose,
}: {
  product: PropertyProduct;
  propertyType?: PropertyType | null;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onClose: () => void;
}) {
  const details = product.propertyDetails;
  const type = details?.type ?? propertyType;
  const address = typeof details?.address === 'string' ? details.address : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-lg animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="relative aspect-video bg-brand-soft">
            {product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={withImageParams(product.imageUrl, 'w=900&q=80&auto=format&fit=crop')} alt={product.name} className="h-full w-full object-cover" />
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
                {listingForOf(details) === 'SALE' ? 'For sale' : 'For rent'}
                {type ? ` · ${PROPERTY_TYPE_LABELS[type]}` : ''}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h3>
              <p className="mt-0.5 text-base font-bold text-brand">{propertyPriceText(product)}</p>
              {address && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-muted">
                  <MapPin size={13} className="mt-px shrink-0" /> {address}
                </p>
              )}
            </div>

            <PropertyFacts details={details} priceUnit={effectivePriceUnit('PROPERTY', product.priceUnit)} />

            {product.description && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-ink">About this property</h4>
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
              disabled={actionDisabled}
              onClick={onAction}
              className="flex-[2] rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/calc(0.9*var(--glow)))] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
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
