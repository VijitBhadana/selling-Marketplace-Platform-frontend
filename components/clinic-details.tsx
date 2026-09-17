'use client';

import { CalendarDays, Check, Clock, FileText, Package, Pill, Stethoscope, X } from 'lucide-react';
import {
  MEDICINE_FORMS,
  SPECIALISATIONS,
  WEEK_DAYS,
  clinicItemType,
  clinicPriceText,
  daysPerWeekText,
  doctorDaysText,
  doctorTimingText,
  experienceText,
  formatClinicDetails,
  isMedicineExpired,
  specialisationOf,
  type ClinicDetails,
  type ClinicFormType,
  type ClinicFormValues,
  type DoctorDetails,
  type MedicineDetails,
} from '@/lib/clinic-details';
import { withImageParams } from '@/lib/image-utils';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

export type ClinicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  priceType: 'FIXED' | 'CONTACT_FOR_PRICE';
  imageUrl: string | null;
  clinicDetails?: ClinicDetails | null;
};

// --- Seller side ----------------------------------------------------------------------

const TYPE_OPTIONS: { value: ClinicFormType; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    value: 'DOCTOR',
    label: 'Doctor',
    icon: <Stethoscope size={14} />,
    hint: 'A doctor at your hospital — patients see their qualification, experience, days and timing, and book an appointment.',
  },
  {
    value: 'MEDICINE',
    label: 'Medicine',
    icon: <Pill size={14} />,
    hint: 'A medicine you sell — patients see its type, composition, pack size and whether it needs a prescription.',
  },
  { value: 'OTHER', label: 'Other', icon: <Package size={14} />, hint: 'Anything else — a lab test, X-ray, health check-up package or product.' },
];

/** Is the seller adding a doctor, a medicine, or anything else? */
export function ClinicTypePicker({ value, onChange }: { value: ClinicFormType; onChange: (value: ClinicFormType) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink">What are you adding?</label>
      <div className="flex gap-2">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-medium transition-all ${
              value === option.value
                ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand'
                : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
            }`}
          >
            {option.icon} {option.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{TYPE_OPTIONS.find((o) => o.value === value)?.hint}</p>
    </div>
  );
}

/** The doctor- or medicine-specific part of the "Add" form. */
export function ClinicFieldsEditor({
  type,
  values,
  onChange,
}: {
  type: 'DOCTOR' | 'MEDICINE';
  values: ClinicFormValues;
  onChange: (values: ClinicFormValues) => void;
}) {
  const set = (key: string, value: string | string[]) => onChange({ ...values, [key]: value });
  const text = (key: string) => (typeof values[key] === 'string' ? (values[key] as string) : '');
  const textInput = (key: string, placeholder: string, max = 120) => (
    <input value={text(key)} onChange={(e) => set(key, e.target.value.slice(0, max))} placeholder={placeholder} className={inputClass} />
  );

  if (type === 'DOCTOR') {
    const days = Array.isArray(values.days) ? values.days : [];
    const toggleDay = (day: string) => set('days', days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);

    return (
      <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Doctor details</p>

        <Field label="Specialisation" required>
          <div className="flex flex-wrap gap-1.5">
            {SPECIALISATIONS.map((option) => (
              <Chip key={option} selected={text('specialisation') === option} onClick={() => set('specialisation', option)}>
                {option}
              </Chip>
            ))}
          </div>
          {text('specialisation') === 'Other' && <div className="mt-2">{textInput('otherSpecialisation', 'e.g. Rheumatologist', 80)}</div>}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Qualification" required>
            {textInput('qualification', 'e.g. MBBS, MD (Medicine)')}
          </Field>
          <Field label="Experience (years)" required>
            <input
              value={text('experienceYears')}
              onChange={(e) => set('experienceYears', e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="e.g. 12"
              inputMode="numeric"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Days in hospital" required>
          <div className="flex flex-wrap gap-1.5">
            {WEEK_DAYS.map((day) => (
              <Chip key={day} selected={days.includes(day)} onClick={() => toggleDay(day)}>
                {day}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            {days.length ? `Sits ${daysPerWeekText(days)} — ${doctorDaysText(days)}` : 'Tap every day the doctor sits here.'}
          </p>
        </Field>

        <Field label="Timing" required>
          <TimeRange from={text('timeFrom')} to={text('timeTo')} onFrom={(v) => set('timeFrom', v)} onTo={(v) => set('timeTo', v)} />
        </Field>

        <Field label="Second session (optional)">
          <TimeRange from={text('timeFrom2')} to={text('timeTo2')} onFrom={(v) => set('timeFrom2', v)} onTo={(v) => set('timeTo2', v)} />
          <p className="mt-1.5 text-[11px] text-ink-muted">If the doctor also sits a second time the same day, e.g. evening OPD.</p>
        </Field>

        <Field label="Medical registration no.">{textInput('registrationNo', 'e.g. DMC/R/12345', 40)}</Field>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Medicine details</p>

      <Field label="Medicine type" required>
        <div className="flex flex-wrap gap-1.5">
          {MEDICINE_FORMS.map((option) => (
            <Chip key={option} selected={text('form') === option} onClick={() => set('form', option)}>
              {option}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Composition / salt" required>
        {textInput('composition', 'e.g. Paracetamol 650 mg', 200)}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pack size" required>
          {textInput('packSize', 'e.g. Strip of 15 tablets', 80)}
        </Field>
        <Field label="Manufacturer">{textInput('manufacturer', 'e.g. Micro Labs')}</Field>
      </div>

      <Field label="Prescription" required>
        <div className="flex gap-2">
          <Chip wide selected={text('prescriptionRequired') === 'YES'} onClick={() => set('prescriptionRequired', 'YES')}>
            Needs prescription
          </Chip>
          <Chip wide selected={text('prescriptionRequired') === 'NO'} onClick={() => set('prescriptionRequired', 'NO')}>
            No prescription needed
          </Chip>
        </div>
      </Field>

      <Field label="Expiry (month)">
        <input type="month" value={text('expiryDate')} onChange={(e) => set('expiryDate', e.target.value)} className={inputClass} />
      </Field>
    </div>
  );
}

export function TimeRange({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="time" aria-label="From" value={from} onChange={(e) => onFrom(e.target.value)} className={inputClass} />
      <span className="shrink-0 text-xs text-ink-muted">to</span>
      <input type="time" aria-label="To" value={to} onChange={(e) => onTo(e.target.value)} className={inputClass} />
    </div>
  );
}

// --- Buyer side -----------------------------------------------------------------------

type CardProps<P extends ClinicProduct> = {
  product: P;
  isOwner: boolean;
  suspended: boolean;
  buying: boolean;
  added: boolean;
  /** The seller's edit/delete buttons (shown on hover). */
  actions: React.ReactNode;
  onView: () => void;
  onBuy: () => void;
};

/** A hospital's items, grouped: its doctors, the medicines it sells, then everything else. */
export function ClinicProductGroups<P extends ClinicProduct>({
  products,
  isOwner,
  suspended,
  isBuying,
  isAdded,
  ownerActions,
  onView,
  onBuy,
}: {
  products: P[];
  isOwner: boolean;
  suspended: boolean;
  isBuying: (product: P) => boolean;
  isAdded: (product: P) => boolean;
  ownerActions: (product: P) => React.ReactNode;
  onView: (product: P) => void;
  onBuy: (product: P) => void;
}) {
  const doctors = products.filter((p) => clinicItemType(p.clinicDetails) === 'DOCTOR');
  const medicines = products.filter((p) => clinicItemType(p.clinicDetails) === 'MEDICINE');
  const others = products.filter((p) => !clinicItemType(p.clinicDetails));
  const cardProps = (p: P): CardProps<P> => ({
    product: p,
    isOwner,
    suspended,
    buying: isBuying(p),
    added: isAdded(p),
    actions: isOwner ? ownerActions(p) : null,
    onView: () => onView(p),
    onBuy: () => onBuy(p),
  });

  return (
    <div className="space-y-6">
      {doctors.length > 0 && (
        <Group icon={<Stethoscope size={14} />} title="Doctors" count={doctors.length}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((p) => (
              <DoctorCard key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}

      {medicines.length > 0 && (
        <Group icon={<Pill size={14} />} title="Medicines" count={medicines.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {medicines.map((p) => (
              <MedicineCard key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}

      {others.length > 0 && (
        <Group icon={<Package size={14} />} title="Tests, services & other products" count={others.length}>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {others.map((p) => (
              <OtherTile key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}

export function Group({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <span className="text-brand">{icon}</span> {title}
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">{count}</span>
      </h3>
      {children}
    </section>
  );
}

function DoctorCard<P extends ClinicProduct>({ product: p, isOwner, suspended, buying, added, actions, onView, onBuy }: CardProps<P>) {
  const d = p.clinicDetails as DoctorDetails;
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-3">
      <button type="button" onClick={onView} className="flex items-start gap-3 text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-brand-soft text-brand">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withImageParams(p.imageUrl, 'w=160&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover object-top" />
          ) : (
            <Stethoscope size={24} />
          )}
        </span>
        <span className="min-w-0 flex-1 pr-14">
          <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
          <span className="block truncate text-xs font-semibold text-brand">{specialisationOf(d)}</span>
          <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{d.qualification}</span>
          <span className="block truncate text-[11px] text-ink-muted">{experienceText(d.experienceYears)} experience</span>
        </span>
      </button>
      {actions}

      <div className="mt-3 space-y-1 rounded-lg bg-bg px-2.5 py-2 text-[11px] text-ink-muted">
        <p className="flex items-center gap-1.5">
          <CalendarDays size={12} className="shrink-0 text-brand" />
          <span className="truncate">
            <span className="font-medium text-ink">{doctorDaysText(d.days)}</span> · {daysPerWeekText(d.days)}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <Clock size={12} className="shrink-0 text-brand" />
          <span className="truncate">{doctorTimingText(d)}</span>
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-brand">{clinicPriceText(p)}</p>

      <div className="mt-auto flex gap-1.5 pt-3">
        <DetailsButton onClick={onView} />
        {!isOwner && <BuyButton label="Book appointment" buying={buying} added={added} suspended={suspended} onClick={onBuy} />}
      </div>
    </div>
  );
}

function MedicineCard<P extends ClinicProduct>({ product: p, isOwner, suspended, buying, added, actions, onView, onBuy }: CardProps<P>) {
  const d = p.clinicDetails as MedicineDetails;
  const expired = isMedicineExpired(d);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button type="button" onClick={onView} aria-label={`View details of ${p.name}`} className="relative flex aspect-square w-full items-center justify-center bg-brand-soft text-brand">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=300&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <Pill size={30} />
        )}
        {d.prescriptionRequired && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white" title="Needs a prescription">
            Rx
          </span>
        )}
        {expired && <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">Expired</span>}
      </button>
      {actions}

      <div className="flex flex-1 flex-col p-2.5">
        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
        <p className="truncate text-[11px] text-ink-muted">
          {d.form} · {d.packSize}
        </p>
        <p className="truncate text-[11px] text-ink-muted">{d.composition}</p>
        <p className="mt-1 text-sm font-bold text-brand">{clinicPriceText(p)}</p>

        <div className="mt-auto flex gap-1.5 pt-2.5">
          <DetailsButton onClick={onView} />
          {!isOwner && <BuyButton label="Buy" buying={buying} added={added} suspended={suspended} disabled={expired} onClick={onBuy} />}
        </div>
      </div>
    </div>
  );
}

function OtherTile<P extends ClinicProduct>({ product: p, isOwner, suspended, buying, added, actions, onView, onBuy }: CardProps<P>) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border">
      <button type="button" onClick={onView} aria-label={`View details of ${p.name}`} className="block aspect-square w-full bg-brand-soft">
        {p.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=300&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        )}
      </button>
      {actions}
      <div className="p-2">
        <p className="truncate text-xs font-medium text-ink">{p.name}</p>
        <p className="truncate text-[11px] font-semibold text-brand">{clinicPriceText(p)}</p>
        {!isOwner && (
          <div className="mt-2 flex">
            <BuyButton label="Buy" buying={buying} added={added} suspended={suspended} onClick={onBuy} />
          </div>
        )}
      </div>
    </div>
  );
}

export function DetailsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-full border border-border py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
    >
      Details
    </button>
  );
}

export function BuyButton({
  label,
  buying,
  added,
  suspended,
  disabled,
  onClick,
}: {
  label: string;
  buying: boolean;
  added: boolean;
  suspended: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={buying || added || suspended || disabled}
      title={suspended ? 'Your account is suspended' : undefined}
      onClick={onClick}
      className="flex flex-[1.4] items-center justify-center gap-1 rounded-full bg-brand px-2 py-1.5 text-[11px] font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {added ? (
        <>
          <Check size={12} /> Added
        </>
      ) : (
        label
      )}
    </button>
  );
}

/** Every detail the seller filled in, as a two-column fact sheet. */
export function ClinicFacts({ details, className = '' }: { details: ClinicDetails | null | undefined; className?: string }) {
  const rows = formatClinicDetails(details);
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

/** Buyer side: the full doctor profile / medicine sheet, with a Book / Buy action. */
export function ClinicDetailsModal({
  product,
  actionLabel,
  actionDisabled,
  onAction,
  onClose,
}: {
  product: ClinicProduct;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onClose: () => void;
}) {
  const details = product.clinicDetails;
  const type = clinicItemType(details);
  const doctor = type === 'DOCTOR' ? (details as DoctorDetails) : null;
  const medicine = type === 'MEDICINE' ? (details as MedicineDetails) : null;
  const expired = medicine ? isMedicineExpired(medicine) : false;

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
              <img
                src={withImageParams(product.imageUrl, 'w=900&q=80&auto=format&fit=crop')}
                alt={product.name}
                className={`h-full w-full object-cover ${doctor ? 'object-top' : ''}`}
              />
            ) : doctor ? (
              <Stethoscope size={36} />
            ) : medicine ? (
              <Pill size={36} />
            ) : (
              <Package size={36} />
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
                {doctor ? `Doctor · ${specialisationOf(doctor)}` : medicine ? `Medicine · ${medicine.form}` : 'Test / service / product'}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h3>
              <p className="mt-0.5 text-base font-bold text-brand">{clinicPriceText(product)}</p>
            </div>

            <ClinicFacts details={details} />

            {doctor && (
              <p className="flex items-start gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-snug text-brand">
                <CalendarDays size={13} className="mt-0.5 shrink-0" />
                Book an appointment, then visit on {doctorDaysText(doctor.days)} between {doctorTimingText(doctor)}.
              </p>
            )}
            {medicine?.prescriptionRequired && (
              <p className="flex items-start gap-1.5 rounded-lg bg-accent-soft px-3 py-2 text-xs leading-snug text-accent">
                <FileText size={13} className="mt-0.5 shrink-0" />
                Needs a doctor&apos;s prescription — keep it ready, the hospital will check it before handing over the medicine.
              </p>
            )}
            {expired && (
              <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent">This medicine is past its expiry date and can&apos;t be bought.</p>
            )}

            {product.description && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-ink">{doctor ? 'About the doctor' : medicine ? 'About this medicine' : 'Details'}</h4>
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
              disabled={actionDisabled || expired}
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

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Chip({ selected, onClick, wide, children }: { selected: boolean; onClick: () => void; wide?: boolean; children: React.ReactNode }) {
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
