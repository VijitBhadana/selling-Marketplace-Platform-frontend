'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Check, MessageCircle, Users, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import {
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  formatInterviewTime,
  formatSalary,
  type Job,
  type MyApplication,
} from '@/lib/jobs';
import { useMyJobApplications } from '@/lib/use-my-job-applications';
import { JobApplyModal } from './job-apply-modal';

// Apply + Chat buttons for a job (the Jobs & Freelancing replacement for a shop
// card's Buy/Visit + Chat). The recruiter who posted the job sees their responses instead.
export function JobActions({
  job,
  application,
  onApplied,
}: {
  job: Pick<Job, 'id' | 'title' | 'companyName' | 'postedBy' | '_count'>;
  application?: MyApplication;
  onApplied: (application: MyApplication) => void;
}) {
  const { user, requireAuth } = useAuth();
  const { openChat } = useChat();
  const [applyOpen, setApplyOpen] = useState(false);

  if (user?.id === job.postedBy.id) {
    const count = job._count?.applications ?? 0;
    return (
      <Link
        href={`/jobs/${job.id}#responses`}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
      >
        <Users size={15} /> View responses ({count})
      </Link>
    );
  }

  function openJobChat() {
    requireAuth(() => openChat({ jobId: job.id, title: job.companyName, subtitle: `About: ${job.title}` }));
  }

  return (
    <>
      <div className="flex gap-2">
        {application ? (
          <span
            title={application.interviewAt ? `Interview: ${formatInterviewTime(application.interviewAt)}` : undefined}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-center text-sm font-semibold ${
              application.status === 'REJECTED' ? 'bg-surface-hover text-ink-muted' : 'bg-brand-soft text-brand'
            }`}
          >
            {application.status === 'INTERVIEW_SCHEDULED' ? (
              <><CalendarCheck size={15} /> Interview</>
            ) : application.status === 'REJECTED' ? (
              <><XCircle size={15} /> Not selected</>
            ) : (
              <><Check size={15} /> Applied</>
            )}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => requireAuth(() => setApplyOpen(true))}
            className="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        )}
        <button
          type="button"
          onClick={openJobChat}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          <MessageCircle size={15} /> Chat
        </button>
      </div>

      {applyOpen && <JobApplyModal job={job} onClose={() => setApplyOpen(false)} onApplied={onApplied} />}
    </>
  );
}

// Side panel on the job detail page: salary summary + the same Apply / Chat actions.
export function JobApplyPanel({ job }: { job: Job }) {
  const { byJob, markApplied } = useMyJobApplications();
  const application = byJob[job.id];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Salary / package</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">{formatSalary(job)}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {JOB_TYPE_LABELS[job.jobType]} · {WORK_MODE_LABELS[job.workMode]}
        {job.location ? ` · ${job.location}` : ''}
      </p>

      {application?.status === 'INTERVIEW_SCHEDULED' && application.interviewAt && (
        <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
          Interview on {formatInterviewTime(application.interviewAt)} — the details are in your chat with {job.companyName}.
        </p>
      )}

      <div className="mt-4">
        <JobActions job={job} application={application} onApplied={markApplied} />
      </div>
    </div>
  );
}
