'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationsMenu } from '@/components/notifications-menu';
import { LoadingRow } from '@/components/admin/shared';
import { OverviewSection, RangeSelect, type RangeDays } from '@/components/admin/overview-section';
import { UsersSection } from '@/components/admin/users-section';
import { SubscriptionsSection } from '@/components/admin/subscriptions-section';
import { ThemeSection } from '@/components/admin/theme-section';
import { UserDetailDrawer } from '@/components/admin/user-detail-drawer';
import { AnnouncementDialog } from '@/components/admin/announcement-dialog';
import { AdvertisementDialog } from '@/components/admin/advertisement-dialog';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'theme', label: 'Theme Settings', icon: Palette },
] as const;

type TabId = (typeof TABS)[number]['id'];

const QUICK_ACTIONS = [
  { id: 'announce', label: 'Send announcement', icon: Megaphone },
  { id: 'advertise', label: 'Post advertisement', icon: Sparkles },
  { id: 'users', label: 'Manage users', icon: Users },
  { id: 'subscriptions', label: 'Review subscriptions', icon: CreditCard },
  { id: 'theme', label: 'Change brand colour', icon: Palette },
] as const;

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Store size={19} />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-ink">DukanCloude</span>
    </span>
  );
}

function AdminPanel() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'overview';
  const userQuery = searchParams.get('q') ?? '';
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [days, setDays] = useState<RangeDays>(30);
  const [search, setSearch] = useState('');
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [advertOpen, setAdvertOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'ADMIN';

  // Keep the active tab visible in the phone tab strip.
  useEffect(() => {
    document.getElementById(`admin-tab-${tab}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [tab, isAdmin]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?next=/admin');
    else if (!isAdmin) router.replace('/');
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!quickOpen && !profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setQuickOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [quickOpen, profileOpen]);

  const goTo = useCallback(
    (id: string, q?: string) => {
      const params = new URLSearchParams();
      if (id !== 'overview') params.set('tab', id);
      if (q) params.set('q', q);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      window.scrollTo({ top: 0 });
    },
    [router, pathname],
  );

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    goTo('users', search.trim());
  }

  function quickAction(id: (typeof QUICK_ACTIONS)[number]['id']) {
    setQuickOpen(false);
    if (id === 'announce') setAnnounceOpen(true);
    else if (id === 'advertise') setAdvertOpen(true);
    else goTo(id);
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingRow label={loading || !user ? 'Checking your session…' : 'Redirecting…'} />
      </div>
    );
  }

  const menuClass =
    'animate-slide-down absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_20px_50px_-14px_rgb(0_0_0_/_0.35)]';
  const menuItemClass =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-hover';

  return (
    <div className="min-h-screen bg-bg lg:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Logo />
          <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">Admin</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTo(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all ${
                tab === t.id
                  ? 'bg-brand text-brand-ink shadow-sm'
                  : 'text-ink hover:bg-surface-hover'
              }`}
            >
              <t.icon size={18} className={tab === t.id ? '' : 'text-ink-muted'} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-1 p-3">
          <Link
            href="/"
            target="_blank"
            className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            <ExternalLink size={17} className="text-ink-muted" />
            <span className="flex-1">View Site</span>
            <ArrowUpRight size={16} className="text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut size={17} className="text-ink-muted" /> Log out
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-bg/60 p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ShieldCheck size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink">Admin Portal</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl lg:border-transparent">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/admin" className="shrink-0 lg:hidden" aria-label="Admin overview">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Store size={19} />
              </span>
            </Link>

            <form onSubmit={submitSearch} role="search" className="relative min-w-0 flex-1 md:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name, email, phone…"
                aria-label="Search users"
                className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand/60 focus:outline-none"
              />
            </form>

            {tab === 'overview' && (
              <div className="hidden md:block">
                <RangeSelect value={days} onChange={setDays} compact />
              </div>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="relative" ref={quickRef}>
                <button
                  type="button"
                  onClick={() => setQuickOpen((v) => !v)}
                  aria-expanded={quickOpen}
                  aria-label="Quick action"
                  className="flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 active:scale-[0.98] sm:px-4"
                >
                  <Plus size={16} strokeWidth={2.6} className={`transition-transform ${quickOpen ? 'rotate-45' : ''}`} />
                  <span className="hidden sm:inline">Quick Action</span>
                </button>
                {quickOpen && (
                  <div className={menuClass}>
                    {QUICK_ACTIONS.map((a) => (
                      <button key={a.id} type="button" onClick={() => quickAction(a.id)} className={menuItemClass}>
                        <a.icon size={16} className="text-brand" /> {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface [&_button[aria-label=Notifications]]:rounded-xl">
                <NotificationsMenu />
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-expanded={profileOpen}
                  aria-label="Account menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-ink ring-2 ring-transparent transition hover:ring-brand/30"
                >
                  <UserRound size={18} />
                </button>
                {profileOpen && (
                  <div className={menuClass}>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <Link href="/" target="_blank" className={menuItemClass}>
                      <ExternalLink size={16} className="text-ink-muted" /> View site
                    </Link>
                    <div className={`${menuItemClass} justify-between lg:hidden`}>
                      <span>Theme</span>
                      <ThemeToggle />
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${menuItemClass} hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
                    >
                      <LogOut size={16} className="text-ink-muted" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section tabs — phones and tablets */}
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2.5 lg:hidden" aria-label="Admin sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`admin-tab-${t.id}`}
                type="button"
                onClick={() => goTo(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  tab === t.id ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:bg-surface-hover'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-2">
          {tab === 'overview' && (
            <OverviewSection
              days={days}
              onDaysChange={setDays}
              onOpenUser={setOpenUserId}
              onNavigate={goTo}
              onAnnounce={() => setAnnounceOpen(true)}
              onAdvertise={() => setAdvertOpen(true)}
              refreshKey={refreshKey}
            />
          )}
          {tab === 'users' && (
            <UsersSection key={userQuery} initialQuery={userQuery} refreshKey={refreshKey} onOpenUser={setOpenUserId} />
          )}
          {tab === 'subscriptions' && <SubscriptionsSection onOpenUser={setOpenUserId} />}
          {tab === 'theme' && <ThemeSection />}
        </main>
      </div>

      <UserDetailDrawer userId={openUserId} onClose={() => setOpenUserId(null)} onChanged={() => setRefreshKey((k) => k + 1)} />
      <AnnouncementDialog open={announceOpen} onClose={() => setAnnounceOpen(false)} />
      <AdvertisementDialog open={advertOpen} onClose={() => setAdvertOpen(false)} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingRow />}>
      <AdminPanel />
    </Suspense>
  );
}
