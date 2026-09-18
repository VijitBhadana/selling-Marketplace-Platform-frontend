import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  Briefcase,
  CalendarCheck,
  Dumbbell,
  Factory,
  GraduationCap,
  Heart,
  Home,
  ShoppingBag,
  Sprout,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { Cloude } from '@/lib/cloudes-data';
import { Icon } from './icon';

export type CardStyle = {
  title: string;
  blurb: string;
  icon: LucideIcon;
  /** Icon tile: background, border and glyph colour. */
  tile: string;
  badge?: { label: string; className: string };
};

// Home-page presentation for each Cloude — short title, one-line pitch and its own accent colour.
export const cardStyles: Record<string, CardStyle> = {
  shopping: {
    title: 'Shopping',
    blurb: 'Grocery, daily retail, fashion, gadgets and home essentials.',
    icon: ShoppingBag,
    tile: 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-400/40 dark:text-indigo-300',
    badge: { label: 'HOT', className: 'bg-cyan-50 border-cyan-300 text-cyan-700 dark:bg-cyan-400/10 dark:border-cyan-400/40 dark:text-cyan-300' },
  },
  food: {
    title: 'Food & Tiffins',
    blurb: 'Restaurants, home cloud kitchens, daily tiffins & street bites.',
    icon: UtensilsCrossed,
    tile: 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/15 dark:border-orange-400/40 dark:text-orange-300',
    badge: { label: 'POPULAR', className: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/40 dark:text-amber-300' },
  },
  skill: {
    title: 'Skill & Servicing',
    blurb: 'Electricians, AC mistris, plumbers, carpenters & repairs.',
    icon: Zap,
    tile: 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-500/15 dark:border-cyan-400/40 dark:text-cyan-300',
    badge: { label: 'FAST', className: 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-400/10 dark:border-teal-400/40 dark:text-teal-300' },
  },
  software: {
    title: 'Jobs & Freelance',
    blurb: 'Local shop staff, sales hiring, delivery executives & coders.',
    icon: Briefcase,
    tile: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:border-fuchsia-400/40 dark:text-fuchsia-300',
  },
  financing: {
    title: 'Financing',
    blurb: 'Business loans, gold loans, tax consultants & GST filings.',
    icon: BadgeIndianRupee,
    tile: 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-400/40 dark:text-emerald-300',
  },
  booking: {
    title: 'Booking',
    blurb: 'Travel taxis, tempo travellers, bus tickets & driver hire.',
    icon: CalendarCheck,
    tile: 'bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-500/15 dark:border-sky-400/40 dark:text-sky-300',
  },
  wedding: {
    title: 'Wedding',
    blurb: 'Banquet lawns, pandits, mehondi, photography & DJ sound.',
    icon: Heart,
    tile: 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/15 dark:border-rose-400/40 dark:text-rose-300',
  },
  property: {
    title: 'Property',
    blurb: '1/2/3BHK flats, plots, commercial shops & student PG rooms.',
    icon: Home,
    tile: 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-500/15 dark:border-violet-400/40 dark:text-violet-300',
  },
  rent: {
    title: 'Rent Anything',
    blurb: 'Furniture on rent, power generators, DSLR cameras & tools.',
    icon: Wrench,
    tile: 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-500/15 dark:border-teal-400/40 dark:text-teal-300',
  },
  manufacturing: {
    title: 'Mini Factory',
    blurb: 'Small scale manufacturing, packing, textiles & crafts.',
    icon: Factory,
    tile: 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-600/15 dark:border-orange-500/40 dark:text-orange-300',
  },
  education: {
    title: 'Education',
    blurb: 'Home tutors (CBSE/ICSE), JEE coaching, dance & music.',
    icon: GraduationCap,
    tile: 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/15 dark:border-blue-400/40 dark:text-blue-300',
  },
  agriculture: {
    title: 'Agriculture & Farmer',
    blurb: 'Farm seeds, mandi fresh vegetables, tractors & fertilizer.',
    icon: Sprout,
    tile: 'bg-lime-50 border-lime-200 text-lime-600 dark:bg-lime-500/15 dark:border-lime-400/40 dark:text-lime-300',
  },
  'clinic-doctors': {
    title: 'Clinic & Doctors',
    blurb: 'Physicians, dental care, physiotherapy & diagnostic labs.',
    icon: Stethoscope,
    tile: 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/15 dark:border-red-400/40 dark:text-red-300',
  },
  'sports-fitness-gym': {
    title: 'Sports & Fitness',
    blurb: 'Gym memberships, badminton, yoga trainers & sports gear.',
    icon: Dumbbell,
    tile: 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-600/15 dark:border-cyan-500/40 dark:text-cyan-300',
  },
};

export function CloudeCard({ cloude }: { cloude: Cloude }) {
  const style = cardStyles[cloude.slug];
  const title = style?.title ?? cloude.name.replace(' Cloude', '');
  const blurb = style?.blurb ?? cloude.description;
  const IconGlyph = style?.icon;

  return (
    <Link
      href={`/cloudes/${cloude.slug}`}
      className="group flex min-h-[150px] flex-col rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-card sm:p-5 dark:border-white/[0.06] dark:bg-[#0d1b2e]/80 dark:hover:border-cyan-400/40 dark:hover:bg-[#10223a]"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
            style?.tile ?? 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-500/15 dark:border-cyan-400/40 dark:text-cyan-300'
          }`}
        >
          {IconGlyph ? <IconGlyph size={16} strokeWidth={2} /> : <Icon name={cloude.icon} size={16} />}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="font-hero text-[15px] font-bold leading-tight text-ink dark:text-white">{title}</h3>
        {style?.badge && (
          <span
            className={`shrink-0 rounded border px-1.5 py-px text-[9px] font-bold tracking-wide ${style.badge.className}`}
          >
            {style.badge.label}
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{blurb}</p>

      <div className="mt-auto flex items-center justify-between pt-4 text-[11px]">
        <span className="text-ink-muted dark:text-slate-400">{cloude.categories.length} categories</span>
        <span className="inline-flex items-center gap-1 font-semibold text-cyan-600 transition-colors group-hover:text-cyan-700 dark:text-cyan-400 dark:group-hover:text-cyan-300">
          Explore
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
