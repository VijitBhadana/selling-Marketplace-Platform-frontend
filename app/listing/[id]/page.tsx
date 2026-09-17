import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cache } from 'react';
import { Heart, MapPin, Clock, ShieldAlert } from 'lucide-react';
import { sampleListings } from '@/lib/sample-listings';
import { getCloudeBySlug, type Cloude } from '@/lib/cloudes-data';
import { SellerContactActions } from '@/components/seller-contact-actions';
import { PostedListingDetail } from '@/components/posted-listing-detail';
import { ShopDetailHeader } from '@/components/shop-detail-header';
import { ShopProductsSection } from '@/components/shop-products-section';
import { ShopOrdersSection } from '@/components/shop-orders-section';
import { FinanceApplicationsSection } from '@/components/finance-applications-section';
import { JsonLd } from '@/components/json-ld';
import { FALLBACK_LISTING_IMAGE } from '@/lib/image-utils';
import { breadcrumbJsonLd, isPublicImageUrl, pageMetadata, type JsonLdNode } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { api } from '@/lib/api';

type Props = { params: { id: string } };

// generateMetadata and the page component both need the same listing —
// React's cache() dedupes them into a single backend call per request.
const getDbListing = cache((id: string) => api.listings.byId(id).catch(() => null));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = sampleListings.find((l) => l.id === params.id);
  if (listing) {
    return pageMetadata({
      title: listing.title,
      description: `${listing.title} — ${listing.price} in ${listing.city}. Listed on DukanCloude.`,
      path: `/listing/${listing.id}`,
      image: `${listing.image}?w=1200&h=630&q=80&auto=format&fit=crop`,
      // Placeholder demo content — keep it out of search results.
      noindex: true,
    });
  }

  const dbListing = await getDbListing(params.id);
  if (dbListing) {
    const name = dbListing.shopName || dbListing.title;
    const place = dbListing.city ? ` in ${dbListing.city}` : '';
    const category: string | undefined = dbListing.category?.name;
    // Short category names ("Home Tutors") are worth having in the title; the
    // long descriptive ones would push the shop name out of the snippet.
    const titleCategory = category && category.length <= 30 ? ` — ${category}` : '';

    return pageMetadata({
      title: `${name}${titleCategory}${place}`,
      description:
        dbListing.description ||
        `${name}${category ? `, ${category}` : ''}${place} on DukanCloude. See products and prices, and contact the seller directly.`,
      path: `/listing/${dbListing.id}`,
      image: isPublicImageUrl(dbListing.coverImageUrl) ? dbListing.coverImageUrl : undefined,
      ogSubtitle: [category, dbListing.city].filter(Boolean).join(' · '),
    });
  }

  // Local-only ad posted in this browser, or a dead link — nothing for crawlers.
  return { robots: { index: false, follow: false } };
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = sampleListings.find((l) => l.id === params.id);
  if (listing) {
    const cloude = getCloudeBySlug(listing.cloudeSlug);

    return (
      <div className="mx-auto max-w-6xl px-4 py-8 font-opensans sm:px-6">
        <nav className="mb-4 text-sm text-ink-muted">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-1.5">/</span>
          {cloude && (
            <>
              <Link href={`/cloudes/${cloude.slug}`} className="hover:text-brand">{cloude.name}</Link>
              <span className="mx-1.5">/</span>
            </>
          )}
          <span className="text-ink">{listing.title}</span>
        </nav>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="relative aspect-video max-h-[300px] w-full bg-brand-soft">
            <Image
              src={`${listing.image}?w=1200&q=80&auto=format&fit=crop`}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
              className="object-cover"
            />
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">{listing.title}</h1>
                <button
                  type="button"
                  aria-label="Save to wishlist"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted hover:border-accent hover:text-accent"
                >
                  <Heart size={18} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                <span className="flex items-center gap-1"><MapPin size={14} /> {listing.city}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {listing.postedAgo}</span>
                {cloude && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">{listing.category}</span>}
              </div>

              <p className="mt-2 text-2xl font-extrabold text-brand">{listing.price}</p>

              <div className="mt-6 rounded-2xl border border-border bg-surface-hover p-6">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</h2>
                <p className="text-sm leading-relaxed text-ink-muted">
                  This is placeholder listing content rendered from sample data. Once connected to the
                  backend, the full seller-provided description and category-specific attributes
                  (e.g. brand, condition, experience, availability) will appear here.
                </p>
              </div>
            </div>

            {/* Seller card */}
            <aside className="h-fit rounded-2xl border border-border bg-surface-hover p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Seller</h2>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-brand-ink">
                  S
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">Sample Seller</p>
                  <p className="text-xs text-ink-muted">Member since 2024 · {listing.city}</p>
                </div>
              </div>

              <SellerContactActions />

              <div className="mt-4 border-t border-border pt-4">
                <button className="flex w-full items-center justify-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-accent">
                  <ShieldAlert size={13} /> Report this seller
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // Not in the static demo data — this is either a real ad saved to the backend
  // (visible to every visitor) or, if the backend can't find it either, a
  // local-only demo ad posted in this same browser while offline.
  const dbListing = await getDbListing(params.id);
  if (dbListing) return <DbListingDetail listing={dbListing} />;

  return <PostedListingDetail id={params.id} />;
}

function DbListingDetail({ listing }: { listing: any }) {
  const cloude = getCloudeBySlug(listing.cloude?.slug);
  const image = listing.coverImageUrl || FALLBACK_LISTING_IMAGE;
  const priceLabel = listing.priceType === 'CONTACT_FOR_PRICE' ? 'Contact for price' : `₹${listing.price}`;
  const postedAgo = new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const sellerName = listing.shopName || listing.seller?.name || 'DukanCloude Seller';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-opensans sm:px-6">
      <JsonLd data={listingJsonLd(listing, cloude, image)} />
      <ShopDetailHeader
        listing={listing}
        cloude={cloude}
        image={image}
        priceLabel={priceLabel}
        postedAgo={postedAgo}
        sellerName={sellerName}
      />

      <ShopProductsSection listingId={listing.id} sellerId={listing.sellerId} initialProducts={listing.products ?? []}
        cloudeSlug={listing.cloude?.slug}
        categorySlug={listing.category?.slug}
        shopName={sellerName}
      />
      {/* Financing Cloude: everyone who applied for one of this agency's schemes (agency only). */}
      {listing.cloude?.slug === 'financing' && (
        <FinanceApplicationsSection listingId={listing.id} sellerId={listing.sellerId} shopName={sellerName} />
      )}
      <ShopOrdersSection listingId={listing.id} sellerId={listing.sellerId} />
    </div>
  );
}

// Breadcrumb trail + the shop as a LocalBusiness, with its products/services as offers.
function listingJsonLd(listing: any, cloude: Cloude | undefined, image: string): JsonLdNode[] {
  const path = `/listing/${listing.id}`;
  const url = absoluteUrl(path);
  const name: string = listing.shopName || listing.title;

  const crumbs = [{ name: 'Home', path: '/' }];
  if (cloude) {
    crumbs.push({ name: cloude.name, path: `/cloudes/${cloude.slug}` });
    if (listing.category?.slug) {
      crumbs.push({ name: listing.category.name, path: `/cloudes/${cloude.slug}?category=${listing.category.slug}` });
    }
  }
  crumbs.push({ name, path });

  const products: any[] = listing.products ?? [];
  const business: JsonLdNode = {
    '@type': 'LocalBusiness',
    '@id': `${url}#business`,
    name,
    url,
    description: listing.description || undefined,
    image: isPublicImageUrl(image) ? image : undefined,
    address:
      listing.city || listing.pincode
        ? { '@type': 'PostalAddress', addressLocality: listing.city || undefined, postalCode: listing.pincode || undefined, addressCountry: 'IN' }
        : undefined,
    geo:
      listing.latitude != null && listing.longitude != null
        ? { '@type': 'GeoCoordinates', latitude: listing.latitude, longitude: listing.longitude }
        : undefined,
    makesOffer: products.length
      ? products.slice(0, 50).map((p) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': p.isService ? 'Service' : 'Product',
            name: p.name,
            description: p.description || undefined,
            image: isPublicImageUrl(p.imageUrl) ? p.imageUrl : undefined,
          },
          ...(p.price != null && p.priceType !== 'CONTACT_FOR_PRICE' ? { price: String(p.price), priceCurrency: 'INR' } : {}),
        }))
      : undefined,
  };

  return [breadcrumbJsonLd(crumbs), business];
}
