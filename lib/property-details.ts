// Property Cloude: what the seller fills in when listing a property (a product in a
// property shop) — rent or sale, BHK, area, furnishing, deposit, amenities... Buyers see
// these next to the property. Mirrors backend/src/modules/products/property-details.ts.

import {
  PROPERTY_TYPE_BY_CATEGORY,
  effectivePriceUnit,
  formatRupees,
  priceUnitSuffix,
  type PriceUnit,
  type PropertyType,
} from './booking-details';

export type ListingFor = 'RENT' | 'SALE';
export type PropertyDetails = { type?: PropertyType; listingFor?: ListingFor } & Record<string, string | number | string[] | undefined>;

export function getPropertyType(cloudeSlug?: string | null, categorySlug?: string | null): PropertyType | null {
  if (cloudeSlug !== 'property' || !categorySlug) return null;
  return PROPERTY_TYPE_BY_CATEGORY[categorySlug] ?? null;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  HOSTEL: 'Hostel',
  PG: 'PG',
  GUEST_HOUSE: 'Guest house',
  ROOM: 'Room',
  FLAT: 'Flat',
  SHOP: 'Shop',
  OFFICE: 'Office',
  WAREHOUSE: 'Warehouse',
  PLOT: 'Plot',
};

/** Hostel, PG, guest house and room categories are rent-only; the rest can be rented or sold. */
export const RENT_ONLY_TYPES: PropertyType[] = ['HOSTEL', 'PG', 'GUEST_HOUSE', 'ROOM'];

/** What rent can be charged per, by property type. The first option is the default. */
export const RENT_UNIT_OPTIONS: Record<PropertyType, PriceUnit[]> = {
  HOSTEL: ['PER_MONTH', 'PER_DAY'],
  PG: ['PER_MONTH', 'PER_DAY'],
  GUEST_HOUSE: ['PER_DAY', 'PER_MONTH'],
  ROOM: ['PER_MONTH', 'PER_DAY'],
  FLAT: ['PER_MONTH', 'PER_YEAR'],
  SHOP: ['PER_MONTH', 'PER_YEAR'],
  OFFICE: ['PER_MONTH', 'PER_YEAR'],
  WAREHOUSE: ['PER_MONTH', 'PER_YEAR'],
  PLOT: ['PER_MONTH', 'PER_YEAR'],
};

export function listingForOf(details: PropertyDetails | null | undefined): ListingFor {
  return details?.listingFor === 'SALE' ? 'SALE' : 'RENT';
}

/** 'day' / 'month' / 'year' for a rent price unit. */
export function rentUnitWord(unit: PriceUnit) {
  return unit === 'PER_DAY' ? 'day' : unit === 'PER_YEAR' ? 'year' : 'month';
}

export type PropertyField = {
  key: string;
  label: string;
  type: 'select' | 'multi' | 'number' | 'text' | 'date';
  types: PropertyType[] | 'ALL';
  options?: string[];
  /** Required for every type it applies to, or only for these. */
  required?: boolean | PropertyType[];
  /** Only asked when the property is listed for rent / for sale. */
  only?: ListingFor;
  placeholder?: string;
};

const BUILDINGS: PropertyType[] = ['FLAT', 'SHOP', 'OFFICE', 'WAREHOUSE'];

export const PROPERTY_FIELDS: PropertyField[] = [
  { key: 'configuration', label: 'BHK', type: 'select', types: ['FLAT'], options: ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'], required: true },
  { key: 'roomType', label: 'Room type', type: 'select', types: ['ROOM', 'GUEST_HOUSE'], options: ['Single room', 'Double room', 'Triple room', 'Shared / dormitory'], required: true },
  { key: 'sharing', label: 'Sharing', type: 'select', types: ['HOSTEL', 'PG'], options: ['Single (private room)', '2 sharing', '3 sharing', '4+ sharing'], required: true },
  { key: 'gender', label: 'For', type: 'select', types: ['HOSTEL', 'PG'], options: ['Boys', 'Girls', 'Anyone'], required: true },
  { key: 'area', label: 'Area (sq ft)', type: 'number', types: ['ROOM', ...BUILDINGS, 'PLOT'], required: [...BUILDINGS, 'PLOT'], placeholder: 'e.g. 950' },
  { key: 'plotSize', label: 'Plot size', type: 'text', types: ['PLOT'], placeholder: 'e.g. 30 × 40 ft' },
  { key: 'furnishing', label: 'Furnishing', type: 'select', types: ['HOSTEL', 'PG', 'GUEST_HOUSE', 'ROOM', 'FLAT', 'OFFICE'], options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], required: true },
  { key: 'bathroom', label: 'Bathroom', type: 'select', types: ['HOSTEL', 'PG', 'GUEST_HOUSE', 'ROOM'], options: ['Attached', 'Common / shared'], required: true },
  { key: 'bathrooms', label: 'Bathrooms', type: 'number', types: ['FLAT'], required: true, placeholder: 'e.g. 2' },
  { key: 'food', label: 'Food', type: 'select', types: ['HOSTEL', 'PG', 'GUEST_HOUSE'], options: ['Included', 'Not included', 'Available at extra cost'], required: ['HOSTEL', 'PG'] },
  { key: 'floor', label: 'Floor', type: 'text', types: ['ROOM', ...BUILDINGS], placeholder: 'e.g. Ground / 2nd of 5' },
  { key: 'facing', label: 'Facing', type: 'select', types: ['FLAT', 'SHOP', 'PLOT'], options: ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'] },
  { key: 'tenantPreference', label: 'Preferred tenants', type: 'select', types: ['ROOM', 'FLAT'], options: ['Anyone', 'Family', 'Bachelors', 'Students', 'Working professionals'], only: 'RENT' },
  { key: 'deposit', label: 'Security deposit (₹)', type: 'number', types: 'ALL', only: 'RENT', placeholder: 'e.g. 20000' },
  { key: 'maintenance', label: 'Maintenance (₹ / month)', type: 'number', types: BUILDINGS, placeholder: 'e.g. 1500' },
  { key: 'minDuration', label: 'Minimum rent period', type: 'number', types: 'ALL', only: 'RENT', placeholder: 'e.g. 11' },
  { key: 'availableFrom', label: 'Available from', type: 'date', types: 'ALL' },
  { key: 'ownership', label: 'Ownership', type: 'select', types: [...BUILDINGS, 'PLOT'], options: ['Freehold', 'Leasehold', 'Co-operative society', 'Power of attorney'], only: 'SALE' },
  { key: 'possession', label: 'Possession', type: 'select', types: BUILDINGS, options: ['Ready to move', 'Under construction'], only: 'SALE' },
  {
    key: 'amenities',
    label: 'Amenities',
    type: 'multi',
    types: ['HOSTEL', 'PG', 'GUEST_HOUSE', 'ROOM', ...BUILDINGS],
    options: ['Parking', 'Power backup', 'Lift', '24×7 water', 'Wi-Fi', 'AC', 'CCTV / Security', 'Gated society', 'Housekeeping', 'Laundry', 'Washroom', 'Loading area'],
  },
  {
    key: 'plotFeatures',
    label: 'Plot features',
    type: 'multi',
    types: ['PLOT'],
    options: ['Boundary wall', 'Corner plot', 'Road access', 'Water connection', 'Electricity connection', 'Gated colony'],
  },
  { key: 'address', label: 'Locality / address', type: 'text', types: 'ALL', required: true, placeholder: 'e.g. Sector 62, near Metro Station' },
];

export function fieldApplies(field: PropertyField, type: PropertyType, listingFor: ListingFor) {
  return (field.types === 'ALL' || field.types.includes(type)) && (!field.only || field.only === listingFor);
}

export function isFieldRequired(field: PropertyField, type: PropertyType) {
  return field.required === true || (Array.isArray(field.required) && field.required.includes(type));
}

function formatDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Label/value rows for every detail the seller filled in (except the address, which is shown on its own). */
export function formatPropertyDetails(details: PropertyDetails | null | undefined, priceUnit: PriceUnit): { label: string; value: string }[] {
  if (!details?.type) return [];
  const rows: { label: string; value: string }[] = [];

  for (const field of PROPERTY_FIELDS) {
    const value = details[field.key];
    if (field.key === 'address' || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    const label = field.label.replace(/\s*\(.*\)$/, '');

    let text: string;
    if (Array.isArray(value)) text = value.join(', ');
    else if (field.type === 'date') text = formatDate(String(value));
    else if (field.key === 'deposit') text = Number(value) ? formatRupees(Number(value)) : 'No deposit';
    else if (field.key === 'maintenance') text = `${formatRupees(Number(value))} / month`;
    else if (field.key === 'area') text = `${Number(value).toLocaleString('en-IN')} sq ft`;
    else if (field.key === 'minDuration') {
      if (Number(value) <= 1) continue;
      text = `${value} ${rentUnitWord(priceUnit)}s`;
    } else text = String(value);

    rows.push({ label, value: text });
  }
  return rows;
}

/** A few short facts for a property card: "2 BHK", "950 sq ft", "Semi-furnished"... */
export function propertyHighlights(details: PropertyDetails | null | undefined): string[] {
  if (!details?.type) return [];
  const facts = [
    details.configuration,
    details.roomType,
    details.sharing,
    details.gender && details.gender !== 'Anyone' ? `${details.gender} only` : undefined,
    details.area ? `${Number(details.area).toLocaleString('en-IN')} sq ft` : undefined,
    details.furnishing,
    details.food === 'Included' ? 'Food included' : undefined,
  ];
  return facts.filter((f): f is string => typeof f === 'string' && f.length > 0).slice(0, 4);
}

/** "₹18,500 / month", "₹45,00,000" (for sale) or "Contact for price". */
export function propertyPriceText(p: { price: string | number | null; priceType: 'FIXED' | 'CONTACT_FOR_PRICE'; priceUnit?: string | null }) {
  if (p.priceType === 'CONTACT_FOR_PRICE' || p.price == null) return 'Contact for price';
  const suffix = priceUnitSuffix('PROPERTY', effectivePriceUnit('PROPERTY', p.priceUnit));
  return `${formatRupees(Number(p.price))}${suffix ? ` ${suffix}` : ''}`;
}

// --- Seller's "Add a property" form ---------------------------------------------------

/** Form state: text inputs as strings, multi-selects as string arrays. */
export type PropertyFormValues = Record<string, string | string[]>;

export function toPropertyFormValues(details?: PropertyDetails | null): PropertyFormValues {
  const values: PropertyFormValues = {};
  for (const [key, value] of Object.entries(details ?? {})) {
    if (key === 'type' || value === undefined || value === null) continue;
    values[key] = Array.isArray(value) ? value : String(value);
  }
  return values;
}

export function propertyFormListingFor(type: PropertyType, values: PropertyFormValues): ListingFor | null {
  if (RENT_ONLY_TYPES.includes(type)) return 'RENT';
  return values.listingFor === 'RENT' || values.listingFor === 'SALE' ? values.listingFor : null;
}

/** Labels of the required details the seller hasn't filled in yet. */
export function missingPropertyFields(type: PropertyType, values: PropertyFormValues): string[] {
  const listingFor = propertyFormListingFor(type, values);
  if (!listingFor) return ['Rent or sale'];
  return PROPERTY_FIELDS.filter((field) => {
    if (!fieldApplies(field, type, listingFor) || !isFieldRequired(field, type)) return false;
    const value = values[field.key];
    if (Array.isArray(value)) return value.length === 0;
    return field.type === 'number' ? !(Number(value) > 0) : !value?.trim();
  }).map((field) => field.label);
}

/** What gets sent to the backend: only the fields that apply, numbers as numbers. */
export function propertyPayload(type: PropertyType, values: PropertyFormValues): PropertyDetails {
  const listingFor = propertyFormListingFor(type, values) ?? 'RENT';
  const payload: PropertyDetails = { listingFor };
  for (const field of PROPERTY_FIELDS) {
    if (!fieldApplies(field, type, listingFor)) continue;
    const value = values[field.key];
    if (Array.isArray(value)) {
      if (value.length) payload[field.key] = value;
      continue;
    }
    const text = value?.trim();
    if (text) payload[field.key] = field.type === 'number' ? Number(text) : text;
  }
  return payload;
}
