import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import type { SampleListing } from '@/lib/sample-listings';

export function ListingCard({ listing }: { listing: SampleListing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-transform hover:-translate-y-0.5 hover:border-brand"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
        <Image
          src={`${listing.image}?w=600&q=75&auto=format&fit=crop`}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <span className="text-sm font-bold text-ink sm:text-base">{listing.price}</span>
        <h3 className="line-clamp-2 text-sm font-medium text-ink">{listing.title}</h3>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1 whitespace-nowrap"><MapPin size={12} className="shrink-0" /> {listing.city}</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><Clock size={12} className="shrink-0" /> {listing.postedAgo}</span>
        </div>
      </div>
    </Link>
  );
}
