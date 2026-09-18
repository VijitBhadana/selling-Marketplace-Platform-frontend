import Link from 'next/link';
import { Clock, MapPin, Package, Star, Store, Wrench } from 'lucide-react';
import type { LiveShop, Rating } from '@/lib/api';
import { FALLBACK_LISTING_IMAGE, withImageParams } from '@/lib/image-utils';
import { SmartImage } from './smart-image';

const UNIT_SUFFIX: Record<string, string> = {
  PER_HOUR: '/hr',
  PER_DAY: '/day',
  PER_NIGHT: '/night',
  PER_ROOM_NIGHT: '/room/night',
  PER_PERSON: '/person',
  PER_MONTH: '/mo',
  PER_YEAR: '/yr',
};

function priceText(p: LiveShop['products'][number]) {
  if (p.priceType === 'CONTACT_FOR_PRICE' || p.price == null) return 'Contact for price';
  return `₹${Number(p.price).toLocaleString('en-IN')}${(p.priceUnit && UNIT_SUFFIX[p.priceUnit]) ?? ''}`;
}

/** Buyers' average stars, or "New" until someone who received an order rates it. */
export function RatingBadge({ rating }: { rating?: Rating }) {
  if (!rating?.count || rating.avg == null) {
    return (
      <span className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold text-ink-muted">New</span>
    );
  }
  return (
    <span
      title={`${rating.avg} out of 5 from ${rating.count} buyer${rating.count === 1 ? '' : 's'}`}
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
    >
      <Star size={11} className="fill-current" /> {rating.avg.toFixed(1)}
      <span className="font-medium opacity-70">({rating.count})</span>
    </span>
  );
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} mins ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export function LiveShopCard({ shop, rating }: { shop: LiveShop; rating?: Rating }) {
  const name = shop.shopName || shop.title;
  const cover = shop.coverImageUrl || shop.products.find((p) => p.imageUrl)?.imageUrl || FALLBACK_LISTING_IMAGE;
  const more = shop._count.products - shop.products.length;

  return (
    <Link
      href={`/listing/${shop.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft">
        <SmartImage
          src={withImageParams(cover, 'w=600&q=75&auto=format&fit=crop')}
          alt={name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 max-w-[calc(100%-5.5rem)] truncate rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {shop.cloude.name.replace(' Cloude', '')}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-base font-bold text-ink group-hover:text-brand">{name}</h3>
          <RatingBadge rating={rating} />
        </div>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
          <Store size={12} className="shrink-0" />
          <span className="truncate">{shop.category.name}</span>
        </span>

        {shop.products.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-border pt-3">
            {shop.products.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5">
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-brand-soft text-brand">
                  {p.imageUrl ? (
                    <SmartImage
                      src={withImageParams(p.imageUrl, 'w=96&q=70&auto=format&fit=crop')}
                      alt={p.name}
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      {p.isService ? <Wrench size={14} /> : <Package size={14} />}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{p.name}</span>
                  <span className="block truncate text-[11px] font-semibold text-brand">{priceText(p)}</span>
                </span>
              </li>
            ))}
            {more > 0 && (
              <li className="text-[11px] font-medium text-ink-muted">
                +{more} more {more === 1 ? 'item' : 'items'}
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-3 border-t border-border pt-3 text-xs text-ink-muted">
            {shop.description ? <span className="line-clamp-2">{shop.description}</span> : 'Products coming soon'}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3 text-xs text-ink-muted">
          {shop.city && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin size={12} className="shrink-0" /> {shop.city}
            </span>
          )}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock size={12} className="shrink-0" /> {timeAgo(shop.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
