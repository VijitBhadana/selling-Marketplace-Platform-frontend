'use client';

import { Award, BookOpen, CalendarDays, Clock, GraduationCap, Laptop, MessagesSquare, Package, Presentation, Timer, Users, X } from 'lucide-react';
import {
  CLASS_LEVELS,
  CLASS_MODES,
  COUNSELLING_FIELDS,
  COUNSELLING_TYPES,
  COURSE_MODES,
  DURATION_UNITS,
  DURATION_UNIT_LABELS,
  FEE_UNITS,
  MODE_LABELS,
  SESSION_MODES,
  SESSION_MODE_LABELS,
  USED_CONDITIONS,
  USED_CONDITION_HINTS,
  USED_CONDITION_LABELS,
  WEEK_DAYS,
  bookMrp,
  counsellingTypesList,
  daysText,
  durationText,
  educationActionLabel,
  educationItemType,
  educationPriceText,
  effectiveFeeUnit,
  experienceText,
  feeUnitLabel,
  formatEducationDate,
  formatEducationDetails,
  levelsText,
  timingText,
  type BookDetails,
  type ClassDetails,
  type CounsellingDetails,
  type CourseDetails,
  type EducationDetails,
  type EducationFormType,
  type EducationFormValues,
  type EducationItemType,
  type FeeItemType,
} from '@/lib/education-details';
import { formatRupees } from '@/lib/booking-details';
import { withImageParams } from '@/lib/image-utils';
import { BuyButton, Chip, DetailsButton, Field, Group, TimeRange } from '@/components/clinic-details';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

export type EducationProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  priceType: 'FIXED' | 'CONTACT_FOR_PRICE';
  imageUrl: string | null;
  educationDetails?: EducationDetails | null;
};

// --- Seller side ----------------------------------------------------------------------

const TYPE_OPTIONS: { value: EducationFormType; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    value: 'COURSE',
    label: 'Course',
    icon: <GraduationCap size={15} />,
    hint: 'A course or programme — students see its duration, mode (online / offline), certificate and fee, and enrol.',
  },
  {
    value: 'CLASS',
    label: 'Class / Tuition',
    icon: <Presentation size={15} />,
    hint: 'A coaching or tuition class — students see the subject, which classes it is for, who teaches, the days and timing, and the fee.',
  },
  {
    value: 'COUNSELLING',
    label: 'Counselling',
    icon: <MessagesSquare size={15} />,
    hint: 'A counselling service — students see the types of counselling, the fields you cover, how sessions happen and the fee.',
  },
  {
    value: 'BOOK',
    label: 'Book',
    icon: <BookOpen size={15} />,
    hint: 'A new or used book — buyers see its condition, author, which class / exam it is for and the price.',
  },
  { value: 'OTHER', label: 'Other', icon: <Package size={15} />, hint: 'Anything else — stationery, notebooks, uniforms, study material.' },
];

/** Is the seller adding a course, a class, counselling, a book, or anything else? */
export function EducationTypePicker({ value, onChange }: { value: EducationFormType; onChange: (value: EducationFormType) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink">What are you adding?</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2.5 text-center text-xs font-medium leading-tight transition-all ${
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

/** The course-, class-, counselling- or book-specific part of the "Add" form. */
export function EducationFieldsEditor({
  type,
  values,
  onChange,
}: {
  type: EducationItemType;
  values: EducationFormValues;
  onChange: (values: EducationFormValues) => void;
}) {
  const set = (key: string, value: string | string[]) => onChange({ ...values, [key]: value });
  const text = (key: string) => (typeof values[key] === 'string' ? (values[key] as string) : '');
  const list = (key: string) => (Array.isArray(values[key]) ? (values[key] as string[]) : []);
  const toggle = (key: string, item: string) => set(key, list(key).includes(item) ? list(key).filter((v) => v !== item) : [...list(key), item]);

  const textInput = (key: string, placeholder: string, max = 120) => (
    <input value={text(key)} onChange={(e) => set(key, e.target.value.slice(0, max))} placeholder={placeholder} className={inputClass} />
  );
  const numberInput = (key: string, placeholder: string, maxDigits: number) => (
    <input
      value={text(key)}
      onChange={(e) => set(key, e.target.value.replace(/[^0-9]/g, '').slice(0, maxDigits))}
      placeholder={placeholder}
      inputMode="numeric"
      className={inputClass}
    />
  );
  const chips = (key: string, options: readonly string[], labels?: Record<string, string>, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Chip
          key={option}
          selected={multi ? list(key).includes(option) : text(key) === option}
          onClick={() => (multi ? toggle(key, option) : set(key, option))}
        >
          {labels?.[option] ?? option}
        </Chip>
      ))}
    </div>
  );
  const daysField = (label: string, required: boolean, hint: string) => (
    <Field label={label} required={required}>
      {chips('days', WEEK_DAYS, undefined, true)}
      <p className="mt-1.5 text-[11px] text-ink-muted">
        {list('days').length ? `${daysText(list('days'))} · ${list('days').length} day${list('days').length === 1 ? '' : 's'} a week` : hint}
      </p>
    </Field>
  );
  const timingField = (label: string, required: boolean) => (
    <Field label={label} required={required}>
      <TimeRange from={text('timeFrom')} to={text('timeTo')} onFrom={(v) => set('timeFrom', v)} onTo={(v) => set('timeTo', v)} />
    </Field>
  );
  const durationField = (label: string, required: boolean) => (
    <Field label={label} required={required}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-24 shrink-0">{numberInput('durationValue', 'e.g. 6', 3)}</div>
        {chips('durationUnit', DURATION_UNITS, DURATION_UNIT_LABELS)}
      </div>
    </Field>
  );
  const feeUnitField = (feeType: FeeItemType) => (
    <Field label="Fee is">
      <div className="flex flex-wrap gap-1.5">
        {FEE_UNITS[feeType].map((unit) => (
          <Chip key={unit} selected={effectiveFeeUnit(feeType, values) === unit} onClick={() => set('feeUnit', unit)}>
            {feeUnitLabel(feeType, unit)}
          </Chip>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-muted">Enter the fee amount in the price box below.</p>
    </Field>
  );

  if (type === 'COURSE') {
    return (
      <Section title="Course details">
        <Field label="Mode" required>
          {chips('mode', COURSE_MODES, MODE_LABELS)}
        </Field>
        {durationField('Course duration', true)}
        <Field label="Certificate" required>
          <div className="flex gap-2">
            <Chip wide selected={text('certificate') === 'YES'} onClick={() => set('certificate', 'YES')}>
              Certificate given
            </Chip>
            <Chip wide selected={text('certificate') === 'NO'} onClick={() => set('certificate', 'NO')}>
              No certificate
            </Chip>
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eligibility">{textInput('eligibility', 'e.g. 12th pass, any graduate')}</Field>
          <Field label="Trainer / faculty">{textInput('trainer', 'e.g. Rahul Verma (8 yrs exp.)')}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Next batch starts">
            <input type="date" value={text('batchStart')} onChange={(e) => set('batchStart', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Seats">{numberInput('seats', 'e.g. 30', 4)}</Field>
        </div>
        {daysField('Batch days', false, 'Optional — tap the days the batch runs.')}
        {timingField('Batch timing', false)}
        {feeUnitField('COURSE')}
      </Section>
    );
  }

  if (type === 'CLASS') {
    return (
      <Section title="Class details">
        <Field label="Subject(s)" required>
          {textInput('subjects', 'e.g. Maths, Science')}
        </Field>
        <Field label="For which class" required>
          {chips('levels', CLASS_LEVELS, undefined, true)}
          <p className="mt-1.5 text-[11px] text-ink-muted">
            {list('levels').length ? `For ${levelsText(list('levels'))}` : 'Tap every class this batch is for, e.g. Class 9 and Class 10.'}
          </p>
        </Field>
        <Field label="Who teaches" required>
          {textInput('teacherName', 'e.g. Mr. Amit Sharma', 80)}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teacher's qualification">{textInput('teacherQualification', 'e.g. M.Sc Maths, B.Ed')}</Field>
          <Field label="Experience (years)">{numberInput('experienceYears', 'e.g. 8', 2)}</Field>
        </div>
        <Field label="Mode" required>
          {chips('mode', CLASS_MODES, MODE_LABELS)}
        </Field>
        {daysField('Class days', true, 'Tap every day the class happens.')}
        {timingField('Class timing', true)}
        {durationField('Course length', false)}
        <Field label="Batch size">{numberInput('batchSize', 'e.g. 15 students', 4)}</Field>
        {feeUnitField('CLASS')}
      </Section>
    );
  }

  if (type === 'COUNSELLING') {
    return (
      <Section title="Counselling details">
        <Field label="Types of counselling" required>
          {chips('counsellingTypes', COUNSELLING_TYPES, undefined, true)}
          {list('counsellingTypes').includes('Other') && <div className="mt-2">{textInput('otherType', 'e.g. Sports career guidance', 80)}</div>}
        </Field>
        <Field label="Fields covered" required>
          {chips('fields', COUNSELLING_FIELDS, undefined, true)}
          <p className="mt-1.5 text-[11px] text-ink-muted">Which career fields / streams you guide students in.</p>
        </Field>
        <Field label="How sessions happen" required>
          {chips('sessionModes', SESSION_MODES, SESSION_MODE_LABELS, true)}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Session length (minutes)">{numberInput('sessionMinutes', 'e.g. 45', 3)}</Field>
          <Field label="Counsellor's name">{textInput('counsellorName', 'e.g. Dr. Neha Gupta', 80)}</Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Qualification">{textInput('qualification', 'e.g. M.A. Psychology')}</Field>
          <Field label="Experience (years)">{numberInput('experienceYears', 'e.g. 10', 2)}</Field>
        </div>
        {daysField('Available days', false, 'Optional — tap the days you take sessions.')}
        {timingField('Available timing', false)}
        {feeUnitField('COUNSELLING')}
      </Section>
    );
  }

  return (
    <Section title="Book details">
      <Field label="New or used" required>
        <div className="flex gap-2">
          <Chip wide selected={text('condition') === 'NEW'} onClick={() => set('condition', 'NEW')}>
            New
          </Chip>
          <Chip wide selected={text('condition') === 'USED'} onClick={() => set('condition', 'USED')}>
            Used (second-hand)
          </Chip>
        </div>
      </Field>
      {text('condition') === 'USED' && (
        <Field label="Book's condition" required>
          {chips('usedCondition', USED_CONDITIONS, USED_CONDITION_LABELS)}
          {text('usedCondition') && <p className="mt-1.5 text-[11px] text-ink-muted">{USED_CONDITION_HINTS[text('usedCondition')]}</p>}
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Author">{textInput('author', 'e.g. R.D. Sharma')}</Field>
        <Field label="Publisher">{textInput('publisher', 'e.g. Dhanpat Rai')}</Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="For class / exam">{textInput('forClass', 'e.g. Class 10 CBSE, NEET', 80)}</Field>
        <Field label="Edition / year">{textInput('edition', 'e.g. 2025 edition', 40)}</Field>
      </div>
      <Field label="Printed price (MRP)">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
          <input
            value={text('mrp')}
            onChange={(e) => set('mrp', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="e.g. 650"
            inputMode="numeric"
            className={`${inputClass} pl-8`}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-muted">Optional — buyers see how much they save on a used book.</p>
      </Field>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      {children}
    </div>
  );
}

// --- Buyer side -----------------------------------------------------------------------

type CardProps<P extends EducationProduct> = {
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

/** An institute's items, grouped: courses, classes, counselling, books, then everything else. */
export function EducationProductGroups<P extends EducationProduct>({
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
  const ofType = (type: EducationItemType | null) => products.filter((p) => educationItemType(p.educationDetails) === type);
  const courses = ofType('COURSE');
  const classes = ofType('CLASS');
  const counselling = ofType('COUNSELLING');
  const books = ofType('BOOK');
  const others = ofType(null);
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
      {courses.length > 0 && (
        <Group icon={<GraduationCap size={14} />} title="Courses" count={courses.length}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((p) => (
              <CourseCard key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}

      {classes.length > 0 && (
        <Group icon={<Presentation size={14} />} title="Classes & tuition" count={classes.length}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((p) => (
              <ClassCard key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}

      {counselling.length > 0 && (
        <Group icon={<MessagesSquare size={14} />} title="Counselling" count={counselling.length}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {counselling.map((p) => (
              <CounsellingCard key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}

      {books.length > 0 && (
        <Group icon={<BookOpen size={14} />} title="Books" count={books.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {books.map((p) => (
              <BookCard key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}

      {others.length > 0 && (
        <Group icon={<Package size={14} />} title="Stationery & other products" count={others.length}>
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

function Thumb({ imageUrl, name, icon }: { imageUrl: string | null; name: string; icon: React.ReactNode }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-brand-soft text-brand">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={withImageParams(imageUrl, 'w=160&q=75&auto=format&fit=crop')} alt={name} className="h-full w-full object-cover" />
      ) : (
        icon
      )}
    </span>
  );
}

function Tag({ strong, children }: { strong?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        strong ? 'border-brand/30 bg-brand-soft text-brand' : 'border-border bg-bg text-ink-muted'
      }`}
    >
      {children}
    </span>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5">
      <span className="shrink-0 text-brand">{icon}</span>
      <span className="truncate">{children}</span>
    </p>
  );
}

function CardFooter<P extends EducationProduct>({ product: p, isOwner, suspended, buying, added, onView, onBuy }: CardProps<P>) {
  return (
    <div className="mt-auto flex gap-1.5 pt-3">
      <DetailsButton onClick={onView} />
      {!isOwner && <BuyButton label={educationActionLabel(p.educationDetails)} buying={buying} added={added} suspended={suspended} onClick={onBuy} />}
    </div>
  );
}

function CourseCard<P extends EducationProduct>(props: CardProps<P>) {
  const { product: p, actions, onView } = props;
  const d = p.educationDetails as CourseDetails;
  const timing = timingText(d);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={onView}
        aria-label={`View details of ${p.name}`}
        className="relative flex aspect-[16/9] w-full items-center justify-center bg-brand-soft text-brand"
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=480&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <GraduationCap size={32} />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-ink">{MODE_LABELS[d.mode]}</span>
      </button>
      {actions}

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
        <p className="truncate text-xs font-semibold text-brand">{durationText(d.durationValue, d.durationUnit)} course</p>
        {d.trainer && <p className="truncate text-[11px] text-ink-muted">by {d.trainer}</p>}

        <div className="mt-2 space-y-1 rounded-lg bg-bg px-2.5 py-2 text-[11px] text-ink-muted">
          <InfoRow icon={<Award size={12} />}>{d.certificate ? 'Certificate on completion' : 'No certificate'}</InfoRow>
          {d.batchStart && <InfoRow icon={<CalendarDays size={12} />}>Next batch {formatEducationDate(d.batchStart)}</InfoRow>}
          {timing && (
            <InfoRow icon={<Clock size={12} />}>
              {d.days?.length ? `${daysText(d.days)} · ` : ''}
              {timing}
            </InfoRow>
          )}
          {d.eligibility && <InfoRow icon={<Users size={12} />}>{d.eligibility}</InfoRow>}
        </div>

        <p className="mt-2 text-sm font-bold text-brand">{educationPriceText(p)}</p>
        <CardFooter {...props} />
      </div>
    </div>
  );
}

function ClassCard<P extends EducationProduct>(props: CardProps<P>) {
  const { product: p, actions, onView } = props;
  const d = p.educationDetails as ClassDetails;
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-3">
      <button type="button" onClick={onView} className="flex items-start gap-3 text-left">
        <Thumb imageUrl={p.imageUrl} name={p.name} icon={<Presentation size={22} />} />
        <span className="min-w-0 flex-1 pr-14">
          <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
          <span className="block truncate text-xs font-semibold text-brand">{d.subjects}</span>
          <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
            by {d.teacherName}
            {d.experienceYears !== undefined ? ` · ${experienceText(d.experienceYears)}` : ''}
          </span>
        </span>
      </button>
      {actions}

      <div className="mt-2.5 flex flex-wrap gap-1">
        <Tag strong>{levelsText(d.levels)}</Tag>
        <Tag>{MODE_LABELS[d.mode]}</Tag>
        {d.durationValue ? <Tag>{durationText(d.durationValue, d.durationUnit)}</Tag> : null}
      </div>

      <div className="mt-2 space-y-1 rounded-lg bg-bg px-2.5 py-2 text-[11px] text-ink-muted">
        <InfoRow icon={<CalendarDays size={12} />}>
          <span className="font-medium text-ink">{daysText(d.days)}</span> · {d.days.length} day{d.days.length === 1 ? '' : 's'} a week
        </InfoRow>
        <InfoRow icon={<Clock size={12} />}>{timingText(d)}</InfoRow>
      </div>

      <p className="mt-2 text-sm font-bold text-brand">{educationPriceText(p)}</p>
      <CardFooter {...props} />
    </div>
  );
}

function CounsellingCard<P extends EducationProduct>(props: CardProps<P>) {
  const { product: p, actions, onView } = props;
  const d = p.educationDetails as CounsellingDetails;
  const types = counsellingTypesList(d);
  const timing = timingText(d);
  const about = [d.qualification, d.experienceYears !== undefined ? `${experienceText(d.experienceYears)} exp.` : ''].filter(Boolean).join(' · ');
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-3">
      <button type="button" onClick={onView} className="flex items-start gap-3 text-left">
        <Thumb imageUrl={p.imageUrl} name={p.name} icon={<MessagesSquare size={22} />} />
        <span className="min-w-0 flex-1 pr-14">
          <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
          {d.counsellorName && <span className="block truncate text-xs font-semibold text-brand">{d.counsellorName}</span>}
          {about && <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{about}</span>}
        </span>
      </button>
      {actions}

      <div className="mt-2.5 flex flex-wrap gap-1">
        {types.slice(0, 3).map((t) => (
          <Tag key={t} strong>
            {t}
          </Tag>
        ))}
        {types.length > 3 && <Tag>+{types.length - 3} more</Tag>}
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-ink-muted">
        <span className="font-medium text-ink">Fields:</span> {d.fields.join(', ')}
      </p>

      <div className="mt-2 space-y-1 rounded-lg bg-bg px-2.5 py-2 text-[11px] text-ink-muted">
        <InfoRow icon={<Laptop size={12} />}>{d.sessionModes.map((m) => SESSION_MODE_LABELS[m] ?? m).join(' · ')}</InfoRow>
        {d.sessionMinutes ? <InfoRow icon={<Timer size={12} />}>{d.sessionMinutes} min session</InfoRow> : null}
        {timing && (
          <InfoRow icon={<Clock size={12} />}>
            {d.days?.length ? `${daysText(d.days)} · ` : ''}
            {timing}
          </InfoRow>
        )}
      </div>

      <p className="mt-2 text-sm font-bold text-brand">{educationPriceText(p)}</p>
      <CardFooter {...props} />
    </div>
  );
}

function BookCard<P extends EducationProduct>(props: CardProps<P>) {
  const { product: p, actions, onView } = props;
  const d = p.educationDetails as BookDetails;
  const used = d.condition === 'USED';
  const mrp = bookMrp(p);
  const meta = [d.forClass, used && d.usedCondition ? `${USED_CONDITION_LABELS[d.usedCondition]} condition` : ''].filter(Boolean).join(' · ');
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={onView}
        aria-label={`View details of ${p.name}`}
        className="relative flex aspect-[4/5] w-full items-center justify-center bg-brand-soft text-brand"
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=320&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <BookOpen size={30} />
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${used ? 'bg-accent text-white' : 'bg-brand text-brand-ink'}`}
        >
          {used ? 'Used' : 'New'}
        </span>
      </button>
      {actions}

      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{p.name}</p>
        {d.author && <p className="truncate text-[11px] text-ink-muted">by {d.author}</p>}
        {meta && <p className="truncate text-[11px] text-ink-muted">{meta}</p>}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm font-bold text-brand">
          {educationPriceText(p)}
          {mrp && <span className="text-[11px] font-normal text-ink-muted line-through">{formatRupees(mrp)}</span>}
        </p>
        <CardFooter {...props} />
      </div>
    </div>
  );
}

function OtherTile<P extends EducationProduct>({ product: p, isOwner, suspended, buying, added, actions, onView, onBuy }: CardProps<P>) {
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
        <p className="truncate text-[11px] font-semibold text-brand">{educationPriceText(p)}</p>
        {!isOwner && (
          <div className="mt-2 flex">
            <BuyButton label="Buy" buying={buying} added={added} suspended={suspended} onClick={onBuy} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Every detail the seller filled in, as a two-column fact sheet. */
export function EducationFacts({ details, className = '' }: { details: EducationDetails | null | undefined; className?: string }) {
  const rows = formatEducationDetails(details);
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

function ChipList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold text-ink">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Buyer side: the full course / class / counselling / book sheet, with an Enrol / Book / Buy action. */
export function EducationDetailsModal({
  product,
  actionLabel,
  actionDisabled,
  onAction,
  onClose,
}: {
  product: EducationProduct;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onClose: () => void;
}) {
  const details = product.educationDetails;
  const type = educationItemType(details);
  const course = type === 'COURSE' ? (details as CourseDetails) : null;
  const cls = type === 'CLASS' ? (details as ClassDetails) : null;
  const counselling = type === 'COUNSELLING' ? (details as CounsellingDetails) : null;
  const book = type === 'BOOK' ? (details as BookDetails) : null;
  const mrp = bookMrp(product);
  const kicker = course
    ? `Course · ${durationText(course.durationValue, course.durationUnit)} · ${MODE_LABELS[course.mode]}`
    : cls
      ? `Class · ${levelsText(cls.levels)}`
      : counselling
        ? 'Counselling'
        : book
          ? `Book · ${book.condition === 'NEW' ? 'New' : 'Used'}`
          : 'Product';
  const note = cls
    ? `Classes run ${daysText(cls.days)}, ${timingText(cls)}. Enrol now and the institute will confirm your seat.`
    : course?.batchStart
      ? `Next batch starts ${formatEducationDate(course.batchStart)} — enrol now to reserve your seat.`
      : counselling
        ? 'Book a session — the counsellor will confirm the exact date and time with you on chat.'
        : book?.condition === 'USED'
          ? 'Second-hand book — chat with the seller to check its condition before you buy.'
          : null;

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
            ) : course ? (
              <GraduationCap size={36} />
            ) : cls ? (
              <Presentation size={36} />
            ) : counselling ? (
              <MessagesSquare size={36} />
            ) : book ? (
              <BookOpen size={36} />
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
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{kicker}</p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h3>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-base font-bold text-brand">
                {educationPriceText(product)}
                {mrp && <span className="text-xs font-normal text-ink-muted line-through">MRP {formatRupees(mrp)}</span>}
              </p>
            </div>

            {counselling && (
              <>
                <ChipList title="Types of counselling" items={counsellingTypesList(counselling)} />
                <ChipList title="Fields covered" items={counselling.fields} />
              </>
            )}

            <EducationFacts details={details} />

            {note && (
              <p className="flex items-start gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-snug text-brand">
                <CalendarDays size={13} className="mt-0.5 shrink-0" />
                {note}
              </p>
            )}

            {product.description && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-ink">
                  {course ? 'About this course' : cls ? 'About this class' : counselling ? 'About this service' : book ? 'About this book' : 'Details'}
                </h4>
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
