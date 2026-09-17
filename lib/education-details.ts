// Education Cloude: an institute, coaching centre, tutor, counsellor or book / stationery shop
// lists what it offers as products — a course (duration, mode, certificate, fee), a class
// (subject, which classes it's for, who teaches, days and timing, fee), a counselling service
// (types of counselling, fields covered, how sessions happen, fee) or a new / used book.
// Anything else (stationery, a uniform...) stays a plain product.
// Mirrors backend/src/modules/products/education-details.ts.

import { formatRupees } from './booking-details';
import { WEEK_DAYS, doctorDaysText, experienceText, formatTime } from './clinic-details';

export { WEEK_DAYS, experienceText };

export const EDUCATION_CLOUDE_SLUG = 'education';

export type EducationItemType = 'COURSE' | 'CLASS' | 'COUNSELLING' | 'BOOK';
/** The items that charge a fee (per month, per session...) rather than a one-off price. */
export type FeeItemType = Exclude<EducationItemType, 'BOOK'>;
export type FeeUnit = 'TOTAL' | 'PER_MONTH' | 'PER_CLASS' | 'PER_SESSION';

export type CourseDetails = {
  type: 'COURSE';
  mode: string;
  durationValue: number;
  durationUnit: string;
  certificate: boolean;
  eligibility?: string;
  trainer?: string;
  /** YYYY-MM-DD */
  batchStart?: string;
  days?: string[];
  timeFrom?: string;
  timeTo?: string;
  seats?: number;
  feeUnit: FeeUnit;
};

export type ClassDetails = {
  type: 'CLASS';
  subjects: string;
  levels: string[];
  teacherName: string;
  teacherQualification?: string;
  experienceYears?: number;
  mode: string;
  days: string[];
  timeFrom: string;
  timeTo: string;
  durationValue?: number;
  durationUnit?: string;
  batchSize?: number;
  feeUnit: FeeUnit;
};

export type CounsellingDetails = {
  type: 'COUNSELLING';
  counsellingTypes: string[];
  otherType?: string;
  fields: string[];
  sessionModes: string[];
  sessionMinutes?: number;
  counsellorName?: string;
  qualification?: string;
  experienceYears?: number;
  days?: string[];
  timeFrom?: string;
  timeTo?: string;
  feeUnit: FeeUnit;
};

export type BookDetails = {
  type: 'BOOK';
  condition: 'NEW' | 'USED';
  usedCondition?: string;
  author?: string;
  publisher?: string;
  forClass?: string;
  edition?: string;
  /** Printed price — a used book shows how much the buyer saves. */
  mrp?: number;
};

export type EducationDetails = CourseDetails | ClassDetails | CounsellingDetails | BookDetails;

export function isEducationCloude(cloudeSlug?: string | null) {
  return cloudeSlug === EDUCATION_CLOUDE_SLUG;
}

const ITEM_TYPES: EducationItemType[] = ['COURSE', 'CLASS', 'COUNSELLING', 'BOOK'];

export function educationItemType(details?: EducationDetails | null): EducationItemType | null {
  return details && ITEM_TYPES.includes(details.type) ? details.type : null;
}

export const CLASS_LEVELS = ['Nursery / KG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`), 'College', 'Competitive Exams', 'Adults'];

export const MODE_LABELS: Record<string, string> = {
  OFFLINE: 'Offline (at centre)',
  ONLINE: 'Online',
  HYBRID: 'Online + offline',
  HOME: 'Home tuition',
};
export const COURSE_MODES = ['OFFLINE', 'ONLINE', 'HYBRID'];
export const CLASS_MODES = ['OFFLINE', 'ONLINE', 'HOME', 'HYBRID'];

export const SESSION_MODE_LABELS: Record<string, string> = { IN_PERSON: 'In person', ONLINE: 'Online (video call)', PHONE: 'Phone call' };
export const SESSION_MODES = Object.keys(SESSION_MODE_LABELS);

export const DURATION_UNIT_LABELS: Record<string, string> = { DAYS: 'Days', WEEKS: 'Weeks', MONTHS: 'Months', YEARS: 'Years' };
export const DURATION_UNITS = Object.keys(DURATION_UNIT_LABELS);
const DURATION_WORDS: Record<string, [string, string]> = { DAYS: ['day', 'days'], WEEKS: ['week', 'weeks'], MONTHS: ['month', 'months'], YEARS: ['year', 'years'] };

export const USED_CONDITION_LABELS: Record<string, string> = { LIKE_NEW: 'Like new', GOOD: 'Good', FAIR: 'Fair' };
export const USED_CONDITION_HINTS: Record<string, string> = {
  LIKE_NEW: 'Hardly used — no marks, no torn pages.',
  GOOD: 'Used, a few marks or highlights, all pages there.',
  FAIR: 'Well used — writing / highlights, cover worn, still readable.',
};
export const USED_CONDITIONS = Object.keys(USED_CONDITION_LABELS);

/** What the fee is per — the first option of each type is the default. */
export const FEE_UNITS: Record<FeeItemType, FeeUnit[]> = {
  COURSE: ['TOTAL', 'PER_MONTH'],
  CLASS: ['PER_MONTH', 'TOTAL', 'PER_CLASS'],
  COUNSELLING: ['PER_SESSION', 'TOTAL'],
};

export const COUNSELLING_TYPES = [
  'Career Counselling',
  'Admission Guidance',
  'Stream Selection (after 10th)',
  'Course & College Selection',
  'Study Abroad',
  'Competitive Exam Guidance',
  'Scholarship & Education Loan',
  'Aptitude / Psychometric Test',
  'Exam Stress & Wellbeing',
  'Parent Counselling',
  'Other',
];

export const COUNSELLING_FIELDS = [
  'All fields',
  'Engineering',
  'Medical',
  'Commerce & CA',
  'Arts & Humanities',
  'Science & Research',
  'Law',
  'Management / MBA',
  'IT & Computers',
  'Government Jobs',
  'Defence',
  'Design & Fashion',
  'Media & Journalism',
  'Hotel Management',
  'Teaching',
  'Sports',
];

/** What a shop posted in each category most likely adds — pre-selected in the "Add" form. */
const TYPE_BY_CATEGORY: Record<string, EducationItemType> = {
  'career-counselling': 'COUNSELLING',
  'educational-consultancy': 'COUNSELLING',
  'admission-guidance': 'COUNSELLING',
  'study-material-books': 'BOOK',
  'used-books-second-hand-books': 'BOOK',
  'stationery-book-shop': 'BOOK',
  'certificate-courses': 'COURSE',
  'online-courses': 'COURSE',
  'skill-based-short-courses': 'COURSE',
  'diploma-courses': 'COURSE',
  'educational-institutes': 'COURSE',
  'vocational-training-institutes': 'COURSE',
  'technical-institutes': 'COURSE',
  'skill-development-centres': 'COURSE',
  'computer-digital-skills': 'COURSE',
  'communication-soft-skills': 'COURSE',
  'vocational-skill-training': 'COURSE',
};

const MODE_BY_CATEGORY: Record<string, string> = {
  'online-courses': 'ONLINE',
  'school-subject-tutors': 'HOME',
  'language-tutors': 'HOME',
  'music-art-tutors': 'HOME',
  'exam-preparation-tutors': 'HOME',
};

const CONDITION_BY_CATEGORY: Record<string, string> = {
  'used-books-second-hand-books': 'USED',
  'study-material-books': 'NEW',
};

/** Coaching, tutors, sports and hobby classes add classes; institutes add courses; and so on. */
export function defaultEducationType(categorySlug?: string | null): EducationItemType {
  return TYPE_BY_CATEGORY[categorySlug ?? ''] ?? 'CLASS';
}

// --- Display ---------------------------------------------------------------------------

export const daysText = doctorDaysText;

/** 'Class 1 – 5, Class 8, College' — two or more classes in a row collapse into a range. */
export function levelsText(levels: readonly string[] = []) {
  const parts: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length) parts.push(run.length === 1 ? `Class ${run[0]}` : `Class ${run[0]} – ${run[run.length - 1]}`);
    run = [];
  };
  for (const level of CLASS_LEVELS.filter((l) => levels.includes(l))) {
    const n = Number(/^Class (\d+)$/.exec(level)?.[1]);
    if (n && (run.length === 0 || n === run[run.length - 1] + 1)) {
      run.push(n);
    } else {
      flush();
      if (n) run.push(n);
      else parts.push(level);
    }
  }
  flush();
  return parts.join(', ');
}

/** '6 months', '1 year' */
export function durationText(value?: number, unit?: string) {
  if (!value || !unit) return '';
  const [one, many] = DURATION_WORDS[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return `${value} ${value === 1 ? one : many}`;
}

/** '4:00 PM – 5:30 PM', or '' when no timing was given. */
export function timingText(d: { timeFrom?: string; timeTo?: string }) {
  return d.timeFrom && d.timeTo ? `${formatTime(d.timeFrom)} – ${formatTime(d.timeTo)}` : '';
}

/** '2026-10-05' → '5 Oct 2026' */
export function formatEducationDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The counselling types, with "Other" replaced by what the seller typed. */
export function counsellingTypesList(d: CounsellingDetails) {
  return d.counsellingTypes.map((t) => (t === 'Other' ? d.otherType || 'Other' : t));
}

/** The seller's fee unit (from saved details or form values), or the type's default. */
export function effectiveFeeUnit(type: FeeItemType, d?: object | null): FeeUnit {
  const unit = (d as { feeUnit?: unknown } | null | undefined)?.feeUnit as FeeUnit;
  return FEE_UNITS[type].includes(unit) ? unit : FEE_UNITS[type][0];
}

export function feeUnitLabel(type: FeeItemType, unit: FeeUnit) {
  if (unit === 'TOTAL') return type === 'COUNSELLING' ? 'Full package' : 'Full course';
  return { PER_MONTH: 'Per month', PER_CLASS: 'Per class', PER_SESSION: 'Per session' }[unit];
}

function feeSuffix(type: FeeItemType, unit: FeeUnit) {
  if (unit === 'TOTAL') return type === 'COUNSELLING' ? '/ package' : '/ course';
  return { PER_MONTH: '/ month', PER_CLASS: '/ class', PER_SESSION: '/ session' }[unit];
}

type PricedProduct = { price: string | number | null; priceType: 'FIXED' | 'CONTACT_FOR_PRICE'; educationDetails?: EducationDetails | null };

/** '₹1,500 / month' for a class, '₹25,000 / course', '₹800 / session', '₹250' for a book. */
export function educationPriceText(p: PricedProduct) {
  const type = educationItemType(p.educationDetails);
  if (p.priceType === 'CONTACT_FOR_PRICE' || p.price == null) return type && type !== 'BOOK' ? 'Contact for fee' : 'Contact for price';
  const amount = formatRupees(Number(p.price));
  return type && type !== 'BOOK' ? `${amount} ${feeSuffix(type, effectiveFeeUnit(type, p.educationDetails))}` : amount;
}

/** A book's printed price when it's higher than the selling price (shown struck through). */
export function bookMrp(p: PricedProduct): number | null {
  const d = p.educationDetails;
  if (d?.type !== 'BOOK' || !d.mrp || p.priceType !== 'FIXED' || p.price == null) return null;
  return d.mrp > Number(p.price) ? d.mrp : null;
}

/** What the buyer's button says: enrol in a course / class, book a counselling session, buy a book. */
export function educationActionLabel(details?: EducationDetails | null) {
  const type = educationItemType(details);
  return type === 'COURSE' || type === 'CLASS' ? 'Enrol now' : type === 'COUNSELLING' ? 'Book session' : 'Buy';
}

/**
 * Label/value rows for the full course / class / counselling / book sheet. A counselling
 * service's types and fields aren't here — they're shown as chips of their own.
 */
export function formatEducationDetails(details: EducationDetails | null | undefined): { label: string; value: string }[] {
  const experience = (years?: number) => (years === undefined ? undefined : experienceText(years));
  const days = (list?: string[]) => (list?.length ? daysText(list) : undefined);
  let rows: [string, string | undefined][] = [];

  if (details?.type === 'COURSE') {
    rows = [
      ['Mode', MODE_LABELS[details.mode]],
      ['Duration', durationText(details.durationValue, details.durationUnit)],
      ['Certificate', details.certificate ? 'Yes, on completion' : 'No'],
      ['Eligibility', details.eligibility],
      ['Trainer / faculty', details.trainer],
      ['Next batch starts', details.batchStart ? formatEducationDate(details.batchStart) : undefined],
      ['Batch days', days(details.days)],
      ['Batch timing', timingText(details)],
      ['Seats', details.seats ? String(details.seats) : undefined],
      ['Fee', feeUnitLabel('COURSE', effectiveFeeUnit('COURSE', details))],
    ];
  } else if (details?.type === 'CLASS') {
    rows = [
      ['Subject(s)', details.subjects],
      ['For class', levelsText(details.levels)],
      ['Teacher', details.teacherName],
      ['Qualification', details.teacherQualification],
      ['Experience', experience(details.experienceYears)],
      ['Mode', MODE_LABELS[details.mode]],
      ['Days', days(details.days)],
      ['Timing', timingText(details)],
      ['Course length', durationText(details.durationValue, details.durationUnit)],
      ['Batch size', details.batchSize ? `${details.batchSize} students` : undefined],
      ['Fee', feeUnitLabel('CLASS', effectiveFeeUnit('CLASS', details))],
    ];
  } else if (details?.type === 'COUNSELLING') {
    rows = [
      ['Sessions', details.sessionModes.map((m) => SESSION_MODE_LABELS[m] ?? m).join(', ')],
      ['Session length', details.sessionMinutes ? `${details.sessionMinutes} minutes` : undefined],
      ['Counsellor', details.counsellorName],
      ['Qualification', details.qualification],
      ['Experience', experience(details.experienceYears)],
      ['Available days', days(details.days)],
      ['Timing', timingText(details)],
      ['Fee', feeUnitLabel('COUNSELLING', effectiveFeeUnit('COUNSELLING', details))],
    ];
  } else if (details?.type === 'BOOK') {
    rows = [
      ['Condition', details.condition === 'NEW' ? 'New' : `Used — ${USED_CONDITION_LABELS[details.usedCondition ?? ''] ?? 'second-hand'}`],
      ['Author', details.author],
      ['Publisher', details.publisher],
      ['For class / exam', details.forClass],
      ['Edition / year', details.edition],
      ['Printed price (MRP)', details.mrp ? formatRupees(details.mrp) : undefined],
    ];
  }
  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}

// --- Seller's "Add course / class / book" form ------------------------------------------

/** Course, class, counselling, book, or anything else (a plain product with no education details). */
export type EducationFormType = EducationItemType | 'OTHER';

/** Form state: text inputs as strings, multi-selects as string arrays, yes/no as 'YES' / 'NO'. */
export type EducationFormValues = Record<string, string | string[]>;

export function educationNoun(type: EducationFormType) {
  return { COURSE: 'course', CLASS: 'class', COUNSELLING: 'counselling service', BOOK: 'book', OTHER: 'product' }[type];
}

export const EDUCATION_FORM_TEXT: Record<EducationFormType, { nameLabel: string; namePlaceholder: string; descriptionPlaceholder: string }> = {
  COURSE: {
    nameLabel: 'Course name',
    namePlaceholder: 'e.g. Full Stack Web Development',
    descriptionPlaceholder: 'What students will learn, syllabus, projects, placement help...',
  },
  CLASS: {
    nameLabel: 'Class name',
    namePlaceholder: 'e.g. Maths Classes — Class 9 & 10',
    descriptionPlaceholder: 'Board (CBSE / ICSE / State), topics covered, weekly tests, study material...',
  },
  COUNSELLING: {
    nameLabel: 'Service name',
    namePlaceholder: 'e.g. Career Counselling after 12th',
    descriptionPlaceholder: 'How a session works, what the student gets (report, college list, plan)...',
  },
  BOOK: {
    nameLabel: 'Book title',
    namePlaceholder: 'e.g. RD Sharma Mathematics Class 10',
    descriptionPlaceholder: 'Condition details, missing pages, notes inside, set of books...',
  },
  OTHER: {
    nameLabel: 'Product name',
    namePlaceholder: 'e.g. Classmate Notebook (pack of 6)',
    descriptionPlaceholder: 'Brand, size, pack, availability...',
  },
};

/** The price box's label — 'Monthly fee (₹)', 'Fee per session (₹)', 'Selling price (₹)'... */
export function educationPriceLabel(type: EducationItemType, values: EducationFormValues) {
  if (type === 'BOOK') return 'Selling price (₹)';
  const unit = effectiveFeeUnit(type, values);
  if (unit === 'TOTAL') return type === 'COUNSELLING' ? 'Package fee (₹)' : 'Total course fee (₹)';
  return { PER_MONTH: 'Monthly fee (₹)', PER_CLASS: 'Fee per class (₹)', PER_SESSION: 'Fee per session (₹)' }[unit];
}

export function toEducationFormValues(details: EducationDetails | null | undefined, categorySlug?: string | null): EducationFormValues {
  const defaults: EducationFormValues = {
    mode: MODE_BY_CATEGORY[categorySlug ?? ''] ?? '',
    condition: CONDITION_BY_CATEGORY[categorySlug ?? ''] ?? '',
    durationUnit: 'MONTHS',
    days: [],
    levels: [],
    counsellingTypes: [],
    fields: [],
    sessionModes: [],
  };
  if (!details || !educationItemType(details)) return defaults;
  const values: EducationFormValues = { ...defaults };
  for (const [key, value] of Object.entries(details)) {
    if (key === 'type' || value === undefined || value === null) continue;
    values[key] = Array.isArray(value) ? value : typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
  }
  return values;
}

const filled = (value: string | string[] | undefined) => (Array.isArray(value) ? value.length > 0 : Boolean(value?.trim()));
const str = (value: string | string[] | undefined) => (typeof value === 'string' ? value.trim() : '');
const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value : []);
const num = (value: string | string[] | undefined) => (str(value) ? Number(str(value)) : undefined);

/** Labels of the required details the seller hasn't filled in yet. */
export function missingEducationFields(type: EducationFormType, values: EducationFormValues): string[] {
  const missing: string[] = [];
  const need = (key: string, label: string) => {
    if (!filled(values[key])) missing.push(label);
  };
  const bothTimes = (label: string) => {
    if (filled(values.timeFrom) !== filled(values.timeTo)) missing.push(label);
  };

  if (type === 'COURSE') {
    if (!COURSE_MODES.includes(str(values.mode))) missing.push('Mode');
    need('durationValue', 'Course duration');
    need('certificate', 'Certificate given?');
    bothTimes('Both batch times');
  } else if (type === 'CLASS') {
    need('subjects', 'Subject(s)');
    need('levels', 'For which class');
    need('teacherName', 'Who teaches');
    if (!CLASS_MODES.includes(str(values.mode))) missing.push('Mode');
    need('days', 'Class days');
    need('timeFrom', 'Timing (from)');
    need('timeTo', 'Timing (to)');
  } else if (type === 'COUNSELLING') {
    need('counsellingTypes', 'Types of counselling');
    if (list(values.counsellingTypes).includes('Other')) need('otherType', 'Other counselling type');
    need('fields', 'Fields covered');
    need('sessionModes', 'How sessions happen');
    bothTimes('Both available times');
  } else if (type === 'BOOK') {
    need('condition', 'New or used');
    if (values.condition === 'USED') need('usedCondition', "Book's condition");
  }
  return missing;
}

/** What gets sent to the backend as the product's educationDetails. */
export function educationPayload(type: EducationItemType, values: EducationFormValues): Record<string, unknown> {
  const timing = { timeFrom: str(values.timeFrom) || undefined, timeTo: str(values.timeTo) || undefined };
  if (type === 'COURSE') {
    return {
      type,
      mode: str(values.mode),
      durationValue: num(values.durationValue),
      durationUnit: str(values.durationUnit),
      certificate: values.certificate === 'YES',
      eligibility: str(values.eligibility) || undefined,
      trainer: str(values.trainer) || undefined,
      batchStart: str(values.batchStart) || undefined,
      days: list(values.days),
      ...timing,
      seats: num(values.seats),
      feeUnit: effectiveFeeUnit(type, values),
    };
  }
  if (type === 'CLASS') {
    return {
      type,
      subjects: str(values.subjects),
      levels: list(values.levels),
      teacherName: str(values.teacherName),
      teacherQualification: str(values.teacherQualification) || undefined,
      experienceYears: num(values.experienceYears),
      mode: str(values.mode),
      days: list(values.days),
      ...timing,
      durationValue: num(values.durationValue),
      durationUnit: num(values.durationValue) ? str(values.durationUnit) : undefined,
      batchSize: num(values.batchSize),
      feeUnit: effectiveFeeUnit(type, values),
    };
  }
  if (type === 'COUNSELLING') {
    const counsellingTypes = list(values.counsellingTypes);
    return {
      type,
      counsellingTypes,
      otherType: counsellingTypes.includes('Other') ? str(values.otherType) : undefined,
      fields: list(values.fields),
      sessionModes: list(values.sessionModes),
      sessionMinutes: num(values.sessionMinutes),
      counsellorName: str(values.counsellorName) || undefined,
      qualification: str(values.qualification) || undefined,
      experienceYears: num(values.experienceYears),
      days: list(values.days),
      ...timing,
      feeUnit: effectiveFeeUnit(type, values),
    };
  }
  return {
    type,
    condition: str(values.condition),
    usedCondition: values.condition === 'USED' ? str(values.usedCondition) : undefined,
    author: str(values.author) || undefined,
    publisher: str(values.publisher) || undefined,
    forClass: str(values.forClass) || undefined,
    edition: str(values.edition) || undefined,
    mrp: num(values.mrp),
  };
}
