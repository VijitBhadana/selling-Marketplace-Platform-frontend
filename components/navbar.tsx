'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Cloud, Menu, Search, X, PlusCircle, Plus, ArrowRight, UserRound, ChevronRight, ShoppingBasket, LayoutGrid, LogOut, ChevronDown, Store, ShoppingBag, ShieldCheck } from 'lucide-react';
import { cloudes } from '@/lib/cloudes-data';
import { ThemeToggle } from './theme-toggle';
import { Icon } from './icon';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { AnimatedSearchPlaceholder } from './animated-search-placeholder';
import { LocationPicker } from './location-picker';
import { MyShopsMenu } from './my-shops-menu';
import { SellerInboxMenu } from './seller-inbox-menu';
import { NotificationsMenu } from './notifications-menu';
import { Skeleton } from './skeleton';
import { startTopLoader } from './top-loader';
import { navBadgeClass, navIconButtonClass } from './nav-icon-button';

// Per-cloude icon tint for the category chips (light + dark variants).
const cloudeIconColors: Record<string, string> = {
  shopping: 'text-sky-500 dark:text-sky-400',
  food: 'text-amber-500 dark:text-amber-400',
  skill: 'text-emerald-500 dark:text-emerald-400',
  software: 'text-blue-500 dark:text-blue-400',
  financing: 'text-violet-500 dark:text-violet-400',
  booking: 'text-pink-500 dark:text-pink-400',
  wedding: 'text-rose-500 dark:text-rose-400',
  property: 'text-teal-500 dark:text-teal-400',
  rent: 'text-yellow-500 dark:text-yellow-400',
  manufacturing: 'text-indigo-500 dark:text-indigo-400',
  education: 'text-orange-500 dark:text-orange-400',
  agriculture: 'text-lime-600 dark:text-lime-400',
  'clinic-doctors': 'text-red-500 dark:text-red-400',
  'sports-fitness-gym': 'text-cyan-500 dark:text-cyan-400',
};
const iconColor = (slug: string) => cloudeIconColors[slug] ?? 'text-brand';

const chipBase =
  'group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md';
const chipActive = 'border-brand bg-brand text-brand-ink shadow-[0_2px_8px_-2px_rgb(var(--brand)/calc(0.5*var(--glow)))]';
const chipIdle = 'border-border bg-surface text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand';

const isCloudeActive = (pathname: string | null, slug: string) =>
  pathname === `/cloudes/${slug}` || !!pathname?.startsWith(`/cloudes/${slug}/`);

// The pieces below are memoized and own their state, so typing in a search box
// re-renders only that box — not the whole header with its ~30 Cloude links —
// and a scroll / profile-menu toggle in Navbar doesn't re-render them either.

/** Desktop search: location, query, clear / "/" hint and submit. Press "/" anywhere to focus it. */
const DesktopSearch = memo(function DesktopSearch() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere (outside a text field) to jump to the desktop search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const input = inputRef.current;
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form action="/search" role="search" className="hidden max-w-2xl flex-1 md:block">
      <div className="group/search flex h-11 items-center gap-1 rounded-2xl border border-border bg-surface-hover/60 p-1 pl-1 transition-all duration-200 hover:border-ink-muted/30 focus-within:border-brand/60 focus-within:bg-surface focus-within:shadow-[0_0_0_1px_rgb(var(--brand)/0.08)]">
        <LocationPicker variant="desktop" />
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />
        <Search
          size={17}
          strokeWidth={2.4}
          className="shrink-0 text-ink-muted transition-colors group-focus-within/search:text-brand"
        />
        <div className="relative h-full min-w-0 flex-1">
          <input
            ref={inputRef}
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products, services, jobs"
            className="h-full w-full bg-transparent px-2.5 text-sm text-ink focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <AnimatedSearchPlaceholder hidden={query.length > 0} className="left-2.5 right-2.5" />
        </div>
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={15} />
          </button>
        ) : (
          <kbd
            className="hidden h-6 shrink-0 items-center rounded-md border border-border bg-surface px-1.5 font-sans text-[11px] font-semibold text-ink-muted lg:flex"
            title="Press / to search"
          >
            /
          </kbd>
        )}
        <button
          type="submit"
          aria-label="Search"
          className="flex h-full shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-semibold text-brand-ink shadow-sm transition-all hover:brightness-110 active:scale-[0.97] lg:px-4"
        >
          <span className="hidden lg:inline">Search</span>
          <ArrowRight size={16} strokeWidth={2.4} className="lg:hidden" />
        </button>
      </div>
    </form>
  );
});

const MobileSearch = memo(function MobileSearch() {
  const [query, setQuery] = useState('');
  return (
    <form action="/search" className="mb-4">
      <div className="flex h-11 items-stretch overflow-hidden rounded-full border border-border bg-bg transition-all focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <span className="flex w-12 shrink-0 items-center justify-center bg-gradient-to-br from-brand to-brand/80 text-brand-ink">
          <Search size={18} strokeWidth={2.5} />
        </span>
        <div className="relative min-w-0 flex-1">
          <input
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products, services, jobs"
            className="h-full w-full bg-transparent px-4 text-sm text-ink focus:outline-none"
          />
          <AnimatedSearchPlaceholder hidden={query.length > 0} className="left-4 right-4" />
        </div>
      </div>
    </form>
  );
});

/** Desktop row of Cloude chips under the search bar. */
const CloudeStrip = memo(function CloudeStrip({ pathname }: { pathname: string | null }) {
  return (
    <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-2.5 text-sm [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
      <Link href="/" className={`${chipBase} ${pathname === '/' ? chipActive : chipIdle}`}>
        <LayoutGrid
          size={14}
          className={pathname === '/' ? 'text-brand-ink' : 'text-ink-muted transition-colors group-hover:text-brand'}
        />
        All
      </Link>
      {cloudes.map((c) => {
        const active = isCloudeActive(pathname, c.slug);
        return (
          <Link key={c.slug} href={`/cloudes/${c.slug}`} className={`${chipBase} ${active ? chipActive : chipIdle}`}>
            <Icon
              name={c.icon}
              size={14}
              className={active ? 'text-brand-ink' : `${iconColor(c.slug)} transition-transform group-hover:scale-110`}
            />
            {c.name.replace(' Cloude', '')}
          </Link>
        );
      })}
    </div>
  );
});

const mobileTile = 'flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors';
const mobileTileActive = 'border-brand bg-brand-soft text-brand';
const mobileTileIdle = 'border-border text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand';

/** Two-column Cloude grid in the mobile menu. */
const MobileCloudeGrid = memo(function MobileCloudeGrid({ pathname }: { pathname: string | null }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <Link href="/" className={`${mobileTile} ${pathname === '/' ? mobileTileActive : mobileTileIdle}`}>
        <LayoutGrid size={15} className={pathname === '/' ? 'text-brand' : 'text-ink-muted/70'} />
        <span className="flex-1 truncate">All</span>
        <ChevronRight size={14} className="shrink-0 opacity-50" />
      </Link>
      {cloudes.map((c) => (
        <Link
          key={c.slug}
          href={`/cloudes/${c.slug}`}
          className={`${mobileTile} ${isCloudeActive(pathname, c.slug) ? mobileTileActive : mobileTileIdle}`}
        >
          <Icon name={c.icon} size={15} className={iconColor(c.slug)} />
          <span className="flex-1 truncate">{c.name.replace(' Cloude', '')}</span>
          <ChevronRight size={14} className="shrink-0 opacity-50" />
        </Link>
      ))}
    </div>
  );
});

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, requireAuth } = useAuth();
  const { count: bucketCount } = useCart();

  const handlePostAdClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      requireAuth(() => {
        startTopLoader('/post-ad');
        router.push('/post-ad');
      }, 'post-ad');
    },
    [requireAuth, router],
  );

  const handleLogout = useCallback(() => {
    logout();
    setProfileOpen(false);
    startTopLoader('/');
    router.push('/');
  }, [logout, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => setHeaderHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
      className={`fixed inset-x-0 top-0 z-40 border-b bg-surface/75 backdrop-blur-xl backdrop-saturate-150 transition-shadow ${
        scrolled ? 'border-border shadow-[0_1px_0_0_rgb(var(--border)),0_8px_24px_-16px_rgb(0_0_0_/_0.25)]' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 md:gap-3 lg:gap-5">
        <div className="flex min-w-0 items-center gap-2 md:shrink-0 md:gap-2.5">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="DukanCloude home">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand via-brand to-brand/60 text-brand-ink shadow-[0_6px_20px_-6px_rgb(var(--brand)/calc(0.7*var(--glow)))] ring-1 ring-inset ring-white/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 md:h-10 md:w-10 md:rounded-2xl">
              <Cloud size={20} strokeWidth={2.4} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" aria-hidden />
            </span>
            <span className="hidden flex-col leading-none md:flex">
              <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                Dukan<span className="bg-gradient-to-r from-brand to-brand/70 bg-clip-text text-transparent">Cloude</span>
              </span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted lg:block">
                Local marketplace
              </span>
            </span>
          </Link>

          {/* Phones: name + BETA, with the location picker under it (desktop has it in the search bar). */}
          <div className="flex min-w-0 flex-col md:hidden">
            <Link href="/" tabIndex={-1} aria-hidden className="flex min-w-0 items-center gap-1.5 leading-none">
              <span className="truncate font-display text-base font-extrabold tracking-tight text-ink">
                Dukan<span className="bg-gradient-to-r from-brand to-brand/70 bg-clip-text text-transparent">Cloude</span>
              </span>
              <span className="shrink-0 rounded-md border border-brand/40 bg-brand-soft px-1 py-0.5 text-[8px] font-bold tracking-[0.12em] text-brand max-[359px]:hidden">
                BETA
              </span>
            </Link>
            <LocationPicker variant="header" />
          </div>
        </div>

        {/* Search — desktop */}
        <DesktopSearch />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2 lg:gap-3">
          <button
            type="button"
            onClick={handlePostAdClick}
            aria-label="Post Your Ad"
            className="group/post relative hidden h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand to-brand/75 px-2.5 text-sm font-semibold text-brand-ink shadow-[0_1px_2px_rgb(0_0_0_/_0.15)] ring-1 ring-inset ring-white/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgb(0_0_0_/_0.18)] active:translate-y-0 sm:flex sm:px-3 md:px-2.5 lg:px-4"
          >
            <span
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover/post:left-[120%] group-hover/post:opacity-100"
              aria-hidden
            />
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20">
              <Plus size={14} strokeWidth={3} />
            </span>
            <span className="md:hidden lg:inline">Post Your Ad</span>
          </button>

          {/* Grouped toolbar — deliberately not positioned, so the menus' mobile dropdowns still anchor to the header */}
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface/70 p-1 shadow-sm">
            {!loading && user?.role === 'SELLER' ? (
              <SellerInboxMenu />
            ) : (
              <Link
                href="/bucket-list"
                aria-label="Bucket list"
                title="Bucket list"
                className={navIconButtonClass(pathname === '/bucket-list')}
              >
                <ShoppingBasket size={17} />
                {bucketCount > 0 && (
                  <span className={`${navBadgeClass} bg-brand text-brand-ink`}>{bucketCount > 99 ? '99+' : bucketCount}</span>
                )}
              </Link>
            )}
            {!loading && <MyShopsMenu />}
            {!loading && <NotificationsMenu />}
            <ThemeToggle bare />
          </div>

          {loading ? (
            // Session is read from localStorage after hydration — hold the spot so a
            // signed-in user doesn't see "Log in" flash before their profile button.
            <Skeleton className="hidden h-10 w-24 animate-pulse rounded-full sm:block" />
          ) : user ? (
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className={`flex h-10 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-sm font-medium transition-all ${
                  profileOpen
                    ? 'border-brand/60 bg-brand-soft text-brand'
                    : 'border-border bg-surface/70 text-ink hover:border-ink-muted/30 hover:bg-surface-hover'
                }`}
                aria-expanded={profileOpen}
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-xs font-bold text-brand-ink">
                  {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" aria-hidden />
                </span>
                <span className="max-w-[110px] truncate md:hidden lg:block">{user.name}</span>
                <ChevronDown size={14} className={`text-ink-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="animate-slide-down absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_-14px_rgb(0_0_0_/_0.35)]">
                  <div className="flex items-center gap-3 bg-gradient-to-br from-brand-soft/70 to-transparent px-4 py-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-base font-bold text-brand-ink shadow-[0_4px_12px_-3px_rgb(var(--brand)/calc(0.5*var(--glow)))]">
                      {user.name?.charAt(0).toUpperCase() ?? 'U'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    </div>
                  </div>

                  <div className="px-4 pb-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        user.role === 'BUYER' ? 'bg-accent-soft text-accent' : 'bg-brand-soft text-brand'
                      }`}
                    >
                      {user.role === 'ADMIN' ? <ShieldCheck size={11} /> : user.role === 'SELLER' ? <Store size={11} /> : <ShoppingBag size={11} />}
                      {user.role === 'ADMIN' ? 'Admin account' : user.role === 'SELLER' ? 'Seller account' : 'Buyer account'}
                    </span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="p-1.5">
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-brand-soft hover:text-brand"
                      >
                        <ShieldCheck size={16} /> Admin panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-accent-soft hover:text-accent"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center gap-2 rounded-full border border-border bg-surface/70 pl-1 pr-4 text-sm font-semibold text-ink transition-all hover:border-brand/60 hover:bg-brand-soft hover:text-brand sm:flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-ink-muted">
                <UserRound size={16} />
              </span>
              Log in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/70 text-ink transition-colors hover:bg-surface-hover md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="relative flex h-[18px] w-[18px] items-center justify-center">
              <Menu size={18} className={`absolute transition-all duration-200 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
              <X size={18} className={`absolute transition-all duration-200 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Cloude strip — desktop */}
      <nav className="relative hidden border-t border-border/70 md:block">
        <CloudeStrip pathname={pathname} />
      </nav>

      {/* Mobile menu */}
      <div
        className={`grid overflow-hidden border-border transition-all duration-300 ease-out md:hidden ${
          open ? 'grid-rows-[1fr] border-t opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 px-4">
          <div className="animate-slide-down py-4">
            <LocationPicker variant="mobile" />
            <MobileSearch />
            <MobileCloudeGrid pathname={pathname} />
            {!loading && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="mb-3 flex items-center justify-center gap-1.5 rounded-full border border-brand bg-brand-soft px-4 py-2.5 text-sm font-semibold text-brand"
              >
                <ShieldCheck size={15} /> Admin panel
              </Link>
            )}
            <div className="flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={handlePostAdClick}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand/80 px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_4px_14px_-4px_rgb(var(--brand)/calc(0.55*var(--glow)))]"
              >
                <PlusCircle size={16} /> Post Your Ad
              </button>
              {!loading && user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-hover"
                >
                  <LogOut size={15} /> Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex flex-1 items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-hover"
                >
                  Log in
                </Link>
              )}
            </div>
            {!loading && user && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-sm font-bold text-brand-ink">
                  {user.name?.charAt(0).toUpperCase() ?? 'U'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <div style={{ height: headerHeight }} aria-hidden />
    </>
  );
}
