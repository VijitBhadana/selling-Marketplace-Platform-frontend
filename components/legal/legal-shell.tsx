import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, Headphones, Mail, MapPin, type LucideIcon } from 'lucide-react';
import { COMPANY, LEGAL_LAST_UPDATED, type LegalHref } from '@/lib/legal';
import { LegalHero } from './legal-hero';
import { LegalToc } from './legal-toc';

export type LegalSection = { id: string; title: string; body: ReactNode };
export type LegalHighlight = { icon: LucideIcon; title: string; text: string };

/** Page frame for Privacy, Terms, Refund and Shipping: hero, key points, sticky contents and numbered sections. */
export function LegalShell({
  current,
  icon,
  eyebrow,
  title,
  intro,
  readMinutes,
  highlights,
  sections,
}: {
  current: LegalHref;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  readMinutes: number;
  highlights: LegalHighlight[];
  sections: LegalSection[];
}) {
  return (
    <div className="pb-16 sm:pb-20">
      <LegalHero
        current={current}
        icon={icon}
        eyebrow={eyebrow}
        title={title}
        intro={intro}
        meta={[
          { icon: CalendarDays, label: `Last updated ${LEGAL_LAST_UPDATED}` },
          { icon: Clock3, label: `${readMinutes} min read` },
          { icon: MapPin, label: 'Applies across India' },
        ]}
      />

      {/* At a glance */}
      <section aria-label="Key points" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: HighlightIcon, title: heading, text }, i) => (
            <div
              key={heading}
              className="group relative flex animate-fade-in-up gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 sm:block sm:p-5"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <HighlightIcon size={18} />
              </span>
              <div className="relative">
                <h2 className="font-display text-sm font-bold text-ink sm:mt-4">{heading}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-10">
          <aside className="no-scrollbar lg:sticky lg:top-24 lg:-mx-1 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:px-1 lg:pb-2">
            <LegalToc items={sections.map(({ id, title: heading }) => ({ id, title: heading }))} />
            <div className="mt-4 hidden rounded-2xl border border-border bg-gradient-to-br from-brand-soft/60 to-surface p-4 lg:block">
              <p className="font-display text-sm font-bold text-ink">Questions about this policy?</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">Write to us — a real person reads every email.</p>
              <a
                href={`mailto:${COMPANY.supportEmail}`}
                className="mt-3 inline-flex items-center gap-1.5 break-all text-xs font-semibold text-brand hover:underline"
              >
                <Mail size={13} className="shrink-0" />
                {COMPANY.supportEmail}
              </a>
            </div>
          </aside>

          <article className="min-w-0 space-y-4 sm:space-y-5">
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-display text-sm font-bold tabular-nums text-brand">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="pt-1 font-display text-lg font-bold leading-snug text-ink sm:text-xl">{section.title}</h2>
                </div>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-ink-muted sm:pl-[52px] [&_a:hover]:underline [&_a]:font-medium [&_a]:text-brand [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-ink">
                  {section.body}
                </div>
              </section>
            ))}

            <LegalHelpCta />
          </article>
        </div>
      </div>
    </div>
  );
}

export function LegalHelpCta() {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand/85 p-6 text-brand-ink shadow-[0_10px_30px_-14px_rgb(var(--brand)/calc(0.7*var(--glow)))] sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/20 sm:flex">
            <Headphones size={22} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Still have a question?</h2>
            <p className="mt-1 max-w-md text-sm text-brand-ink/85">
              Our support team is human, not a bot. We usually reply within a few hours on working days.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-1.5 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Contact support
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            <Mail size={15} />
            Email us
          </a>
        </div>
      </div>
    </div>
  );
}
