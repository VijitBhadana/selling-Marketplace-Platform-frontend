'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Flag,
  Handshake,
  HelpCircle,
  Package,
  RotateCcw,
  Send,
  Store,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { COMPANY } from '@/lib/legal';

const topics: { label: string; icon: LucideIcon; needsOrder?: boolean }[] = [
  { label: 'Order or booking', icon: Package, needsOrder: true },
  { label: 'Refund / cancellation', icon: RotateCcw, needsOrder: true },
  { label: 'Payment issue', icon: CreditCard, needsOrder: true },
  { label: 'Seller / shop help', icon: Store },
  { label: 'Report a listing or user', icon: Flag },
  { label: 'Jobs & recruiters', icon: Briefcase },
  { label: 'Account & login', icon: UserRound },
  { label: 'Partnership', icon: Handshake },
  { label: 'Something else', icon: HelpCircle },
];

type Form = { name: string; email: string; phone: string; topic: string; orderId: string; message: string };
type Errors = Partial<Record<keyof Form, string>>;

const MESSAGE_MAX = 1000;
const inputBase =
  'w-full rounded-xl border bg-bg px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/15';

function validate(form: Form): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  const digits = form.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (form.phone.trim() && !/^[6-9]\d{9}$/.test(digits)) errors.phone = 'Enter a 10-digit Indian mobile number.';
  if (!form.topic) errors.topic = 'Pick what your message is about.';
  if (form.message.trim().length < 20) errors.message = 'Please tell us a little more (at least 20 characters).';
  return errors;
}

/**
 * Support form. There is no contact endpoint on the API yet, so it hands the message to the
 * visitor's email app, addressed to support and filled in, instead of pretending to send it.
 */
export function ContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState<Form>({ name: '', email: '', phone: '', topic: '', orderId: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Signed-in visitors don't have to retype who they are.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
  }, [user]);

  const topic = topics.find((t) => t.label === form.topic);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (['name', 'email', 'phone', 'topic', 'message'] as const).find((key) => found[key]);
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    const orderId = topic?.needsOrder ? form.orderId.trim() : '';
    const subject = `[${form.topic}] ${form.name.trim()}${orderId ? ` · Order ${orderId}` : ''}`;
    const phone = form.phone.replace(/\D/g, '').slice(-10);
    const details = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      phone && `Phone: +91 ${phone}`,
      orderId && `Order ID: ${orderId}`,
      `Topic: ${form.topic}`,
    ].filter(Boolean);
    const body = `${form.message.trim()}\n\n—\n${details.join('\n')}`;

    window.location.href = `mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(COMPANY.supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the address is on screen anyway.
    }
  }

  if (sent) {
    return (
      <div className="flex animate-fade-in-up flex-col items-center px-2 py-10 text-center sm:py-14">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand/20 [animation-iteration-count:2]" />
          <CheckCircle2 size={30} />
        </span>
        <h3 className="mt-5 font-display text-xl font-bold text-ink">Your message is ready to send</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Your email app should have opened with everything filled in. Just press <strong className="text-ink">Send</strong>.
          We reply within 24 hours on working days.
        </p>
        <p className="mt-4 text-xs text-ink-muted">
          Nothing opened? Email us directly at{' '}
          <a href={`mailto:${COMPANY.supportEmail}`} className="font-semibold text-brand hover:underline">
            {COMPANY.supportEmail}
          </a>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy email address'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setForm((f) => ({ ...f, topic: '', orderId: '', message: '' }));
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
          >
            Write another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Full name" error={errors.name} required>
          <input
            id="contact-name"
            value={form.name}
            onChange={(e) => update('name', e.target.value.slice(0, 80))}
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            aria-invalid={!!errors.name}
            className={`${inputBase} ${errors.name ? 'border-accent' : 'border-border'}`}
          />
        </Field>
        <Field id="contact-email" label="Email address" error={errors.email} required>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value.slice(0, 120))}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className={`${inputBase} ${errors.email ? 'border-accent' : 'border-border'}`}
          />
        </Field>
      </div>

      <Field id="contact-phone" label="Mobile number" hint="Optional. Add it if you'd like a call back." error={errors.phone}>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center border-r border-border pr-3 text-sm font-medium text-ink-muted">
            +91
          </span>
          <input
            id="contact-phone"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value.replace(/[^\d\s+]/g, '').slice(0, 15))}
            autoComplete="tel-national"
            placeholder="98765 43210"
            aria-invalid={!!errors.phone}
            className={`${inputBase} pl-[4.25rem] ${errors.phone ? 'border-accent' : 'border-border'}`}
          />
        </div>
      </Field>

      <fieldset>
        <legend id="contact-topic-label" className="mb-2 text-sm font-medium text-ink">
          What can we help with? <span className="text-accent">*</span>
        </legend>
        <div
          id="contact-topic"
          tabIndex={-1}
          role="radiogroup"
          aria-labelledby="contact-topic-label"
          className="flex flex-wrap gap-2 outline-none"
        >
          {topics.map(({ label, icon: TopicIcon }) => {
            const active = form.topic === label;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update('topic', label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all ${
                  active
                    ? 'border-brand bg-brand text-brand-ink shadow-[0_6px_16px_-8px_rgb(var(--brand)/calc(0.8*var(--glow)))]'
                    : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
                }`}
              >
                <TopicIcon size={14} />
                {label}
              </button>
            );
          })}
        </div>
        {errors.topic && <ErrorText>{errors.topic}</ErrorText>}
      </fieldset>

      {topic?.needsOrder && (
        <div className="animate-slide-down">
          <Field id="contact-order" label="Order ID" hint="Optional, but it helps us find your order faster.">
            <input
              id="contact-order"
              value={form.orderId}
              onChange={(e) => update('orderId', e.target.value.slice(0, 60))}
              placeholder="Find it in your order notification"
              className={`${inputBase} border-border`}
            />
          </Field>
        </div>
      )}

      <Field id="contact-message" label="Your message" error={errors.message} required>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => update('message', e.target.value.slice(0, MESSAGE_MAX))}
          rows={5}
          placeholder="Tell us what happened. Include dates, shop names and amounts if they're relevant."
          aria-invalid={!!errors.message}
          className={`${inputBase} resize-y ${errors.message ? 'border-accent' : 'border-border'}`}
        />
        <p className="mt-1.5 text-right text-[11px] tabular-nums text-ink-muted/80">
          {form.message.length}/{MESSAGE_MAX}
        </p>
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-ink-muted">
          This opens your email app with the message filled in. Read how we handle your data in our{' '}
          <Link href="/privacy-policy" className="font-medium text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="submit"
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-8px_rgb(var(--brand)/calc(0.6*var(--glow)))] transition-all hover:-translate-y-0.5 hover:opacity-95"
        >
          Send message
          <Send size={15} className="transition-transform group-hover:-rotate-12 group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : hint && <p className="mt-1.5 text-xs text-ink-muted/80">{hint}</p>}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-accent">
      <AlertCircle size={13} className="shrink-0" />
      {children}
    </p>
  );
}
