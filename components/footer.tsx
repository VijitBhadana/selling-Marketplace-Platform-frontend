import Link from 'next/link';
import { Cloud, ArrowUp, ArrowRight } from 'lucide-react';
import { cloudes } from '@/lib/cloudes-data';
import { LEGAL_LINKS } from '@/lib/legal';
import { Icon } from './icon';

export function Footer() {
  const columns = [cloudes.slice(0, 5), cloudes.slice(5, 9), cloudes.slice(9, 13)];

  const company = [
    { name: 'About DukanCloude', href: '/about', icon: 'Info' },
    { name: 'Find a job', href: '/jobs', icon: 'Briefcase' },
    { name: 'Search listings', href: '/search', icon: 'Search' },
    { name: 'Wishlist', href: '/wishlist', icon: 'Heart' },
    { name: 'Log in', href: '/login', icon: 'LogIn' },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      {/* CTA strip */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="relative isolate flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand/90 p-6 text-brand-ink shadow-[0_4px_14px_-8px_rgb(var(--brand)/calc(0.35*var(--glow)))] sm:flex-row sm:items-center sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl"
          />
          <div className="relative">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Got something to sell or offer?</h2>
            <p className="mt-1 text-sm text-brand-ink/85">
              Post your product, service or job free across all 13 Cloudes — reach buyers in minutes.
            </p>
          </div>
          <Link
            href="/post-ad"
            className="group relative flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Post Your Ad
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand/70 text-brand-ink shadow-[0_4px_14px_-4px_rgb(var(--brand)/calc(0.6*var(--glow)))]">
                <Cloud size={17} strokeWidth={2.4} />
              </span>
              DukanCloude
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
              One platform, every kind of business — products, services, jobs and bookings across 13 Cloudes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['13 Cloudes', 'Free to post', 'Verified sellers'].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-border bg-bg px-3 py-1 text-xs font-medium text-ink-muted"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Cloude columns */}
          {columns.map((col, i) => (
            <div key={i} className="lg:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted/80">
                {i === 0 ? 'Popular Cloudes' : i === 1 ? 'More Cloudes' : 'Specialized'}
              </h3>
              <ul className="space-y-2.5">
                {col.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/cloudes/${c.slug}`}
                      className="group flex items-start gap-2 text-sm text-ink-muted transition-colors hover:text-brand"
                    >
                      <Icon
                        name={c.icon}
                        size={14}
                        className="mt-0.5 shrink-0 text-ink-muted/60 transition-colors group-hover:text-brand"
                      />
                      <span>{c.name.replace(' Cloude', '')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Company */}
          <div className="lg:col-span-3">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted/80">Quick links</h3>
            <ul className="space-y-2.5">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-start gap-2 text-sm text-ink-muted transition-colors hover:text-brand"
                  >
                    <Icon
                      name={item.icon}
                      size={14}
                      className="mt-0.5 shrink-0 text-ink-muted/60 transition-colors group-hover:text-brand"
                    />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-ink-muted xl:flex-row">
          <p className="shrink-0">© {new Date().getFullYear()} DukanCloude. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 xl:justify-end">
            <Link href="/about" className="transition-colors hover:text-brand">About</Link>
            <Link href="/jobs" className="transition-colors hover:text-brand">Jobs</Link>
            <Link href="/post-ad" className="transition-colors hover:text-brand">Sell on DukanCloude</Link>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-brand">
                {link.label}
              </Link>
            ))}
            <a
              href="#"
              aria-label="Back to top"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
            >
              <ArrowUp size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
