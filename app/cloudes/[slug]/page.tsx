import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Users } from 'lucide-react';
import { cloudes, getCloudeBySlug, slugify, type Cloude, type CloudeCategory } from '@/lib/cloudes-data';
import { sampleListings } from '@/lib/sample-listings';
import { ListingCard } from '@/components/listing-card';
import { Icon } from '@/components/icon';
import { CategoryShopGrid, type StaticShopCardItem } from '@/components/posted-shop-cards';
import { JobBoard } from '@/components/job-board';
import type { Job } from '@/lib/jobs';
import { JsonLd } from '@/components/json-ld';
import { api } from '@/lib/api';
import { nearParams } from '@/lib/user-location';
import { getUserLocation } from '@/lib/user-location-server';
import { FALLBACK_LISTING_IMAGE } from '@/lib/image-utils';
import { breadcrumbJsonLd, ogImageUrl, pageMetadata, type JsonLdNode } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';

type Props = { params: { slug: string }; searchParams: { category?: string } };

export function generateStaticParams() {
  return cloudes.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params, searchParams }: Props): Metadata {
  const cloude = getCloudeBySlug(params.slug);
  if (!cloude) return {};
  const category = searchParams.category
    ? cloude.categories.find((c) => c.slug === searchParams.category)
    : undefined;

  if (category) {
    return pageMetadata({
      title: `${category.name} Near You — ${cloude.name}`,
      description: `Find ${category.name} shops and service providers near you on DukanCloude. Browse verified local sellers, contact them directly, or list your own business free.`,
      path: `/cloudes/${cloude.slug}?category=${category.slug}`,
      image: ogImageUrl(`${category.name} Near You`, cloude.name),
    });
  }

  // Unknown ?category= values land here too, so they canonicalise to the Cloude page.
  return pageMetadata({
    title: `${cloude.name} — Local Shops, Services & Listings`,
    description: cloude.description,
    path: `/cloudes/${cloude.slug}`,
    ogSubtitle: cloude.description,
  });
}

type ListedItem = { name: string; path: string };

function shopListItem(shop: StaticShopCardItem): ListedItem {
  return { name: shop.shopName, path: `/listing/${shop.id}` };
}

// Breadcrumb trail plus, when real shops (or jobs) are listed, an ItemList linking to them.
function cloudeJsonLd(cloude: Cloude, category: CloudeCategory | undefined, items: ListedItem[]): JsonLdNode[] {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: cloude.name, path: `/cloudes/${cloude.slug}` },
  ];
  if (category) crumbs.push({ name: category.name, path: `/cloudes/${cloude.slug}?category=${category.slug}` });

  const nodes = [breadcrumbJsonLd(crumbs)];
  if (items.length > 0) {
    nodes.push({
      '@type': 'ItemList',
      name: category?.name ?? cloude.name,
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    });
  }
  return nodes;
}

export default async function CloudePage({ params, searchParams }: Props) {
  const cloude = getCloudeBySlug(params.slug);
  if (!cloude) notFound();

  const listings = sampleListings.filter((l) => l.cloudeSlug === cloude.slug);
  const otherCategories = cloude.groups
    ? cloude.categories.filter((cat) => !cloude.groups!.some((g) => g.items.some((i) => i.slug === cat.slug)))
    : [];

  const activeCategory = searchParams.category
    ? cloude.categories.find((c) => c.slug === searchParams.category)
    : undefined;

  if (cloude.sidebarBrowse) {
    // Jobs & Freelancing posts jobs straight into a category (no shops), so its
    // right-hand section lists job cards where every other Cloude lists shops.
    const isJobBoard = !!cloude.jobBoard;
    // Financing also carries job posts, listed under its shops instead of replacing them.
    const alsoJobs = !isJobBoard && !!cloude.jobPosts;
    // Only what's in the visitor's area (navbar location picker — their city, its
    // sub-areas and ~25 km around); everything when they haven't set one.
    const location = getUserLocation();
    const city = location?.city;
    const near = nearParams(location);
    const dbJobs =
      isJobBoard || alsoJobs
        ? await api.jobs
            .list({ cloudeSlug: cloude.slug, categorySlug: activeCategory?.slug, pageSize: 48, ...near })
            .catch(() => null)
        : null;
    const jobs: Job[] = dbJobs?.items ?? [];

    // Real, backend-saved listings — shared across every visitor regardless of
    // who posted them. Omitting categorySlug returns shops from every category.
    const dbListings = isJobBoard
      ? null
      : await api.listings
          .list({ cloudeSlug: cloude.slug, categorySlug: activeCategory?.slug, pageSize: activeCategory ? 24 : 48, ...near })
          .catch(() => null);

    const dbItems: StaticShopCardItem[] = (dbListings?.items ?? []).map((l: any) => ({
      id: l.id,
      shopName: l.shopName || l.title,
      categoryName: l.category?.name ?? activeCategory?.name ?? cloude.name,
      description: l.description ?? undefined,
      image: l.coverImageUrl || FALLBACK_LISTING_IMAGE,
      city: l.city ?? undefined,
      isNew: Date.now() - new Date(l.createdAt).getTime() < 24 * 60 * 60 * 1000,
    }));

    // Static demo listings — only shown as filler when nothing real exists yet, and never
    // once the visitor picked a location (they'd be shops from somewhere else).
    const staticItems: StaticShopCardItem[] = (city ? [] : listings)
      .filter((l) => !activeCategory || slugify(l.category) === activeCategory.slug)
      .map((l) => ({
        id: l.id,
        shopName: l.title,
        categoryName: l.category,
        image: l.image,
        city: l.city,
      }));

    const postAdHref = activeCategory
      ? `/post-ad?cloude=${cloude.slug}&category=${activeCategory.slug}`
      : `/post-ad?cloude=${cloude.slug}`;
    const postJobHref = `${postAdHref}${postAdHref.includes('?') ? '&' : '?'}post=job`;

    const jsonLdItems = isJobBoard
      ? jobs.map((j) => ({ name: j.title, path: `/jobs/${j.id}` }))
      : [...dbItems.map(shopListItem), ...jobs.map((j) => ({ name: j.title, path: `/jobs/${j.id}` }))];

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <JsonLd data={cloudeJsonLd(cloude, activeCategory, jsonLdItems)} />
        <nav className="mb-4 text-sm text-ink-muted">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-1.5">/</span>
          {activeCategory ? (
            <>
              <Link href={`/cloudes/${cloude.slug}`} className="hover:text-brand">{cloude.name}</Link>
              <span className="mx-1.5">/</span>
              <span className="text-ink">{activeCategory.name}</span>
            </>
          ) : (
            <span className="text-ink">{cloude.name}</span>
          )}
        </nav>

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon name={cloude.icon} size={26} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">{activeCategory ? activeCategory.name : cloude.name}</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {activeCategory ? `${isJobBoard ? 'Jobs' : 'Shops'} in ${activeCategory.name}` : cloude.description}
              </p>
            </div>
          </div>
          <Link
            href={postAdHref}
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-center text-sm font-semibold text-brand-ink hover:opacity-90"
          >
            {activeCategory
              ? `${isJobBoard ? 'Post a job' : 'Post your shop'} in ${activeCategory.name}`
              : `Post in ${cloude.name.replace(' Cloude', '')}`}
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start">
            <div className="shrink-0 bg-brand/15 px-4 py-3">
              <h2 className="text-sm font-semibold text-brand">Categories</h2>
            </div>
            <ul className="no-scrollbar flex flex-wrap gap-2 overflow-y-auto p-4 lg:min-h-0 lg:flex-col lg:flex-nowrap lg:gap-1.5">
              <li className="max-w-full shrink-0">
                <Link
                  href={`/cloudes/${cloude.slug}`}
                  className={`block rounded-lg border px-3 py-2 text-sm transition-colors lg:px-3 ${
                    !activeCategory
                      ? 'border-brand bg-brand-soft font-semibold text-brand'
                      : 'border-border bg-surface text-ink-muted hover:border-brand hover:text-brand lg:border-transparent lg:bg-transparent'
                  }`}
                >
                  {isJobBoard ? 'All Jobs' : 'All Shops'}
                </Link>
              </li>
              {cloude.categories.map((cat) => (
                <li key={cat.slug} className="max-w-full shrink-0 break-words">
                  <Link
                    href={`/cloudes/${cloude.slug}?category=${cat.slug}`}
                    className={`block rounded-lg border px-3 py-2 text-sm transition-colors lg:px-3 ${
                      activeCategory?.slug === cat.slug
                        ? 'border-brand bg-brand-soft font-semibold text-brand'
                        : 'border-border bg-surface text-ink-muted hover:border-brand hover:text-brand lg:border-transparent lg:bg-transparent'
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            {isJobBoard ? (
              <JobBoard
                key={activeCategory?.slug ?? 'all'}
                cloudeSlug={cloude.slug}
                categorySlug={activeCategory?.slug}
                categoryName={activeCategory?.name ?? cloude.name.replace(' Cloude', '')}
                initialJobs={jobs}
                initialTotal={dbJobs?.total ?? 0}
                postJobHref={postAdHref}
                near={near}
              />
            ) : (
              <>
                {city && (
                  <p className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
                    <MapPin size={14} className="shrink-0 text-brand" />
                    <span>
                      Showing shops in and around <span className="font-semibold text-ink">{city}</span> — change it from the
                      search bar.
                    </span>
                  </p>
                )}
                <CategoryShopGrid
                  cloudeSlug={cloude.slug}
                  categorySlug={activeCategory?.slug}
                  categoryName={activeCategory?.name ?? cloude.name}
                  staticItems={dbItems.length > 0 ? dbItems : staticItems}
                  postAdHref={postAdHref}
                />

                {/* Financing: vacancies posted by agencies in this sector, applied to
                    exactly as in the Jobs Cloude. */}
                {alsoJobs && (
                  <section className="mt-10 border-t border-border pt-8">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                          Jobs in {activeCategory?.name ?? cloude.name.replace(' Cloude', '')}
                        </h2>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          Vacancies posted by agencies, banks and CA firms here — apply with your resume and they'll schedule your interview.
                        </p>
                      </div>
                      <Link
                        href={postJobHref}
                        className="shrink-0 rounded-full border border-brand/40 bg-brand-soft px-4 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-ink"
                      >
                        Post a job
                      </Link>
                    </div>
                    <JobBoard
                      key={`jobs-${activeCategory?.slug ?? 'all'}`}
                      cloudeSlug={cloude.slug}
                      categorySlug={activeCategory?.slug}
                      categoryName={activeCategory?.name ?? cloude.name.replace(' Cloude', '')}
                      initialJobs={jobs}
                      initialTotal={dbJobs?.total ?? 0}
                      postJobHref={postJobHref}
                      near={near}
                    />
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeCategory) {
    // Real, backend-saved listings — the shared source every visitor sees,
    // regardless of who posted them or which browser they're in.
    const location = getUserLocation();
    const dbListings = await api.listings
      .list({ cloudeSlug: cloude.slug, categorySlug: activeCategory.slug, pageSize: 24, ...nearParams(location) })
      .catch(() => null);

    const dbItems: StaticShopCardItem[] = (dbListings?.items ?? []).map((l: any) => ({
      id: l.id,
      shopName: l.shopName || l.title,
      categoryName: activeCategory.name,
      description: l.description ?? undefined,
      image: l.coverImageUrl || FALLBACK_LISTING_IMAGE,
      city: l.city ?? undefined,
      isNew: Date.now() - new Date(l.createdAt).getTime() < 24 * 60 * 60 * 1000,
    }));

    // Static demo listings — only shown as filler when nothing real exists yet.
    const staticItems: StaticShopCardItem[] = listings
      .filter((l) => slugify(l.category) === activeCategory.slug)
      .map((l) => ({
        id: l.id,
        shopName: l.title,
        categoryName: activeCategory.name,
        image: l.image,
        city: l.city,
      }));
    const matchedGroup = cloude.groups?.find((g) => g.items.some((it) => it.slug === activeCategory.slug));
    const jsonLdItems = dbItems.map(shopListItem);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <JsonLd data={cloudeJsonLd(cloude, activeCategory, jsonLdItems)} />
        <nav className="mb-4 text-sm text-ink-muted">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/cloudes/${cloude.slug}`} className="hover:text-brand">{cloude.name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">{activeCategory.name}</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/cloudes/${cloude.slug}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand"
              aria-label={`Back to ${cloude.name}`}
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{cloude.name.replace(' Cloude', '')}</p>
              <h1 className="font-display text-2xl font-bold text-ink">{activeCategory.name}</h1>
            </div>
          </div>
          <Link
            href={`/post-ad?cloude=${cloude.slug}&category=${activeCategory.slug}`}
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-center text-sm font-semibold text-brand-ink hover:opacity-90"
          >
            Post your shop in {activeCategory.name}
          </Link>
        </div>

        <CategoryShopGrid
          cloudeSlug={cloude.slug}
          categorySlug={activeCategory.slug}
          categoryName={activeCategory.name}
          staticItems={dbItems.length > 0 ? dbItems : staticItems}
          postAdHref={`/post-ad?cloude=${cloude.slug}&category=${activeCategory.slug}`}
        />

        {matchedGroup && matchedGroup.items.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-5">
            <span className="text-sm font-semibold text-ink">More in {matchedGroup.title}:</span>
            {matchedGroup.items
              .filter((it) => it.slug !== activeCategory.slug)
              .map((it) => (
                <Link
                  key={it.slug}
                  href={`/cloudes/${cloude.slug}?category=${it.slug}`}
                  className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                >
                  {it.name}
                </Link>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={cloudeJsonLd(cloude, undefined, [])} />
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{cloude.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name={cloude.icon} size={26} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{cloude.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">{cloude.description}</p>
          </div>
        </div>
        <Link
          href={`/post-ad?cloude=${cloude.slug}`}
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-center text-sm font-semibold text-brand-ink hover:opacity-90"
        >
          Post in {cloude.name.replace(' Cloude', '')}
        </Link>
      </div>

      {/* Sub-tabs + seller indicator */}
      {cloude.subTabs && cloude.subTabs.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 animate-fade-in-up">
          <ul className="flex flex-wrap gap-2">
            {cloude.subTabs.map((tab) => (
              <li key={tab.slug}>
                <a
                  href={`#${tab.anchor ?? tab.slug}`}
                  className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                >
                  {tab.name}
                </a>
              </li>
            ))}
          </ul>
          {cloude.sellerCount && (
            <span className="flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-4 py-2 text-sm font-medium text-brand">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-brand" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <Users size={14} />
              {cloude.sellerCount} Sellers Reporting
            </span>
          )}
        </div>
      )}

      {/* Category groups — richer visual breakdown for this Cloude */}
      {cloude.groups && cloude.groups.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-display text-lg font-bold text-ink sm:text-xl">Browse by category</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cloude.groups.map((group, i) => (
              <div
                key={group.title}
                id={group.slug}
                className="animate-fade-in-up group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={`${group.image}?w=600&q=75&auto=format&fit=crop`}
                    alt={group.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                      <Icon name={group.icon} size={18} />
                    </span>
                    <h3 className="font-display text-sm font-bold leading-tight text-white drop-shadow-sm">{group.title}</h3>
                  </div>
                </div>
                {!(group.items.length === 1 && group.items[0].name === group.title) && (
                  <ul className="flex flex-1 flex-col gap-1.5 p-4">
                    {group.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/cloudes/${cloude.slug}?category=${item.slug}`}
                          className="flex items-start gap-2 text-sm text-ink-muted transition-colors hover:text-brand"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {group.items.length === 1 && group.items[0].name === group.title && (
                  <Link
                    href={`/cloudes/${cloude.slug}?category=${group.items[0].slug}`}
                    className="block flex-1 p-4 text-sm text-ink-muted transition-colors hover:text-brand"
                  >
                    Browse listings →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {otherCategories.length > 0 && (
            <div
              id="other-categories"
              className="animate-fade-in-up mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-5"
              style={{ animationDelay: `${cloude.groups.length * 90}ms` }}
            >
              <span className="text-sm font-semibold text-ink">Doesn't fit above?</span>
              {otherCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/cloudes/${cloude.slug}?category=${cat.slug}`}
                  className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!cloude.groups && (
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Category sidebar */}
          <aside>
            <h2 className="mb-3 text-sm font-semibold text-ink">All categories</h2>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
              {cloude.categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/cloudes/${cloude.slug}?category=${cat.slug}`}
                    className="block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-muted hover:border-brand hover:text-brand lg:border-0 lg:bg-transparent lg:px-2 lg:py-1.5"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Listings */}
          <div>
            {listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-ink-muted">
                No listings yet in this Cloude — be the first to{' '}
                <Link href={`/post-ad?cloude=${cloude.slug}`} className="font-medium text-brand hover:underline">
                  post an ad
                </Link>
                .
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
