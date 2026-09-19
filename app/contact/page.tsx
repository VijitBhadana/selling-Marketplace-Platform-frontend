import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  FileText,
  Headphones,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, telHref } from '@/lib/legal';
import { LegalHero } from '@/components/legal/legal-hero';
import { ContactForm } from '@/components/contact/contact-form';
import { SupportHours } from '@/components/contact/support-hours';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get help from the DukanCloude support team — orders, refunds, payments, seller accounts and grievances. Email, call or send us a message. Real people, replies within 24 hours.',
  path: '/contact',
});

const channels: { icon: LucideIcon; title: string; text: string; value: string; href: string; note: string }[] = [
  {
    icon: Mail,
    title: 'Email support',
    text: 'Orders, refunds, payments, accounts. Write to us about anything.',
    value: COMPANY.supportEmail,
    href: `mailto:${COMPANY.supportEmail}`,
    note: 'Replies within 24 hours',
  },
  {
    icon: Phone,
    title: 'Call us',
    text: 'For urgent order or payment issues that need a quick answer.',
    value: COMPANY.phone,
    href: telHref(COMPANY.phone),
    note: COMPANY.supportHours,
  },
  {
    icon: Store,
    title: 'Sellers & partners',
    text: 'Opening a shop, paid plans, bulk listings or partnership ideas.',
    value: COMPANY.sellerEmail,
    href: `mailto:${COMPANY.sellerEmail}`,
    note: 'Replies within 1 working day',
  },
  {
    icon: Scale,
    title: 'Grievance Officer',
    text: 'Complaints about content, safety, privacy or an unresolved issue.',
    value: COMPANY.grievanceEmail,
    href: `mailto:${COMPANY.grievanceEmail}`,
    note: 'Acknowledged within 24 hours',
  },
];

const guides: { href: string; icon: LucideIcon; title: string; text: string }[] = [
  { href: '/refund-policy', icon: RotateCcw, title: 'Refunds & cancellations', text: 'Cancellation windows, timelines, failed payments' },
  { href: '/shipping-policy', icon: Truck, title: 'Shipping & delivery', text: 'Delivery areas, charges and timelines' },
  { href: '/terms', icon: FileText, title: 'Terms & Conditions', text: 'Buying, selling and the COD rules' },
  { href: '/privacy-policy', icon: Lock, title: 'Privacy Policy', text: 'How we collect and protect your data' },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Where can I see the status of my order?',
    a: (
      <>
        Sign in and open your <Link href="/bucket-list">Bucket list</Link>. The <strong>My orders</strong> tab lists every
        order and booking with its current status. You also get a notification whenever the status changes.
      </>
    ),
  },
  {
    q: 'How long does a refund take?',
    a: (
      <>
        Once a refund is approved, we initiate it within 48 hours. UPI and wallet refunds usually arrive in 1–3 business days,
        and card or net-banking refunds in 5–7. See the full <Link href="/refund-policy#timelines">refund timelines</Link>.
      </>
    ),
  },
  {
    q: 'Money was debited but my order did not go through. What now?',
    a: (
      <>
        You do not need to do anything. The payment gateway reverses failed or duplicate payments automatically within 5–7
        business days. If the money has not come back after that, email us the transaction ID or UTR number.
      </>
    ),
  },
  {
    q: 'A seller asked me to pay outside DukanCloude. Is that safe?',
    a: (
      <>
        Please don’t. Payments made outside DukanCloude are not covered by our refund and dispute protection. Report the
        seller from their shop page or through the form above. Genuine employers and lenders never ask for money up front.
      </>
    ),
  },
  {
    q: 'My account was suspended after a Cash on Delivery no-show. Can I appeal?',
    a: (
      <>
        Yes. Choose <strong>Account &amp; login</strong> in the form and tell us what happened, with the order details. A
        member of our team reviews every appeal. The rules are explained in our{' '}
        <Link href="/terms#cash-on-delivery">Terms</Link>.
      </>
    ),
  },
  {
    q: 'How do I open a shop or post an ad?',
    a: (
      <>
        It’s free and takes about 2 minutes. Go to <Link href="/post-ad">Post your ad</Link>, verify your account with an OTP
        and add your shop, products or services. For bulk listings or paid plans, email{' '}
        <a href={`mailto:${COMPANY.sellerEmail}`}>{COMPANY.sellerEmail}</a>.
      </>
    ),
  },
  {
    q: 'How do I delete my account and data?',
    a: (
      <>
        Email <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> from your registered email address. We
        delete your account within 30 days, except records the law requires us to keep. See our{' '}
        <Link href="/privacy-policy#retention">Privacy Policy</Link>.
      </>
    ),
  },
];

const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.addressLines.slice(1).join(', '))}`;

export default function ContactPage() {
  return (
    <div className="pb-16 sm:pb-20">
      <LegalHero
        current="/contact"
        icon={Headphones}
        eyebrow="100% human support"
        title="Contact Us"
        intro="A question about an order, a refund or selling on DukanCloude? Real people are here to help. Pick whichever way suits you best."
        meta={[
          { icon: Clock3, label: COMPANY.supportHours },
          { icon: MessageSquareText, label: 'Replies within 24 hours' },
          { icon: ShieldCheck, label: 'Real people, not bots' },
        ]}
      />

      {/* Ways to reach us */}
      <section aria-label="Ways to reach us" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ icon: ChannelIcon, title, text, value, href, note }, i) => (
            <a
              key={title}
              href={href}
              className="group relative flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_18px_40px_-20px_rgb(var(--brand)/calc(0.5*var(--glow)))]"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand/70 text-brand-ink shadow-[0_6px_16px_-6px_rgb(var(--brand)/calc(0.7*var(--glow)))]">
                  <ChannelIcon size={19} />
                </span>
                <ArrowUpRight
                  size={18}
                  className="text-ink-muted/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                />
              </div>
              <h2 className="relative mt-4 font-display text-base font-bold text-ink">{title}</h2>
              <p className="relative mt-1 flex-1 text-sm leading-relaxed text-ink-muted">{text}</p>
              <p className="relative mt-4 break-all text-sm font-semibold text-brand">{value}</p>
              <span className="relative mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-hover px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                <Clock3 size={11} />
                {note}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
            <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Send us a message</h2>
                <p className="mt-1 text-sm text-ink-muted">Tell us what’s going on and the right team will get back to you.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['A', 'R', 'S'].map((initial, i) => (
                    <span
                      key={initial}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 ring-surface ${
                        i === 0 ? 'bg-brand text-brand-ink' : i === 1 ? 'bg-accent text-white' : 'bg-brand-soft text-brand'
                      }`}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <p className="text-xs leading-tight text-ink-muted">
                  <span className="block font-semibold text-ink">Support team</span>
                  Usually replies in a few hours
                </p>
              </div>
            </div>
            <ContactForm />
          </div>

          <div className="space-y-4">
            <SupportHours />

            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div aria-hidden className="relative h-32 overflow-hidden bg-brand-soft/50">
                <div className="absolute inset-0 bg-[radial-gradient(rgb(var(--brand)/0.28)_1px,transparent_1px)] bg-[size:14px_14px]" />
                <div className="absolute -left-6 -right-6 top-[58%] h-3 -rotate-6 bg-surface/90" />
                <div className="absolute -bottom-6 -top-6 left-[30%] w-2.5 rotate-12 bg-surface/90" />
                <div className="absolute -bottom-6 -top-6 right-[22%] w-2 -rotate-[20deg] bg-surface/70" />
                <span className="absolute left-1/2 top-[58%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-brand/25" />
                <span className="absolute left-1/2 top-[58%] flex h-10 w-10 -translate-x-1/2 -translate-y-[85%] items-center justify-center rounded-full bg-brand text-brand-ink shadow-[0_8px_20px_-6px_rgb(var(--brand)/0.8)] ring-4 ring-surface">
                  <MapPin size={18} />
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted/80">Registered office</p>
                <address className="mt-2 text-sm not-italic leading-relaxed text-ink">
                  {COMPANY.addressLines.map((line, i) => (
                    <span key={line} className={`block ${i === 0 ? 'font-semibold' : 'text-ink-muted'}`}>
                      {line}
                    </span>
                  ))}
                </address>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                >
                  Get directions
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <p className="font-display text-sm font-bold text-ink">Find answers faster</p>
              <ul className="mt-2 divide-y divide-border">
                {guides.map(({ href, icon: GuideIcon, title, text }) => (
                  <li key={href}>
                    <Link href={href} className="group flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-ink-muted transition-colors group-hover:bg-brand-soft group-hover:text-brand">
                        <GuideIcon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink transition-colors group-hover:text-brand">{title}</span>
                        <span className="block truncate text-xs text-ink-muted">{text}</span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-ink-muted/60 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-14 sm:px-6 sm:pt-20">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/60 px-3 py-1 text-xs font-semibold text-brand">
              <MessageSquareText size={13} />
              FAQ
            </span>
            <h2 className="mt-4 font-hero text-2xl font-bold tracking-tight text-ink sm:text-3xl">Frequently asked questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Quick answers to the questions we hear most. Can’t find yours? Send us a message and we’ll help.
            </p>
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Mail size={15} />
              Email support
            </a>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <details
                key={q}
                open={i === 0}
                className="group rounded-2xl border border-border bg-surface px-5 shadow-card transition-colors open:border-brand/30 sm:px-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[15px] font-bold leading-snug text-ink sm:py-5">
                  {q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-ink-muted transition-all duration-300 group-open:rotate-45 group-open:bg-brand group-open:text-brand-ink">
                    <Plus size={16} />
                  </span>
                </summary>
                <div className="-mt-1 pb-5 pr-10 text-sm leading-relaxed text-ink-muted [&_a:hover]:underline [&_a]:font-medium [&_a]:text-brand [&_strong]:font-semibold [&_strong]:text-ink">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
