import { getCloudeBySlug } from '@/lib/cloudes-data';

// One colour per category group of a Cloude, shared by the phone category chips (icon
// tint) and the phone shop cards (category tag + initial avatar), so a category reads
// the same in both. Lives in components/ so Tailwind sees the class names.
const TONES = [
  { text: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500' },
  { text: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500' },
  { text: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-500' },
  { text: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500' },
  { text: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500' },
  { text: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500' },
  { text: 'text-pink-500 dark:text-pink-400', bg: 'bg-pink-500' },
  { text: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-500' },
  { text: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500' },
  { text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-600' },
];

export type CategoryTone = (typeof TONES)[number];

/**
 * The tone for a category, matched by name or slug: its group's position in the Cloude
 * when known, otherwise a stable pick from the name (e.g. a shop outside the Cloude's list).
 */
export function categoryTone(cloudeSlug: string | undefined, category: string): CategoryTone {
  const groups = cloudeSlug ? getCloudeBySlug(cloudeSlug)?.groups : undefined;
  const key = category.trim().toLowerCase();
  const gi = groups?.findIndex((g) => g.items.some((it) => it.slug === key || it.name.toLowerCase() === key)) ?? -1;
  if (gi >= 0) return TONES[gi % TONES.length];
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}
