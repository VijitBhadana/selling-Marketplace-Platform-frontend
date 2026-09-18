import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, MapPin, Zap, ArrowRight, Check, Rocket } from 'lucide-react';
import { cloudes } from '@/lib/cloudes-data';
import { api, type FreshItem } from '@/lib/api';
import { CloudeCard } from '@/components/cloude-card';
import { LiveShopCard } from '@/components/live-shop-card';
import { FreshJobCard } from '@/components/fresh-job-card';
import { ViewAllCloudes } from '@/components/view-all-cloudes';
import { nearParams } from '@/lib/user-location';
import { getUserLocation } from '@/lib/user-location-server';
import { HeroTwoColumn } from '@/components/hero-two-column';
import { ScrollReveal } from '@/components/scroll-reveal';

// Title, description and OG card come from the root layout defaults; only the
// canonical is page-specific.
export const metadata: Metadata = { alternates: { canonical: '/' } };

const totalCategories = cloudes.reduce((sum, c) => sum + c.categories.length, 0);

const comparisonRows: { label: string; dukancloude: string; olx: string; facebook: string; highlight?: boolean }[] = [
  { label: 'Time to post an ad', dukancloude: '2 Minutes', olx: '5–10 mins', facebook: '5–10 mins' },
  { label: 'Cost to post', dukancloude: 'Free', olx: 'Free', facebook: 'Free', highlight: true },
  { label: 'Seller verification', dukancloude: 'OTP-Verified', olx: 'Basic', facebook: 'None' },
  { label: 'Products + services', dukancloude: 'Yes, one platform', olx: 'Products only', facebook: 'Products only' },
  { label: 'Organised categories', dukancloude: `${cloudes.length} Cloudes, ${totalCategories}+ categories`, olx: 'Broad, less organised', facebook: 'Broad, less organised' },
  { label: 'Location-based results', dukancloude: 'Yes', olx: 'Yes', facebook: 'Limited' },
  { label: 'Spam control', dukancloude: 'OTP + moderation', olx: 'Basic', facebook: 'Basic' },
  { label: 'Support', dukancloude: '100% human support', olx: 'Limited', facebook: 'Limited' },
  { label: 'Overall rating', dukancloude: '★ 4.9', olx: '★ 4.0', facebook: '★ 3.8' },
];

const differentiators = [
  'OTP-verified sellers on every listing',
  'Products & services together, in one place',
  `${cloudes.length} organised Cloudes, ${totalCategories}+ categories`,
  'Location-based search results',
  'Free to post — no hidden fees',
];

function AnimatedWords({ text, startDelay, stepMs }: { text: string; startDelay: number; stepMs: number }) {
  let charIndex = 0;
  const words = text.split(' ').map((word, wi) => {
    const letters = word.split('').map((char) => {
      const delay = startDelay + charIndex * stepMs;
      charIndex += 1;
      return (
        <span
          key={char + charIndex}
          className="inline-block animate-letter-reveal"
          style={{ animationDelay: `${delay}ms` }}
        >
          {char}
        </span>
      );
    });
    charIndex += 1; // account for the space that follows this word
    return (
      <span key={wi} className="inline-block whitespace-nowrap">
        {letters}
      </span>
    );
  });
  return <>{words.flatMap((word, i) => (i === 0 ? [word] : [' ', word]))}</>;
}

export default async function HomePage() {
  // Live shops with their latest products/services; an unreachable API just shows the empty state.
  // The 8 best-rated shops, services and jobs in the visitor's area (navbar location
  // picker — their city, its sub-areas and ~25 km around). An unreachable API just
  // shows the empty state.
  const location = getUserLocation();
  const city = location?.city;
  const fresh: FreshItem[] = await api.listings.fresh(nearParams(location), 8).catch(() => []);

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-border bg-gradient-to-b from-brand-soft/60 to-bg">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-brand/20 blur-3xl" />
          <div className="absolute -right-16 top-1/3 h-64 w-64 animate-float-slow rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-6">
          <HeroTwoColumn>
            <h1 className="font-hero text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              <span className="block overflow-hidden pb-1">
                <span className="inline-block animate-fade-in-up" style={{ animationDelay: '80ms' }}>Buy,</span>{' '}
                <span className="inline-block animate-fade-in-up" style={{ animationDelay: '160ms' }}>sell,</span>{' '}
                <span className="inline-block animate-fade-in-up" style={{ animationDelay: '240ms' }}>hire</span>{' '}
                <span className="inline-block animate-fade-in-up" style={{ animationDelay: '320ms' }}>&amp;</span>{' '}
                <span className="inline-block animate-fade-in-up" style={{ animationDelay: '400ms' }}>book</span>
              </span>
              <span className="block overflow-hidden pb-1 text-ink">
                <AnimatedWords text="every business, one place." startDelay={480} stepMs={28} />
              </span>
            </h1>

            <p
              className="mt-5 animate-fade-in-up text-base text-ink-muted sm:text-lg"
              style={{ animationDelay: '560ms' }}
            >
              From handmade crafts to home tutors, wedding venues to skilled mistris — DukanCloude
              brings every kind of local product and service onto a single platform.
            </p>

            <div className="mt-8 flex animate-fade-in-up flex-wrap gap-3" style={{ animationDelay: '640ms' }}>
              <Link
                href="/post-ad"
                className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-8px_rgb(var(--brand)/calc(0.6*var(--glow)))] transition-transform hover:-translate-y-0.5 hover:opacity-95"
              >
                Post your ad — it's free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#explore-cloudes"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                Explore Cloudes
              </a>
            </div>

            <div
              className="mt-9 flex animate-fade-in-up flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted"
              style={{ animationDelay: '720ms' }}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <ShieldCheck size={14} />
                </span>
                OTP-verified sellers
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <MapPin size={14} />
                </span>
                Location-based results
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Zap size={14} />
                </span>
                Post an ad in 2 minutes
              </span>
            </div>

            <div
              className="mt-8 grid animate-fade-in-up grid-cols-3 divide-x divide-border border-t border-border pt-6"
              style={{ animationDelay: '800ms' }}
            >
              <div className="text-center">
                <p className="font-hero text-2xl font-extrabold text-ink">{cloudes.length}</p>
                <p className="text-xs text-ink-muted">Cloudes</p>
              </div>
              <div className="text-center">
                <p className="font-hero text-2xl font-extrabold text-ink">{totalCategories}+</p>
                <p className="text-xs text-ink-muted">Categories</p>
              </div>
              <div className="text-center">
                <p className="font-hero text-2xl font-extrabold text-ink">Free</p>
                <p className="text-xs text-ink-muted">To post an ad</p>
              </div>
            </div>
          </HeroTwoColumn>
        </div>
      </section>

      {/* Cloude grid */}
      <section id="explore-cloudes" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-soft/40 via-surface to-surface p-4 shadow-card sm:p-6 dark:border-white/[0.06] dark:from-[#0a1a2f] dark:via-[#071526] dark:to-[#06111f]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Organised hyperlocal sectors
              </p>
              <h2 className="mt-1 font-hero text-2xl font-extrabold text-ink sm:text-3xl dark:text-white">
                Explore {cloudes.length} Cloudes
              </h2>
              <p className="mt-1 text-xs text-ink-muted sm:text-sm dark:text-slate-400">
                Every local trade and business with its own dedicated space.
              </p>
            </div>
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-400/10 dark:text-cyan-300">
              {totalCategories}+ Sub-Categories
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cloudes.map((c) => (
              <CloudeCard key={c.slug} cloude={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Fresh listings near you</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {city ? (
                <>
                  Top-rated shops, services &amp; jobs in and around <span className="font-semibold text-ink">{city}</span>.
                </>
              ) : (
                'Top-rated shops, services & jobs — set your location in the search bar to see ones near you.'
              )}
            </p>
          </div>
          <ViewAllCloudes
            cloudes={cloudes.map((c) => ({
              slug: c.slug,
              name: c.name,
              icon: c.icon,
              description: c.description,
              categoryCount: c.categories.length,
            }))}
          />
        </div>
        {fresh.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {fresh.map((item, i) => (
              <ScrollReveal key={`${item.kind}-${item.id}`} direction="up" delay={(i % 4) * 90} className="h-full">
                {item.kind === 'shop' ? (
                  <LiveShopCard shop={item} rating={item.rating} />
                ) : (
                  <FreshJobCard job={item} rating={item.rating} />
                )}
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="font-display text-base font-bold text-ink">
              {city ? `Nothing live near ${city} yet` : 'No live shops yet'}
            </p>
            <p className="max-w-sm text-sm text-ink-muted">
              {city
                ? 'Be the first shop, service or job in your area — or pick another location from the search bar.'
                : 'Be the first to open a shop — it shows up here as soon as it goes live.'}
            </p>
            <Link href="/post-ad" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink hover:opacity-90">
              Post your ad — it's free
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-brand-soft/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Have something to sell or a service to offer?</h2>
          <p className="max-w-md text-sm text-ink-muted">
            Post your ad in under 2 minutes — pick a category, add details, and go live after OTP verification.
          </p>
          <Link
            href="/post-ad"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink hover:opacity-90"
          >
            Post your ad — it's free
          </Link>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Why thousands are choosing <span className="text-brand">DukanCloude</span>
          </h2>
          <p className="mt-3 text-sm text-ink-muted sm:text-base">
            One verified, organised platform for every kind of local product and service — see how it stacks up.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-border shadow-card">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-hover">
                <th className="px-3 py-3 font-display text-xs font-bold text-ink sm:px-5 sm:py-4 sm:text-sm">Features</th>
                <th className="px-3 py-3 sm:px-5 sm:py-4">
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-xs font-bold text-brand sm:text-sm">
                    DukanCloude
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-ink">
                      Best
                    </span>
                  </span>
                </th>
                <th className="px-5 py-4 font-display text-sm font-bold text-ink-muted">Others</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-t border-border ${row.highlight ? 'bg-brand-soft' : i % 2 === 1 ? 'bg-surface-hover/50' : 'bg-surface'}`}
                >
                  <td className="px-5 py-4 font-medium text-ink">{row.label}</td>
                  <td className="px-5 py-4 font-semibold text-brand">{row.dukancloude}</td>
                  <td className="px-5 py-4 text-ink-muted">
                    {row.olx === row.facebook ? row.olx : `${row.olx} / ${row.facebook}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* What makes DukanCloude different — overflow-x-clip keeps the ScrollReveal
          slide-in (translate-x-16) from pushing past the viewport edge. */}
      <section className="overflow-x-clip border-t border-border bg-surface-hover/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              What makes <span className="text-brand">DukanCloude</span> different
            </h2>
            <p className="mt-3 text-sm text-ink-muted sm:text-base">
              Built for local sellers and service providers who want simplicity, trust, and speed.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ScrollReveal direction="left">
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-card">
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-soft blur-2xl" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Rocket size={20} />
                </span>
                <h3 className="relative mt-4 font-display text-lg font-bold text-ink sm:text-xl">
                  Go live in just 2 minutes
                </h3>
                <p className="relative mt-3 text-sm text-ink-muted">
                  No listing fees, no complicated forms. Pick a Cloude, add your details and photos, verify with
                  OTP, and your ad is discoverable by buyers near you.
                </p>
                <div className="relative mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div>
                    <p className="font-hero text-xl font-extrabold text-ink">Free</p>
                    <p className="text-xs text-ink-muted">Cost to post</p>
                  </div>
                  <div>
                    <p className="font-hero text-xl font-extrabold text-ink">2 Min</p>
                    <p className="text-xs text-ink-muted">Setup time</p>
                  </div>
                  <div>
                    <p className="font-hero text-xl font-extrabold text-ink">OTP</p>
                    <p className="text-xs text-ink-muted">Verified sellers</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {differentiators.map((item, i) => (
                <ScrollReveal key={item} direction="right" delay={i * 120}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border bg-surface px-4 py-3.5 shadow-card transition-colors ${
                      i === differentiators.length - 1 ? 'border-brand' : 'border-border'
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium text-ink">{item}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/post-ad"
              className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-8px_rgb(var(--brand)/calc(0.6*var(--glow)))] transition-transform hover:-translate-y-0.5 hover:opacity-95"
            >
              Start your DukanCloude listing today
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
