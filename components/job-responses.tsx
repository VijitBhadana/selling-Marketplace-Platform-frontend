'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarClock, FileText, Mail, MessageCircle, Phone, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { api, ApiError } from '@/lib/api';
import { Skeleton, SkeletonGroup } from './skeleton';
import {
  APPLICATION_STATUS_LABELS,
  formatInr,
  formatInterviewTime,
  openResume,
  postedAgo,
  type ApplicationStatus,
  type JobApplicant,
} from '@/lib/jobs';

const inputClass =
  'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-brand-soft text-brand',
  SHORTLISTED: 'bg-brand-soft text-brand',
  INTERVIEW_SCHEDULED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  HIRED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'bg-surface-hover text-ink-muted',
};

function experienceLabel(years: number | null) {
  if (years == null) return '—';
  if (years === 0) return 'Fresher';
  return `${years} year${years === 1 ? '' : 's'}`;
}

// Recruiter-only: everyone who applied to this job, with their full details,
// resume, and accept (= schedule interview) / reject actions. Renders nothing
// for anyone other than the recruiter who posted the job.
export function JobResponses({ jobId, postedById, jobTitle }: { jobId: string; postedById: string; jobTitle: string }) {
  const { user, token, loading: authLoading } = useAuth();
  const [applicants, setApplicants] = useState<JobApplicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isOwner = !!user && user.id === postedById;

  useEffect(() => {
    if (!isOwner || !token) return;
    let cancelled = false;
    api.jobs
      .applications(jobId, token)
      .then((data) => {
        if (!cancelled) setApplicants(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load responses.');
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, token, jobId]);

  // Deep links ("View responses", the new-application alert) land on #responses —
  // the section only exists once auth + data are loaded, so scroll then.
  useEffect(() => {
    if (applicants && window.location.hash === '#responses') {
      document.getElementById('responses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [applicants]);

  if (authLoading || !isOwner) return null;

  function replace(next: JobApplicant) {
    setApplicants((prev) => prev?.map((a) => (a.id === next.id ? next : a)) ?? prev);
  }

  const pending = applicants?.filter((a) => a.status === 'APPLIED').length ?? 0;

  return (
    <section id="responses" className="mt-10 scroll-mt-32">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Responses {applicants && <span className="text-ink-muted">({applicants.length})</span>}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Only you can see who applied{pending > 0 ? ` · ${pending} awaiting your decision` : ''}.
          </p>
        </div>
      </div>

      {applicants === null && !error && <ApplicantCardsSkeleton />}
      {error && <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{error}</p>}
      {applicants?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-ink-muted">
          No one has applied yet. You'll get a notification as soon as someone does.
        </p>
      )}

      <div className="space-y-4">
        {applicants?.map((a) => (
          <ApplicantCard key={a.id} applicant={a} jobId={jobId} jobTitle={jobTitle} onUpdated={replace} />
        ))}
      </div>
    </section>
  );
}

// Same shell as ApplicantCard: avatar + name, the details grid, and the action buttons.
function ApplicantCardsSkeleton() {
  return (
    <SkeletonGroup label="Loading responses…" className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            </div>
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, j) => (
              <div key={j}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-1.5 h-4 w-32" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-52 rounded-full" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

function ApplicantCard({
  applicant: a,
  jobId,
  jobTitle,
  onUpdated,
}: {
  applicant: JobApplicant;
  jobId: string;
  jobTitle: string;
  onUpdated: (next: JobApplicant) => void;
}) {
  const { token } = useAuth();
  const { openChat } = useChat();
  const [scheduling, setScheduling] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState<'resume' | 'schedule' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const name = a.fullName || 'Candidate';
  const isRejected = a.status === 'REJECTED';
  const isScheduled = a.status === 'INTERVIEW_SCHEDULED';

  async function viewResume() {
    if (!token || busy) return;
    // Open the tab now, inside the click, so the popup isn't blocked after the fetch.
    const isPdf = a.resumeFileName?.toLowerCase().endsWith('.pdf');
    const tab = isPdf ? window.open('', '_blank') : null;
    setBusy('resume');
    setError(null);
    try {
      const { dataUrl, fileName } = await api.jobs.resume(a.id, token);
      openResume(dataUrl, fileName, tab);
    } catch (err) {
      tab?.close();
      setError(err instanceof ApiError ? err.message : 'Could not open the resume.');
    } finally {
      setBusy(null);
    }
  }

  async function sendInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!token || busy || !date || !time) return;
    const interviewAt = new Date(`${date}T${time}`);
    if (Number.isNaN(interviewAt.getTime()) || interviewAt.getTime() < Date.now()) {
      setError('Pick an interview date and time in the future.');
      return;
    }
    setBusy('schedule');
    setError(null);
    try {
      const { conversationId: _conversationId, ...updated } = await api.jobs.scheduleInterview(
        a.id,
        { interviewAt: interviewAt.toISOString(), interviewDetails: details.trim() || undefined },
        token,
      );
      onUpdated(updated);
      setScheduling(false);
      setNotice(`Interview invite sent to ${name}'s chat.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not schedule the interview.');
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!token || busy) return;
    if (!window.confirm(`Reject ${name} for this job?`)) return;
    setBusy('reject');
    setError(null);
    try {
      onUpdated(await api.jobs.reject(a.id, token));
      setScheduling(false);
      setNotice(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject this application.');
    } finally {
      setBusy(null);
    }
  }

  function startScheduling() {
    if (a.interviewAt) {
      const d = new Date(a.interviewAt);
      setDate(d.toLocaleDateString('en-CA'));
      setTime(d.toTimeString().slice(0, 5));
      setDetails(a.interviewDetails ?? '');
    }
    setNotice(null);
    setError(null);
    setScheduling(true);
  }

  const detailRows: [string, React.ReactNode][] = [
    ['Total experience', experienceLabel(a.totalExperience)],
    ['Current company', a.currentCompany || '—'],
    ['Current post', a.currentDesignation || '—'],
    ['Current salary', a.currentSalary != null ? `${formatInr(a.currentSalary)} /year` : '—'],
    ['Current location', a.currentLocation || '—'],
    ['Can join', a.noticePeriod || '—'],
    ['Address', a.address || '—'],
  ];

  return (
    <article className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${isRejected ? 'opacity-70' : ''}`}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-base font-bold text-brand-ink">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink">{name}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[a.status]}`}>
              {APPLICATION_STATUS_LABELS[a.status]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            {a.email && (
              <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-brand">
                <Mail size={12} /> {a.email}
              </a>
            )}
            {a.phone && (
              <a href={`tel:${a.phone}`} className="flex items-center gap-1 hover:text-brand">
                <Phone size={12} /> {a.phone}
              </a>
            )}
            <span>Applied {postedAgo(a.appliedAt)}</span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2.5 rounded-xl border border-border bg-bg/50 p-4 text-sm sm:grid-cols-2">
        {detailRows.map(([label, value]) => (
          <div key={label} className={label === 'Address' ? 'sm:col-span-2' : undefined}>
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {isScheduled && a.interviewAt && !scheduling && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <CalendarCheck size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Interview: {formatInterviewTime(a.interviewAt)}</p>
            {a.interviewDetails && <p className="mt-0.5 whitespace-pre-line text-xs opacity-90">{a.interviewDetails}</p>}
          </div>
        </div>
      )}

      {scheduling && (
        <form onSubmit={sendInterview} className="mt-4 space-y-3 rounded-xl border border-brand/40 bg-brand-soft/40 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CalendarClock size={15} className="text-brand" /> {isScheduled ? 'Reschedule interview' : 'Schedule interview'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Date *</label>
              <input
                type="date"
                value={date}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Time *</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              rows={2}
              placeholder="Google Meet / Zoom link, office address, or who to ask for"
              className={inputClass}
            />
          </div>
          <p className="text-xs text-ink-muted">The date, time and details are sent straight to {name}'s chat for this job.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!date || !time || busy !== null}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy === 'schedule' ? 'Sending…' : 'Send interview invite'}
            </button>
            <button
              type="button"
              onClick={() => setScheduling(false)}
              className="rounded-full border border-border px-5 py-2 text-sm font-medium text-ink hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {notice && <p className="mt-3 text-sm font-medium text-brand">{notice}</p>}
      {error && <p className="mt-3 text-sm text-accent">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={viewResume}
          disabled={busy !== null || !a.resumeFileName}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          <FileText size={15} /> {busy === 'resume' ? 'Opening…' : 'View resume'}
        </button>
        <button
          type="button"
          onClick={() => openChat({ jobId, candidateId: a.applicantId, title: name, subtitle: `About: ${jobTitle}` })}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          <MessageCircle size={15} /> Chat
        </button>
        {!isRejected && !scheduling && (
          <>
            <button
              type="button"
              onClick={startScheduling}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <UserCheck size={15} /> {isScheduled ? 'Reschedule' : 'Accept & schedule interview'}
            </button>
            <button
              type="button"
              onClick={reject}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-40"
            >
              <UserX size={15} /> {busy === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
