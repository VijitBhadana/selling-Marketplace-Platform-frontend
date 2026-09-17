'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Cloud, Menu, Search, X, PlusCircle, ChevronRight, ShoppingBasket, LayoutGrid, LogOut, ChevronDown, Store, ShoppingBag, ShieldCheck } from 'lucide-react';
import { cloudes } from '@/lib/cloudes-data';
import { ThemeToggle } from './theme-toggle';
import { Icon } from './icon';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { AnimatedSearchPlaceholder } from './animated-search-placeholder';
import { MyShopsMenu } from './my-shops-menu';
import { SellerInboxMenu } from './seller-inbox-menu';
import { NotificationsMenu } from './notifications-menu';
import { Skeleton } from './skeleton';
import { startTopLoader } from './top-loader';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState('');
  const [mobileQuery, setMobileQuery] = useState('');
  const headerRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, requireAuth } = useAuth();
  const { count: bucketCount } = useCart();

  function handlePostAdClick(e: React.MouseEvent) {
    e.preventDefault();
    requireAuth(() => {
      startTopLoader('/post-ad');
      router.push('/post-ad');
    }, 'post-ad');
  }

  function handleLogout() {
    logout();
    setProfileOpen(false);
    startTopLoader('/');
    router.push('/');
  }

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
      className={`fixed inset-x-0 top-0 z-40 border-b bg-surface/80 backdrop-blur-lg transition-shadow ${
        scrolled ? 'border-border shadow-[0_1px_0_0_rgb(var(--border)),0_8px_24px_-16px_rgb(0_0_0_/_0.25)]' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-tight text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand/70 text-brand-ink shadow-[0_4px_14px_-4px_rgb(var(--brand)/0.6)] transition-transform group-hover:scale-105">
            <Cloud size={19} strokeWidth={2.4} />
          </span>
          <span className="hidden sm:inline">DukanCloude</span>
        </Link>

        {/* Search — desktop */}
        <form action="/search" className="mx-2 hidden flex-1 max-w-xl md:block">
          <div className="flex h-11 items-stretch overflow-hidden rounded-full border border-border bg-bg shadow-sm transition-all focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_2px_16px_-4px_rgb(var(--brand)/0.35)] focus-within:ring-4 focus-within:ring-brand/10">
            <span className="flex w-12 shrink-0 items-center justify-center bg-gradient-to-br from-brand to-brand/80 text-brand-ink">
              <Search size={18} strokeWidth={2.5} />
            </span>
            <div className="relative min-w-0 flex-1">
              <input
                name="q"
                type="search"
                value={desktopQuery}
                onChange={(e) => setDesktopQuery(e.target.value)}
                aria-label="Search products, services, jobs"
                className="h-full w-full bg-transparent px-4 text-sm text-ink focus:outline-none"
              />
              <AnimatedSearchPlaceholder hidden={desktopQuery.length > 0} className="left-4 right-4" />
            </div>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePostAdClick}
            aria-label="Post Your Ad"
            className="mr-2 hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand/80 px-4 py-2 text-sm font-semibold text-brand-ink shadow-[0_4px_14px_-4px_rgb(var(--brand)/0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgb(var(--brand)/0.65)] sm:flex md:mr-0 md:px-2.5 lg:mr-2 lg:px-4"
          >
            <PlusCircle size={16} /> <span className="md:hidden lg:inline">Post Your Ad</span>
          </button>
          {!loading && user?.role === 'SELLER' ? (
            <SellerInboxMenu />
          ) : (
            <Link
              href="/bucket-list"
              aria-label="Bucket list"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
            >
              <ShoppingBasket size={17} />
              {bucketCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-brand-ink">
                  {bucketCount > 99 ? '99+' : bucketCount}
                </span>
              )}
            </Link>
          )}
          {!loading && <MyShopsMenu />}

          {loading ? (
            // Session is read from localStorage after hydration — hold the spot so a
            // signed-in user doesn't see "Log in" flash before their profile button.
            <Skeleton className="hidden h-9 w-24 animate-pulse rounded-full sm:block" />
          ) : user ? (
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm font-medium text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                aria-expanded={profileOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-xs font-bold text-brand-ink">
                  {user.name?.charAt(0).toUpperCase() ?? 'U'}
                </span>
                <span className="max-w-[110px] truncate md:hidden lg:block">{user.name}</span>
                <ChevronDown size={14} className={`text-ink-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="animate-slide-down absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_-14px_rgb(0_0_0_/_0.35)]">
                  <div className="flex items-center gap-3 bg-gradient-to-br from-brand-soft/70 to-transparent px-4 py-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-base font-bold text-brand-ink shadow-[0_4px_12px_-3px_rgb(var(--brand)/0.5)]">
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
              className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand sm:block"
            >
              Log in
            </Link>
          )}

          {!loading && <NotificationsMenu />}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition-colors hover:bg-surface-hover md:hidden"
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
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-2.5 text-sm [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
          <Link
            href="/"
            className={`group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
              pathname === '/'
                ? 'border-brand bg-brand text-brand-ink shadow-[0_2px_8px_-2px_rgb(var(--brand)/0.5)]'
                : 'border-border bg-surface text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand'
            }`}
          >
            <LayoutGrid
              size={14}
              className={pathname === '/' ? 'text-brand-ink' : 'text-ink-muted/70 transition-colors group-hover:text-brand'}
            />
            All
          </Link>
          {cloudes.map((c) => {
            const active = pathname === `/cloudes/${c.slug}` || pathname?.startsWith(`/cloudes/${c.slug}/`);
            return (
              <Link
                key={c.slug}
                href={`/cloudes/${c.slug}`}
                className={`group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? 'border-brand bg-brand text-brand-ink shadow-[0_2px_8px_-2px_rgb(var(--brand)/0.5)]'
                    : 'border-border bg-surface text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand'
                }`}
              >
                <Icon
                  name={c.icon}
                  size={14}
                  className={active ? 'text-brand-ink' : 'text-ink-muted/70 transition-colors group-hover:text-brand'}
                />
                {c.name.replace(' Cloude', '')}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`grid overflow-hidden border-border transition-all duration-300 ease-out md:hidden ${
          open ? 'grid-rows-[1fr] border-t opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 px-4">
          <div className="animate-slide-down py-4">
            <form action="/search" className="mb-4">
              <div className="flex h-11 items-stretch overflow-hidden rounded-full border border-border bg-bg transition-all focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                <span className="flex w-12 shrink-0 items-center justify-center bg-gradient-to-br from-brand to-brand/80 text-brand-ink">
                  <Search size={18} strokeWidth={2.5} />
                </span>
                <div className="relative min-w-0 flex-1">
                  <input
                    name="q"
                    type="search"
                    value={mobileQuery}
                    onChange={(e) => setMobileQuery(e.target.value)}
                    aria-label="Search products, services, jobs"
                    className="h-full w-full bg-transparent px-4 text-sm text-ink focus:outline-none"
                  />
                  <AnimatedSearchPlaceholder hidden={mobileQuery.length > 0} className="left-4 right-4" />
                </div>
              </div>
            </form>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Link
                href="/"
                className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-border text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand'
                }`}
              >
                <LayoutGrid size={15} className={pathname === '/' ? 'text-brand' : 'text-ink-muted/70'} />
                <span className="flex-1 truncate">All</span>
                <ChevronRight size={14} className="shrink-0 opacity-50" />
              </Link>
              {cloudes.map((c) => {
                const active = pathname === `/cloudes/${c.slug}` || pathname?.startsWith(`/cloudes/${c.slug}/`);
                return (
                  <Link
                    key={c.slug}
                    href={`/cloudes/${c.slug}`}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-border text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand'
                    }`}
                  >
                    <Icon name={c.icon} size={15} className={active ? 'text-brand' : 'text-ink-muted/70'} />
                    <span className="flex-1 truncate">{c.name.replace(' Cloude', '')}</span>
                    <ChevronRight size={14} className="shrink-0 opacity-50" />
                  </Link>
                );
              })}
            </div>
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
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand/80 px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_4px_14px_-4px_rgb(var(--brand)/0.55)]"
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
