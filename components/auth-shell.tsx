// Shared chrome for the login and register pages: a brand panel (lg+) beside
// the form column, plus the field / button / alert pieces both forms use.
// Purely presentational — each page keeps its own state and submit logic.
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, BadgeCheck, Cloud, LayoutGrid, Zap } from 'lucide-react';
import { cloudes } from '@/lib/cloudes-data';
import { SITE_NAME } from '@/lib/site';
import { Skeleton, SkeletonGroup } from '@/components/skeleton';

const highlights: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: LayoutGrid, title: `${cloudes.length} Cloudes, one account`, text: 'Shops, services, jobs and bookings near you.' },
  { icon: BadgeCheck, title: 'OTP-verified sellers', text: 'Every seller confirms their phone before going live.' },
  { icon: Zap, title: 'Post a free ad in 2 minutes', text: 'List a product, service or job straight from your phone.' },
];

const cloudeChips = cloudes.slice(0, 9).map((c) => c.name.replace(/\s*Cloude$/, ''));

export const authInputClass =
  'h-12 w-full rounded-xl border border-border bg-bg/60 text-[15px] text-ink placeholder:text-ink-muted/60 transition-all hover:border-ink-muted/30 focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15';

export const authSubmitClass =
  'group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-brand-ink shadow-[0_4px_12px_-8px_rgb(var(--brand)_/_0.25)] transition-all hover:-translate-y-px hover:bg-brand/90 hover:shadow-[0_6px_14px_-8px_rgb(var(--brand)_/_0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60';

export function AuthShell({
  panelTitle,
  panelText,
  title,
  subtitle,
  children,
}: {
  panelTitle: string;
  panelText: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-bg px-4 py-10 sm:px-6 lg:py-14">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="animate-float absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="animate-fade-in-up relative grid w-full max-w-[1080px] overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_80px_-30px_rgb(0_0_0_/_0.35)] lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0B1622] p-10 text-white lg:flex xl:p-12">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255_/_0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
            <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-brand/40 blur-[90px]" />
            <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent/30 blur-[90px]" />
          </div>

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-ink shadow-lg shadow-brand/30">
              <Cloud size={20} strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">{SITE_NAME}</span>
          </div>

          <div className="relative my-12">
            <h2 className="font-display text-[2.35rem] font-extrabold leading-[1.1] tracking-tight">{panelTitle}</h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/65">{panelText}</p>

            <ul className="mt-9 space-y-5">
              {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
                <li key={itemTitle} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-brand">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{itemTitle}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-white/55">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Explore Cloudes</p>
            <div className="flex flex-wrap gap-2">
              {cloudeChips.map((name) => (
                <span key={name} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8">
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-lg shadow-brand/25 lg:hidden">
                <Cloud size={22} strokeWidth={2.2} />
              </span>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-[2rem]">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Label + leading icon wrapper; the input itself is passed as children. */
export function AuthField({
  id,
  label,
  hint,
  icon: Icon,
  after,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  after?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-[13px] font-semibold text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-ink-muted">{hint}</span>}
      </label>
      <div className="group relative">
        <Icon
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand"
        />
        {children}
      </div>
      {after}
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="animate-slide-down flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-[13px] leading-snug text-accent"
    >
      <AlertCircle size={16} className="mt-px shrink-0" /> {message}
    </p>
  );
}

/** "or" divider + outlined link to the other auth page. */
export function AuthSwitch({ prompt, href, cta }: { prompt: string; href: string; cta: string }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-border" />
        {prompt}
        <span className="h-px flex-1 bg-border" />
      </div>
      <Link
        href={href}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-ink transition-colors hover:border-brand/50 hover:bg-brand-soft/60 hover:text-brand"
      >
        {cta}
      </Link>
    </div>
  );
}

/** Suspense fallback for the form column (the shell itself renders immediately). */
export function AuthFormFallback({ fields }: { fields: number }) {
  return (
    <SkeletonGroup className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-3.5 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl" />
    </SkeletonGroup>
  );
}
