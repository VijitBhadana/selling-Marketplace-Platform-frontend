// Second-hand / refurbished items. A seller selling goods (not a service) in a shop where
// pre-owned things make sense — a phone, a sofa, a cycle, gym equipment — can mark the item
// as used or refurbished, and buyers see it on the item. Mirrors backend products/item-condition.ts.
import { getBookingKind } from '@/lib/booking-details';
import { getPropertyType } from '@/lib/property-details';

/** What the seller picks. NEW is sent as-is but stored as null — only pre-owned items carry a condition. */
export type ItemCondition = 'NEW' | 'USED' | 'REFURBISHED';

export const ITEM_CONDITION_OPTIONS: { value: ItemCondition; label: string; hint: string }[] = [
  { value: 'NEW', label: 'New', hint: 'Brand new, never used.' },
  { value: 'USED', label: 'Second hand', hint: 'Pre-owned / used — buyers see a "Second hand" tag on it.' },
  { value: 'REFURBISHED', label: 'Refurbished', hint: 'Used, then repaired or restored to work like new — buyers see a "Refurbished" tag on it.' },
];

/** The tag buyers see on a pre-owned item; null for a new one. */
export function conditionLabel(condition?: string | null): string | null {
  if (condition === 'USED') return 'Second hand';
  if (condition === 'REFURBISHED') return 'Refurbished';
  return null;
}

// Cloudes whose shops sell goods that can be pre-owned. Food, medicines, farm produce,
// courses, loans, jobs, bookings and rentals can't; Education books carry their own
// new / used choice; a Mini Factory makes things new.
const SECOND_HAND_CLOUDES = ['shopping', 'skill', 'wedding', 'property', 'sports-fitness-gym'];

// Consumables inside those cloudes — nobody sells used groceries, cosmetics or pooja samagri.
const NEW_ONLY_CATEGORIES: Record<string, string[]> = {
  shopping: ['grocery-items-daily-use', 'beauty-products'],
  skill: [
    'pooja-items-pooja-material',
    'beauty-makeup-salon-parlour-products-items-mehndi-artist',
    'cleaning-products',
    'snacks-and-similar-products',
  ],
  wedding: ['pooja-items'],
};

/** Can an item in this shop be marked second hand / refurbished? Services and bookings never can. */
export function canBeSecondHand(cloudeSlug?: string | null, categorySlug?: string | null, isService = false): boolean {
  if (!cloudeSlug || !categorySlug || isService) return false;
  if (!SECOND_HAND_CLOUDES.includes(cloudeSlug)) return false;
  if (getBookingKind(cloudeSlug, categorySlug) || getPropertyType(cloudeSlug, categorySlug)) return false;
  return !NEW_ONLY_CATEGORIES[cloudeSlug]?.includes(categorySlug);
}
