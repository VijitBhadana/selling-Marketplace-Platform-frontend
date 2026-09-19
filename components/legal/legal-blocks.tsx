import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';

// Small building blocks for the policy pages' section bodies.

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="pt-1 font-display text-base font-bold text-ink">{children}</h3>;
}

export function Bullets({ items, variant = 'dot' }: { items: ReactNode[]; variant?: 'dot' | 'check' | 'cross' }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          {variant === 'dot' && <span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
          {variant === 'check' && <CheckCircle2 aria-hidden size={18} className="mt-[5px] shrink-0 text-brand" />}
          {variant === 'cross' && <XCircle aria-hidden size={18} className="mt-[5px] shrink-0 text-accent" />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Callout({
  tone = 'brand',
  title,
  children,
}: {
  tone?: 'brand' | 'accent';
  title?: string;
  children: ReactNode;
}) {
  const Icon = tone === 'accent' ? AlertTriangle : Info;
  return (
    <div
      className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${
        tone === 'accent' ? 'border-accent/25 bg-accent-soft/50' : 'border-brand/20 bg-brand-soft/50'
      }`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${tone === 'accent' ? 'text-accent' : 'text-brand'}`} />
      <div>
        {title && <p className="mb-0.5 font-semibold text-ink">{title}</p>}
        <div className="text-ink-muted">{children}</div>
      </div>
    </div>
  );
}

/** A table on tablets and up; stacked cards on phones so nothing scrolls sideways. */
export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
        <table className="w-full text-left text-sm leading-relaxed">
          <thead className="bg-surface-hover/70 text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className="px-4 py-3 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-surface-hover/40">
                {row.map((cell, j) => (
                  <td key={j} className={`px-4 py-3 align-top ${j === 0 ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2.5 sm:hidden">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-border bg-bg/60 p-4">
            <p className="text-sm font-semibold leading-snug text-ink">{row[0]}</p>
            <dl className="mt-2.5 space-y-2 text-sm leading-snug">
              {row.slice(1).map((cell, j) => (
                <div key={j} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-xs text-ink-muted/80">{columns[j + 1]}</dt>
                  <dd className="text-right text-ink">{cell}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

/** Numbered process — a vertical timeline, laid out in a row on wide screens. */
export function Steps({ steps }: { steps: { icon: LucideIcon; title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 xl:grid-cols-4 xl:gap-3">
      {steps.map(({ icon: StepIcon, title, text }, i) => (
        <li key={title} className="relative flex gap-4 xl:flex-col xl:gap-3">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute left-5 top-11 h-[calc(100%-1.75rem)] w-px bg-gradient-to-b from-brand/50 to-border xl:left-12 xl:top-5 xl:h-px xl:w-[calc(100%-2.25rem)] xl:bg-gradient-to-r"
            />
          )}
          <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink shadow-[0_6px_16px_-8px_rgb(var(--brand)/calc(0.8*var(--glow)))] ring-4 ring-surface">
            <StepIcon size={18} />
          </span>
          <div className="pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Step {i + 1}</p>
            <p className="font-display text-sm font-bold text-ink">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Grid of icon cards — used for delivery modes, per-Cloude rules and the like. */
export function InfoCards({
  cards,
  columns = 2,
}: {
  cards: { icon: LucideIcon; title: string; text: ReactNode; tag?: string }[];
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${columns === 3 ? 'xl:grid-cols-3' : ''}`}>
      {cards.map(({ icon: CardIcon, title, text, tag }) => (
        <div
          key={title}
          className="group rounded-xl border border-border bg-bg/60 p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/20"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-transform group-hover:scale-105">
              <CardIcon size={17} />
            </span>
            <p className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-ink">{title}</p>
            {tag && (
              <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted ring-1 ring-border">
                {tag}
              </span>
            )}
          </div>
          <div className="mt-3 text-sm leading-relaxed text-ink-muted">{text}</div>
        </div>
      ))}
    </div>
  );
}
