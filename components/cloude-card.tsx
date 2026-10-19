import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
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
  /** Unsplash cover photo (no query string) shown on the home-page card. */
  image: string;
  /** Two short chips under the blurb. */
  tags: [string, string];
};

// Home-page presentation for each Cloude — short title, one-line pitch and its own accent colour.
export const cardStyles: Record<string, CardStyle> = {
  shopping: {
    title: 'Shopping',
    blurb: 'Grocery, daily retail, fashion, gadgets and home essentials.',
    icon: ShoppingBag,
    tile: 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-400/40 dark:text-indigo-300',
    badge: { label: 'HOT', className: 'bg-cyan-50 border-cyan-300 text-cyan-700 dark:bg-cyan-400/10 dark:border-cyan-400/40 dark:text-cyan-300' },
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
    tags: ['Grocery', 'Fashion'],
  },
  food: {
    title: 'Food & Tiffins',
    blurb: 'Restaurants, home cloud kitchens, daily tiffins & street bites.',
    icon: UtensilsCrossed,
    tile: 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/15 dark:border-orange-400/40 dark:text-orange-300',
    badge: { label: 'POPULAR', className: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/40 dark:text-amber-300' },
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    tags: ['Restaurants', 'Tiffins'],
  },
  skill: {
    title: 'Skill & Servicing',
    blurb: 'Electricians, AC mistris, plumbers, carpenters & repairs.',
    icon: Zap,
    tile: 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-500/15 dark:border-cyan-400/40 dark:text-cyan-300',
    badge: { label: 'FAST', className: 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-400/10 dark:border-teal-400/40 dark:text-teal-300' },
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e',
    tags: ['Electricians', 'AC repair'],
  },
  software: {
    title: 'Jobs & Freelance',
    blurb: 'Local shop staff, sales hiring, delivery executives & coders.',
    icon: Briefcase,
    tile: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:border-fuchsia-400/40 dark:text-fuchsia-300',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    tags: ['Local jobs', 'Freelance'],
  },
  financing: {
    title: 'Financing',
    blurb: 'Business loans, gold loans, tax consultants & GST filings.',
    icon: BadgeIndianRupee,
    tile: 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-400/40 dark:text-emerald-300',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
    tags: ['Loans', 'GST & tax'],
  },
  booking: {
    title: 'Booking',
    blurb: 'Travel taxis, tempo travellers, bus tickets & driver hire.',
    icon: CalendarCheck,
    tile: 'bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-500/15 dark:border-sky-400/40 dark:text-sky-300',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
    tags: ['Taxis', 'Bus tickets'],
  },
  wedding: {
    title: 'Wedding',
    blurb: 'Banquet lawns, pandits, mehondi, photography & DJ sound.',
    icon: Heart,
    tile: 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/15 dark:border-rose-400/40 dark:text-rose-300',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
    tags: ['Banquets', 'Photography'],
  },
  property: {
    title: 'Property',
    blurb: '1/2/3BHK flats, plots, commercial shops & student PG rooms.',
    icon: Home,
    tile: 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-500/15 dark:border-violet-400/40 dark:text-violet-300',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    tags: ['Flats', 'PG rooms'],
  },
  rent: {
    title: 'Rent Anything',
    blurb: 'Furniture on rent, power generators, DSLR cameras & tools.',
    icon: Wrench,
    tile: 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-500/15 dark:border-teal-400/40 dark:text-teal-300',
    image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5',
    tags: ['Furniture', 'Cameras'],
  },
  manufacturing: {
    title: 'Mini Factory',
    blurb: 'Small scale manufacturing, packing, textiles & crafts.',
    icon: Factory,
    tile: 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-600/15 dark:border-orange-500/40 dark:text-orange-300',
    image: 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88',
    tags: ['Textiles', 'Crafts'],
  },
  education: {
    title: 'Education',
    blurb: 'Home tutors (CBSE/ICSE), JEE coaching, dance & music.',
    icon: GraduationCap,
    tile: 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/15 dark:border-blue-400/40 dark:text-blue-300',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    tags: ['Tutors', 'Coaching'],
  },
  agriculture: {
    title: 'Agriculture & Farmer',
    blurb: 'Farm seeds, mandi fresh vegetables, tractors & fertilizer.',
    icon: Sprout,
    tile: 'bg-lime-50 border-lime-200 text-lime-600 dark:bg-lime-500/15 dark:border-lime-400/40 dark:text-lime-300',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9',
    tags: ['Seeds', 'Tractors'],
  },
  'clinic-doctors': {
    title: 'Clinic & Doctors',
    blurb: 'Physicians, dental care, physiotherapy & diagnostic labs.',
    icon: Stethoscope,
    tile: 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/15 dark:border-red-400/40 dark:text-red-300',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
    tags: ['Doctors', 'Labs'],
  },
  'sports-fitness-gym': {
    title: 'Sports & Fitness',
    blurb: 'Gym memberships, badminton, yoga trainers & sports gear.',
    icon: Dumbbell,
    tile: 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-600/15 dark:border-cyan-500/40 dark:text-cyan-300',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
    tags: ['Gym', 'Yoga'],
  },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';

// Card background, reused by the notch around the arrow button so the cut-out
// blends into the card in both themes.
const NOTCH_CORNER = { background: 'radial-gradient(circle at 0 0, transparent 19.5px, var(--card) 20px)' };

export function CloudeCard({ cloude }: { cloude: Cloude }) {
  const style = cardStyles[cloude.slug];
  const title = style?.title ?? cloude.name.replace(' Cloude', '');
  const blurb = style?.blurb ?? cloude.description;
  const IconGlyph = style?.icon;

  return (
    <Link
      href={`/cloudes/${cloude.slug}`}
      className="group flex flex-col rounded-[28px] border border-border bg-[var(--card)] p-3 shadow-card transition-all duration-300 [--card:rgb(var(--surface))] hover:-translate-y-1 hover:border-teal-400/50 dark:border-white/[0.08] dark:shadow-none dark:[--card:#132847] dark:hover:border-teal-300/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-brand-soft">
        <Image
          src={`${style?.image ?? FALLBACK_IMAGE}?w=900&q=80&auto=format&fit=crop`}
          alt={title}
          fill
          sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <span className="absolute left-1/2 top-3 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
          {IconGlyph ? (
            <IconGlyph size={15} strokeWidth={2.25} className="text-amber-400" />
          ) : (
            <Icon name={cloude.icon} size={15} className="text-amber-400" />
          )}
          {cloude.categories.length} categories
        </span>

        {/* Notch cut into the bottom-right corner, holding the arrow button. */}
        <span aria-hidden className="absolute bottom-[66px] right-0 h-5 w-5" style={NOTCH_CORNER} />
        <span aria-hidden className="absolute bottom-0 right-[66px] h-5 w-5" style={NOTCH_CORNER} />
        <span className="absolute bottom-0 right-0 rounded-tl-[24px] bg-[var(--card)] pl-2.5 pt-2.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight size={22} strokeWidth={2.25} />
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <h3 className="font-hero text-xl font-bold leading-tight text-ink dark:text-white">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{blurb}</p>
        {style?.tags && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {style.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink dark:bg-white/10 dark:text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
