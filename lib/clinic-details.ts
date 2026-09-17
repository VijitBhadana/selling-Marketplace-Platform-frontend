// Clinic & Doctors Cloude: a hospital or clinic (a shop in any of this Cloude's categories)
// lists each of its doctors as a product — qualification, experience, specialisation, which
// days and hours they sit — and can also sell medicines. Anything else (a lab test, an
// X-ray...) stays a plain product. Mirrors backend/src/modules/products/clinic-details.ts.

import { formatRupees } from './booking-details';

export const CLINIC_CLOUDE_SLUG = 'clinic-doctors';

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type ClinicItemType = 'DOCTOR' | 'MEDICINE';

export type DoctorDetails = {
  type: 'DOCTOR';
  specialisation: string;
  otherSpecialisation?: string;
  qualification: string;
  experienceYears: number;
  days: string[];
  timeFrom: string;
  timeTo: string;
  /** Optional second (evening) sitting. */
  timeFrom2?: string;
  timeTo2?: string;
  registrationNo?: string;
};

export type MedicineDetails = {
  type: 'MEDICINE';
  form: string;
  composition: string;
  packSize: string;
  prescriptionRequired: boolean;
  manufacturer?: string;
  /** YYYY-MM */
  expiryDate?: string;
};

export type ClinicDetails = DoctorDetails | MedicineDetails;

export function isClinicCloude(cloudeSlug?: string | null) {
  return cloudeSlug === CLINIC_CLOUDE_SLUG;
}

export function clinicItemType(details?: ClinicDetails | null): ClinicItemType | null {
  return details?.type === 'DOCTOR' || details?.type === 'MEDICINE' ? details.type : null;
}

export const SPECIALISATIONS = [
  'General Physician',
  'Cardiologist',
  'Kidney Specialist (Nephrologist)',
  'Dermatologist',
  'ENT Specialist',
  'Orthopedic',
  'Neurologist',
  'Pediatrician',
  'Gynecologist',
  'Eye Specialist',
  'Dentist',
  'Psychiatrist',
  'Gastroenterologist',
  'Pulmonologist',
  'Urologist',
  'Oncologist',
  'Diabetologist',
  'General Surgeon',
  'Physiotherapist',
  'Radiologist',
  'Pathologist',
  'Other',
];

export const MEDICINE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream / Ointment', 'Drops', 'Powder', 'Inhaler', 'Other'];

/** A hospital posted under a specialisation category most likely adds that kind of doctor — pre-select it. */
const SPECIALISATION_BY_CATEGORY: Record<string, string> = {
  'cardiologist-heart-specialist': 'Cardiologist',
  'kidney-specialist': 'Kidney Specialist (Nephrologist)',
  dermatologist: 'Dermatologist',
  'ent-specialist': 'ENT Specialist',
  orthopedic: 'Orthopedic',
  neurologist: 'Neurologist',
  pediatrician: 'Pediatrician',
  'general-physician': 'General Physician',
  physiotherapy: 'Physiotherapist',
  'x-ray': 'Radiologist',
  radiology: 'Radiologist',
  'pathology-lab': 'Pathologist',
};

export function specialisationOf(d: DoctorDetails) {
  return d.specialisation === 'Other' ? d.otherSpecialisation || 'Specialist' : d.specialisation;
}

/** '14:30' → '2:30 PM' */
export function formatTime(value?: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match) return value ?? '';
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** '10:00 AM – 1:00 PM, 5:00 PM – 8:00 PM' */
export function doctorTimingText(d: Pick<DoctorDetails, 'timeFrom' | 'timeTo' | 'timeFrom2' | 'timeTo2'>) {
  return [
    [d.timeFrom, d.timeTo],
    [d.timeFrom2, d.timeTo2],
  ]
    .filter(([from, to]) => from && to)
    .map(([from, to]) => `${formatTime(from)} – ${formatTime(to)}`)
    .join(', ');
}

/** 'Every day', 'Mon – Sat' (3+ days in a row) or 'Mon, Wed, Fri'. */
export function doctorDaysText(days: readonly string[] = []) {
  const ordered = WEEK_DAYS.filter((day) => days.includes(day));
  if (ordered.length === 7) return 'Every day';
  const positions = ordered.map((day) => WEEK_DAYS.indexOf(day));
  const inARow = ordered.length >= 3 && positions.every((p, i) => i === 0 || p === positions[i - 1] + 1);
  return inARow ? `${ordered[0]} – ${ordered[ordered.length - 1]}` : ordered.join(', ');
}

/** '3 days a week' */
export function daysPerWeekText(days: readonly string[] = []) {
  return `${days.length} day${days.length === 1 ? '' : 's'} a week`;
}

export function experienceText(years: number) {
  return years < 1 ? 'Less than 1 year' : `${years} year${years === 1 ? '' : 's'}`;
}

/** '2027-03' → 'Mar 2027' */
function formatMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, 1);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Past its expiry month (IST, same as the backend) — it can't be bought any more. */
export function isMedicineExpired(d: MedicineDetails) {
  return Boolean(d.expiryDate) && d.expiryDate! < new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 7);
}

/** 'Fee ₹500' for a doctor, '₹120' for a medicine, or 'Contact for fee / price'. */
export function clinicPriceText(p: { price: string | number | null; priceType: 'FIXED' | 'CONTACT_FOR_PRICE'; clinicDetails?: ClinicDetails | null }) {
  const doctor = p.clinicDetails?.type === 'DOCTOR';
  if (p.priceType === 'CONTACT_FOR_PRICE' || p.price == null) return doctor ? 'Contact for fee' : 'Contact for price';
  return doctor ? `Fee ${formatRupees(Number(p.price))}` : formatRupees(Number(p.price));
}

/** Label/value rows for the full doctor / medicine sheet. */
export function formatClinicDetails(details: ClinicDetails | null | undefined): { label: string; value: string }[] {
  const rows: [string, string | undefined][] =
    details?.type === 'DOCTOR'
      ? [
          ['Specialisation', specialisationOf(details)],
          ['Qualification', details.qualification],
          ['Experience', experienceText(details.experienceYears)],
          ['Sits in hospital', daysPerWeekText(details.days)],
          ['Days', doctorDaysText(details.days)],
          ['Timing', doctorTimingText(details)],
          ['Registration no.', details.registrationNo],
        ]
      : details?.type === 'MEDICINE'
        ? [
            ['Type', details.form],
            ['Pack size', details.packSize],
            ['Composition', details.composition],
            ['Manufacturer', details.manufacturer],
            ['Prescription', details.prescriptionRequired ? 'Required' : 'Not required'],
            ['Expiry', details.expiryDate ? formatMonth(details.expiryDate) : undefined],
          ]
        : [];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}

// --- Seller's "Add doctor / medicine" form ---------------------------------------------

/** Doctor, medicine, or anything else (a plain product with no clinic details). */
export type ClinicFormType = ClinicItemType | 'OTHER';

/** Form state: text inputs as strings, the days as a string array, yes/no as 'YES' / 'NO'. */
export type ClinicFormValues = Record<string, string | string[]>;

export function toClinicFormValues(details: ClinicDetails | null | undefined, categorySlug?: string | null): ClinicFormValues {
  if (!details || !clinicItemType(details)) {
    return { specialisation: SPECIALISATION_BY_CATEGORY[categorySlug ?? ''] ?? '', days: [] };
  }
  const values: ClinicFormValues = {};
  for (const [key, value] of Object.entries(details)) {
    if (key === 'type' || value === undefined || value === null) continue;
    values[key] = Array.isArray(value) ? value : typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
  }
  return values;
}

const filled = (value: string | string[] | undefined) => (Array.isArray(value) ? value.length > 0 : Boolean(value?.trim()));
const str = (value: string | string[] | undefined) => (typeof value === 'string' ? value.trim() : '');

/** Labels of the required details the seller hasn't filled in yet. */
export function missingClinicFields(type: ClinicFormType, values: ClinicFormValues): string[] {
  const missing: string[] = [];
  const need = (key: string, label: string) => {
    if (!filled(values[key])) missing.push(label);
  };

  if (type === 'DOCTOR') {
    need('specialisation', 'Specialisation');
    if (values.specialisation === 'Other') need('otherSpecialisation', 'Specialisation name');
    need('qualification', 'Qualification');
    need('experienceYears', 'Experience');
    need('days', 'Days in hospital');
    need('timeFrom', 'Timing (from)');
    need('timeTo', 'Timing (to)');
    if (filled(values.timeFrom2) !== filled(values.timeTo2)) missing.push('Both times of the second session');
  } else if (type === 'MEDICINE') {
    need('form', 'Medicine type');
    need('composition', 'Composition / salt');
    need('packSize', 'Pack size');
    need('prescriptionRequired', 'Prescription needed?');
  }
  return missing;
}

/** What gets sent to the backend as the product's clinicDetails. */
export function clinicPayload(type: ClinicItemType, values: ClinicFormValues): Record<string, unknown> {
  if (type === 'DOCTOR') {
    return {
      type,
      specialisation: str(values.specialisation),
      otherSpecialisation: values.specialisation === 'Other' ? str(values.otherSpecialisation) : undefined,
      qualification: str(values.qualification),
      experienceYears: Number(str(values.experienceYears)),
      days: Array.isArray(values.days) ? values.days : [],
      timeFrom: str(values.timeFrom),
      timeTo: str(values.timeTo),
      timeFrom2: str(values.timeFrom2) || undefined,
      timeTo2: str(values.timeTo2) || undefined,
      registrationNo: str(values.registrationNo) || undefined,
    };
  }
  return {
    type,
    form: str(values.form),
    composition: str(values.composition),
    packSize: str(values.packSize),
    prescriptionRequired: values.prescriptionRequired === 'YES',
    manufacturer: str(values.manufacturer) || undefined,
    expiryDate: str(values.expiryDate) || undefined,
  };
}
