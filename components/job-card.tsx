'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Building2, Clock, MapPin, Sparkles, Wallet } from 'lucide-react';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS, formatSalary, isNewJob, postedAgo, type Job, type MyApplication } from '@/lib/jobs';
import { JobActions } from './job-actions';

const MAX_SKILLS_ON_CARD = 4;

// Same shell as ShopCard (badge band + initial avatar + two action buttons), but
// with no photo — job posts don't have one — and Apply in place of Visit Store.
export const JobCard = memo(function JobCard({
  job,
  application,
  onApplied,
}: {
  job: Job;
  application?: MyApplication;
  onApplied: (application: MyApplication) => void;
}) {
  const initial = job.companyName.trim().charAt(0).toUpperCase() || 'J';
  const extraSkills = job.skills.length - MAX_SKILLS_ON_CARD;
  const applicants = job._count?.applications ?? 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-20 w-full bg-gradient-to-br from-brand/25 via-brand-soft to-accent/15">
        <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {job.category.name}
        </span>
        {isNewJob(job.createdAt) && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
            <Sparkles size={11} className="text-brand" /> New
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <span className="-mt-6 mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-brand text-lg font-bold text-brand-ink shadow-card">
          {initial}
        </span>

        <Link href={`/jobs/${job.id}`} className="line-clamp-2 font-display text-base font-bold leading-tight text-ink hover:text-brand">
          {job.title}
        </Link>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-xs font-medium text-ink-muted">
          <Building2 size={12} className="shrink-0" />
          <span className="truncate">{job.companyName}</span>
          {job.isStartup && (
            <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">Startup</span>
          )}
        </span>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">{JOB_TYPE_LABELS[job.jobType]}</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-ink-muted">{WORK_MODE_LABELS[job.workMode]}</span>
          {job.experience && (
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-ink-muted">
              <Clock size={11} /> {job.experience}
            </span>
          )}
        </div>

        <span className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Wallet size={13} className="shrink-0 text-brand" /> {formatSalary(job)}
        </span>
        {job.location && (
          <span className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={12} /> {job.location}
          </span>
        )}

        {job.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {job.skills.slice(0, MAX_SKILLS_ON_CARD).map((skill) => (
              <span key={skill} className="rounded-md bg-surface-hover px-2 py-0.5 text-[11px] text-ink-muted">
                {skill}
              </span>
            ))}
            {extraSkills > 0 && <span className="px-1 py-0.5 text-[11px] text-ink-muted">+{extraSkills} more</span>}
          </div>
        )}

        <p className="mt-3 text-[11px] text-ink-muted">
          Posted {postedAgo(job.createdAt)} · {applicants} applicant{applicants === 1 ? '' : 's'}
        </p>

        <div className="mt-auto pt-4">
          <JobActions job={job} application={application} onApplied={onApplied} />
        </div>
      </div>
    </div>
  );
});
