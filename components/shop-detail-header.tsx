'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Heart, MapPin, ShieldAlert, Store, Tag, LayoutGrid, CalendarDays, Lock, ChevronRight, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { withImageParams } from '@/lib/image-utils';
import { SmartImage } from '@/components/smart-image';
import { SellerContactActions } from '@/components/seller-contact-actions';

const STATUS_BADGE: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: 'Live', dot: 'bg-emerald-400' },
  DRAFT: { label: 'Draft', dot: 'bg-amber-400' },
  BOOKED: { label: 'Booked', dot: 'bg-brand' },
  SOLD: { label: 'Sold', dot: 'bg-zinc-400' },
  EXPIRED: { label: 'Expired', dot: 'bg-zinc-400' },
  REMOVED: { label: 'Removed', dot: 'bg-red-400' },
};

export function ShopDetailHeader({
  listing,
  cloude,
  image,
  priceLabel,
  postedAgo,
  sellerName,
}: {
  listing: any;
  cloude: { slug: string; name: string } | undefined;
  image: string;
  priceLabel: string;
  postedAgo: string;
  sellerName: string;
}) {
  const { user } = useAuth();
  const isOwner = user?.id === listing.sellerId;

  // Buyers land straight on the product catalog — this listing/seller
  // block is only useful to the seller managing their own shop.
  if (!isOwner) return null;

  const shopName: string = listing.shopName || listing.title;
  const initial = shopName.trim().charAt(0).toUpperCase() || 'S';
  const status = STATUS_BADGE[listing.status];
  const location = [listing.city, listing.pincode].filter(Boolean).join(' · ');
  const memberSince = listing.seller?.createdAt
    ? new Date(listing.seller.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand">Home</Link>
        <ChevronRight size={14} className="opacity-60" />
        {cloude && (
          <>
            <Link href={`/cloudes/${cloude.slug}`} className="hover:text-brand">{cloude.name}</Link>
            <ChevronRight size={14} className="opacity-60" />
          </>
        )}
        <span className="min-w-0 max-w-full truncate text-ink">{shopName}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
        {/* Cover */}
        <div className="relative h-48 w-full bg-brand-soft sm:h-64 lg:h-72">
          <SmartImage
            src={withImageParams(image, 'w=1600&q=80&auto=format&fit=crop')}
            alt={shopName}
            sizes="(min-width: 1152px) 1152px, 100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/30" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
            {status && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.label}
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
              <Lock size={11} /> Owner view
            </span>
          </div>

          <button
            type="button"
            aria-label="Save to wishlist"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/60 hover:text-accent sm:right-6 sm:top-6"
          >
            <Heart size={18} />
          </button>
        </div>

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          {/* Shop avatar overlapping the cover */}
          <span className="relative -mt-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-3xl font-extrabold text-brand-ink shadow-card ring-4 ring-surface sm:-mt-12 sm:h-24 sm:w-24 sm:text-4xl">
            {initial}
          </span>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
            <div className="flex min-w-0 flex-col">
              {cloude && (
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
                  <Store size={13} /> {cloude.name}
                </p>
              )}
              <h1 className="mt-1 break-words text-2xl font-bold leading-tight text-ink sm:text-3xl">{shopName}</h1>
              {listing.shopName && listing.title && listing.title !== listing.shopName && (
                <p className="mt-1.5 text-base text-ink-muted">{listing.title}</p>
              )}

              {/* Quick facts */}
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <Fact icon={Tag} label="Price" value={priceLabel} highlight />
                <Fact icon={MapPin} label="Location" value={location || '—'} />
                <Fact icon={LayoutGrid} label="Category" value={listing.category?.name || '—'} />
                <Fact icon={CalendarDays} label="Listed on" value={postedAgo} />
              </dl>

              {/* Grows so both columns end on the same line next to the seller card. */}
              <div className="mt-5 flex-1 rounded-2xl border border-border bg-surface-hover/60 p-5">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">About this shop</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink/85">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Seller card */}
            {/* Stretches to the left column's height; report link sits at the bottom. */}
            <aside className="flex flex-col rounded-2xl border border-border bg-surface-hover/60 p-5 sm:p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Seller</h2>
              <div className="flex items-center gap-3.5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-ink ring-2 ring-brand/30 ring-offset-2 ring-offset-surface-hover">
                  {sellerName.trim().charAt(0).toUpperCase() || 'S'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink">{sellerName}</p>
                  <p className="text-xs text-ink-muted">Posted {postedAgo}</p>
                </div>
              </div>

              <dl className="mt-5 space-y-3 rounded-xl border border-border bg-surface/60 p-4 text-sm">
                {listing.seller?.name && <SellerRow icon={User} label="Owner" value={listing.seller.name} />}
                {listing.city && <SellerRow icon={MapPin} label="Based in" value={listing.city} />}
                {memberSince && <SellerRow icon={CalendarDays} label="Member since" value={memberSince} />}
              </dl>

              <SellerContactActions />

              <div className="mt-auto pt-5">
                <div className="border-t border-border pt-4">
                  <button className="flex w-full items-center justify-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-accent">
                    <ShieldAlert size={13} /> Report this seller
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function SellerRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-ink-muted">
        <Icon size={14} /> {label}
      </dt>
      <dd className="truncate font-medium text-ink">{value}</dd>
    </div>
  );
}

function Fact({ icon: Icon, label, value, highlight }: { icon: LucideIcon; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-border bg-surface-hover/60 p-3 min-[440px]:flex-row min-[440px]:items-center min-[440px]:gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
        <dd className={`break-words text-sm font-semibold leading-snug ${highlight ? 'text-brand' : 'text-ink'}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}
