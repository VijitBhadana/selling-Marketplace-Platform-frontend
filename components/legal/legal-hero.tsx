import Link from 'next/link';
import { ChevronRight, FileText, Headphones, Lock, RotateCcw, Truck, type LucideIcon } from 'lucide-react';
import { LEGAL_LINKS, type LegalHref } from '@/lib/legal';

const linkIcons: Record<LegalHref, LucideIcon> = {
  '/privacy-policy': Lock,
  '/terms': FileText,
  '/refund-policy': RotateCcw,
  '/shipping-policy': Truck,
  '/contact': Headphones,
};

export type HeroMeta = { icon: LucideIcon; label: string };

/** Header shared by the policy pages and Contact Us: breadcrumb, title, meta chips and the policy switcher. */
export function LegalHero({
  current,
  icon: EyebrowIcon,
  eyebrow,
  title,
  intro,
  meta,
}: {
  current: LegalHref;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  meta: HeroMeta[];
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-soft/60 to-bg">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-brand/20 blur-3xl" />
          <div className="absolute -right-20 top-6 h-72 w-72 animate-float-slow rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--border)/0.55)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--border)/0.55)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            <Link href="/" className="transition-colors hover:text-brand">
              Home
            </Link>
            <ChevronRight size={12} className="text-ink-muted/60" />
            <span>{current === '/contact' ? 'Support' : 'Legal'}</span>
            <ChevronRight size={12} className="text-ink-muted/60" />
            <span className="font-medium text-ink">{title}</span>
          </nav>

          <div className="mt-6 max-w-3xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface/80 px-3 py-1 text-xs font-semibold text-brand shadow-sm backdrop-blur">
              <EyebrowIcon size={13} />
              {eyebrow}
            </span>
            <h1 className="mt-4 font-hero text-[2rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">{intro}</p>
          </div>

          <ul
            className="mt-7 flex animate-fade-in-up flex-wrap gap-2 text-xs font-medium text-ink-muted"
            style={{ animationDelay: '120ms' }}
          >
            {meta.map(({ icon: MetaIcon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1.5 backdrop-blur"
              >
                <MetaIcon size={13} className="text-brand" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-7 max-w-7xl px-4 sm:px-6">
        <nav
          aria-label="Policies"
          className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-surface/95 p-1.5 shadow-card backdrop-blur"
        >
          {LEGAL_LINKS.map(({ href, label }) => {
            const LinkIcon = linkIcons[href];
            const active = href === current;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-brand text-brand-ink shadow-[0_6px_16px_-8px_rgb(var(--brand)/calc(0.8*var(--glow)))]'
                    : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
                }`}
              >
                <LinkIcon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
