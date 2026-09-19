'use client';

import Link from 'next/link';
import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, MapPin, MessageCircle, Sparkles, Star, Store } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { withImageParams } from '@/lib/image-utils';
import { formatDistance } from '@/lib/user-location';
import { categoryTone } from '@/components/category-tones';
import { SmartImage } from '@/components/smart-image';
import { startTopLoader } from '@/components/top-loader';

export type ShopCardProps = {
  id: string;
  shopName: string;
  categoryName: string;
  description?: string;
  image: string;
  city?: string;
  isNew?: boolean;
  /** Buyers' average stars; phone cards show "New" until the first rating. */
  rating?: { avg: number | null; count: number };
  /** The seller confirmed their email or phone with an OTP. */
  verified?: boolean;
  /** Straight-line distance from the visitor, when both have coordinates. */
  distanceKm?: number;
  /** The Cloude being browsed — phone cards tint the category tag and avatar to match its chip. */
  cloudeSlug?: string;
};

// Grids render many of these at once — memoized so a grid re-render (e.g.
// merging in locally-posted drafts) doesn't re-render every unaffected card.
export const ShopCard = memo(function ShopCard({
  id,
  shopName,
  categoryName,
  description,
  image,
  city,
  isNew,
  rating,
  verified,
  distanceKm,
  cloudeSlug,
}: ShopCardProps) {
  const { requireAuth } = useAuth();
  const { openChat } = useChat();
  const router = useRouter();
  const initial = shopName.trim().charAt(0).toUpperCase() || 'S';
  const tone = categoryTone(cloudeSlug, categoryName).bg;
  const rated = !!rating?.count && rating.avg != null;

  function visitStore() {
    startTopLoader(`/listing/${id}`);
    router.push(`/listing/${id}`);
  }

  function openChatPanel() {
    requireAuth(() => openChat({ listingId: id, title: shopName, image }), 'purchase');
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-soft">
        <SmartImage
          src={withImageParams(image, 'w=600&q=75&auto=format&fit=crop')}
          alt={shopName}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
        <span
          className={`absolute left-2 top-2 truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm md:left-3 md:top-3 md:rounded-full md:bg-accent md:px-3 md:py-1 md:text-xs md:font-semibold md:normal-case md:tracking-normal ${tone} ${
            isNew ? 'max-w-[calc(100%-4.5rem)] md:max-w-[calc(100%-6rem)]' : 'max-w-[calc(100%-1rem)] md:max-w-[calc(100%-1.5rem)]'
          }`}
        >
          {categoryName}
        </span>
        {isNew && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink shadow-sm md:right-3 md:top-3 md:px-2.5 md:py-1 md:text-[11px]">
            <Sparkles size={11} className="text-brand" /> New
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-2.5 pb-2.5 md:px-4 md:pb-4">
        <span
          className={`relative -mt-5 mb-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-surface text-sm font-bold text-white shadow-card md:-mt-6 md:mb-2 md:h-12 md:w-12 md:rounded-2xl md:border-4 md:bg-brand md:text-lg md:text-brand-ink ${tone}`}
        >
          {initial}
          {verified && (
            <span
              title="Verified seller"
              className="absolute -bottom-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-brand-ink ring-2 ring-surface md:hidden"
            >
              <Check size={10} strokeWidth={3.5} aria-hidden />
              <span className="sr-only">Verified seller</span>
            </span>
          )}
        </span>

        <Link
          href={`/listing/${id}`}
          className="line-clamp-1 break-words font-display text-sm font-bold leading-tight text-ink hover:text-brand md:line-clamp-none md:text-base"
        >
          {shopName}
        </Link>
        <span className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-ink-muted md:hidden">
          <Star size={11} className={`shrink-0 text-amber-400 ${rated ? 'fill-amber-400' : ''}`} aria-hidden />
          <span className="shrink-0 font-semibold text-ink">{rated ? rating!.avg!.toFixed(1) : 'New'}</span>
          <span aria-hidden className="shrink-0 opacity-60">
            •
          </span>
          <span className="truncate">{categoryName}</span>
        </span>
        <span className="mt-0.5 hidden items-start gap-1 text-xs font-medium text-ink-muted md:flex">
          <Store size={12} className="mt-0.5 shrink-0" /> {categoryName}
        </span>

        {description && (
          <p className="mt-1.5 line-clamp-2 break-words text-[11px] leading-snug text-ink-muted md:mt-2 md:text-sm">
            {description}
          </p>
        )}

        {(city || distanceKm != null) && (
          <span
            className={`mt-1.5 flex min-w-0 items-center gap-1 text-[11px] font-medium text-brand md:mt-2 md:text-xs md:font-normal md:text-ink-muted ${
              city ? '' : 'md:hidden'
            }`}
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {city}
              {distanceKm != null && (
                <span className="md:hidden">
                  {city ? ' • ' : ''}
                  {formatDistance(distanceKm)}
                </span>
              )}
            </span>
          </span>
        )}

        <div className="mt-auto flex flex-col gap-1.5 pt-3 md:flex-row md:flex-wrap md:gap-2 md:pt-4">
          <button
            type="button"
            onClick={visitStore}
            className="flex items-center justify-center gap-0.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-brand to-brand/75 px-3 py-2 text-[13px] font-bold text-brand-ink shadow-[0_6px_16px_-8px_rgb(var(--brand)/0.9)] transition-opacity hover:opacity-90 md:min-w-[7rem] md:flex-1 md:rounded-full md:bg-brand md:bg-none md:text-sm md:font-semibold md:shadow-none"
          >
            Visit Store
            <ChevronRight size={15} strokeWidth={2.5} className="-mr-1 md:hidden" aria-hidden />
          </button>
          <button
            type="button"
            onClick={openChatPanel}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-bg/50 px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover md:min-w-[7rem] md:flex-1 md:rounded-full md:bg-transparent md:py-2 md:text-sm"
          >
            <MessageCircle className="h-[13px] w-[13px] text-brand md:h-[15px] md:w-[15px] md:text-current" /> Chat
          </button>
        </div>
      </div>
    </div>
  );
});
