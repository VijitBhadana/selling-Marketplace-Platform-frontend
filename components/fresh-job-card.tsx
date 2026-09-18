import Link from 'next/link';
import { Briefcase, Building2, Clock, IndianRupee, MapPin } from 'lucide-react';
import type { FreshJob, Rating } from '@/lib/api';
import { formatSalary, WORK_MODE_LABELS } from '@/lib/jobs';
import { RatingBadge, timeAgo } from './live-shop-card';

/** An open job in the home page's "Fresh listings near you", rated by the company that posted it. */
export function FreshJobCard({ job, rating }: { job: FreshJob; rating?: Rating }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand"
    >
      <div className="relative flex aspect-[16/10] flex-col justify-end overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-brand-soft to-cyan-500/20 p-4">
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {job.category.cloude.name.replace(' Cloude', '')}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-fuchsia-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Hiring
        </span>
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-fuchsia-600 shadow-card transition-transform duration-300 group-hover:scale-110 dark:text-fuchsia-300">
          <Briefcase size={20} />
        </span>
        <p className="line-clamp-2 font-display text-lg font-bold leading-tight text-ink">{job.title}</p>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 text-sm font-semibold text-ink group-hover:text-brand">
            <Building2 size={14} className="shrink-0" />
            <span className="truncate">{job.companyName}</span>
          </span>
          <RatingBadge rating={rating} />
        </div>
        <span className="mt-0.5 truncate text-xs text-ink-muted">{job.category.name}</span>

        <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-brand">
            <IndianRupee size={12} className="shrink-0" /> {formatSalary(job)}
          </p>
          <p className="text-ink-muted">
            {WORK_MODE_LABELS[job.workMode]}
            {job.experience ? ` · ${job.experience}` : ''}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3 text-xs text-ink-muted">
          {job.location && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin size={12} className="shrink-0" /> {job.location}
            </span>
          )}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock size={12} className="shrink-0" /> {timeAgo(job.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
