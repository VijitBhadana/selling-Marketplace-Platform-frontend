import Link from 'next/link';
import type { Cloude } from '@/lib/cloudes-data';
import { Icon } from './icon';

export function CloudeCard({ cloude }: { cloude: Cloude }) {
  return (
    <Link
      href={`/cloudes/${cloude.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5 hover:border-brand"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-ink">
        <Icon name={cloude.icon} size={20} />
      </span>
      <div>
        <h3 className="font-display text-base font-bold text-ink">{cloude.name.replace(' Cloude', '')}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{cloude.description}</p>
      </div>
      <span className="mt-auto text-xs font-medium text-ink-muted">{cloude.categories.length} categories</span>
    </Link>
  );
}
