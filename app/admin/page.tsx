'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Cloud, CreditCard, ExternalLink, LayoutDashboard, LogOut, Palette, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingRow } from '@/components/admin/shared';
import { OverviewSection } from '@/components/admin/overview-section';
import { UsersSection } from '@/components/admin/users-section';
import { SubscriptionsSection } from '@/components/admin/subscriptions-section';
import { ThemeSection } from '@/components/admin/theme-section';
import { UserDetailDrawer } from '@/components/admin/user-detail-drawer';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'theme', label: 'Theme', icon: Palette },
] as const;

type TabId = (typeof TABS)[number]['id'];

function AdminPanel() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'overview';
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const goTo = useCallback(
    (id: string) => {
      router.push(id === 'overview' ? pathname : `${pathname}?tab=${id}`, { scroll: false });
      window.scrollTo({ top: 0 });
    },
    [router, pathname],
  );

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

  return (
    <div className="min-h-screen bg-bg lg:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-ink">
            <Cloud size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-ink">DukanCloude</p>
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
              <ShieldCheck size={11} /> Admin
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTo(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
              }`}
            >
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <ExternalLink size={16} /> View site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <LogOut size={16} /> Log out
          </button>
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="min-w-0 truncate text-xs text-ink-muted">{user.email}</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar + tabs — phones and tablets */}
        <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-ink">
              <Cloud size={16} />
            </span>
            <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-ink">
              DukanCloude <span className="text-brand">Admin</span>
            </p>
            <ThemeToggle />
            <Link
              href="/"
              target="_blank"
              aria-label="View site"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted hover:text-ink"
            >
              <ExternalLink size={15} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted hover:text-accent"
            >
              <LogOut size={15} />
            </button>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`admin-tab-${t.id}`}
                type="button"
                onClick={() => goTo(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  tab === t.id ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:bg-surface-hover'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {tab === 'overview' && <OverviewSection onOpenUser={setOpenUserId} onNavigate={goTo} />}
          {tab === 'users' && <UsersSection refreshKey={refreshKey} onOpenUser={setOpenUserId} />}
          {tab === 'subscriptions' && <SubscriptionsSection onOpenUser={setOpenUserId} />}
          {tab === 'theme' && <ThemeSection />}
        </main>
      </div>

      <UserDetailDrawer userId={openUserId} onClose={() => setOpenUserId(null)} onChanged={() => setRefreshKey((k) => k + 1)} />
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
