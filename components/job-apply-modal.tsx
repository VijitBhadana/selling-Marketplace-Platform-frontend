'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Check, FileText, Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import {
  NOTICE_PERIOD_OPTIONS,
  RESUME_ACCEPT,
  RESUME_MAX_BYTES,
  resumeMimeType,
  resumeToDataUrl,
  type Job,
  type MyApplication,
} from '@/lib/jobs';

const inputClass =
  'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}

export function JobApplyModal({
  job,
  onClose,
  onApplied,
}: {
  job: Pick<Job, 'id' | 'title' | 'companyName'>;
  onClose: () => void;
  onApplied: (application: MyApplication) => void;
}) {
  const { user, token } = useAuth();
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalExperience, setTotalExperience] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  function pickResume(file: File | undefined) {
    if (!file) return;
    if (!resumeMimeType(file.name)) {
      setError('Upload your resume as a PDF, DOC or DOCX file.');
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setError('Resume must be 5 MB or smaller.');
      return;
    }
    setError(null);
    setResume(file);
  }

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    phone.trim() &&
    address.trim() &&
    totalExperience.trim() !== '' &&
    currentLocation.trim() &&
    noticePeriod &&
    resume;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const resumeDataUrl = await resumeToDataUrl(resume!);
      const application = await api.jobs.apply(
        job.id,
        {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          totalExperience: Number(totalExperience),
          currentCompany: currentCompany.trim() || undefined,
          currentDesignation: currentDesignation.trim() || undefined,
          currentSalary: currentSalary.trim() ? Math.round(Number(currentSalary)) : undefined,
          currentLocation: currentLocation.trim(),
          noticePeriod,
          resumeDataUrl,
          resumeFileName: resume!.name,
        },
        token,
      );
      onApplied({
        id: application.id,
        jobId: application.jobId,
        status: application.status,
        interviewAt: application.interviewAt,
        appliedAt: application.appliedAt,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not send your application.');
    } finally {
      setSubmitting(false);
    }
  }

  // Portalled to <body>: job cards use hover transforms, which would otherwise
  // become the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onMouseDown={() => !submitting && onClose()} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Apply for ${job.title}`}
        className="relative flex max-h-[92vh] w-full max-w-2xl animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ animationDuration: '0.22s' }}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Briefcase size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">Apply for {job.title}</p>
            <p className="truncate text-xs text-ink-muted">{job.companyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Check size={26} />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">Application sent!</h2>
            <p className="max-w-sm text-sm text-ink-muted">
              {job.companyName} has been notified. If they shortlist you, your interview date and time will arrive in your chat
              for this job.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Personal details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value.slice(0, 100))} className={inputClass} />
                  </Field>
                  <Field label="Email" required>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 120))} className={inputClass} />
                  </Field>
                  <Field label="Phone" required>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                      placeholder="e.g. 98765 43210"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Current location" required>
                    <input
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value.slice(0, 100))}
                      placeholder="City you live in now"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Address" required>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                    rows={2}
                    className={inputClass}
                  />
                </Field>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Experience</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Total experience (years)" required>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={0.5}
                      value={totalExperience}
                      onChange={(e) => setTotalExperience(e.target.value)}
                      placeholder="0 if you're a fresher"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="How soon can you join?" required>
                    <select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      {NOTICE_PERIOD_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Current company / job">
                    <input
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value.slice(0, 120))}
                      placeholder="Leave blank if not working"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Current post / designation">
                    <input
                      value={currentDesignation}
                      onChange={(e) => setCurrentDesignation(e.target.value.slice(0, 120))}
                      placeholder="e.g. Frontend Developer"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Current salary (₹ per year)">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={currentSalary}
                      onChange={(e) => setCurrentSalary(e.target.value)}
                      placeholder="e.g. 450000"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">
                  Resume <span className="text-accent">*</span>
                </h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={RESUME_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    pickResume(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-left transition-colors hover:border-brand"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    {resume ? <FileText size={18} /> : <Upload size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{resume ? resume.name : 'Upload your resume'}</span>
                    <span className="block text-xs text-ink-muted">
                      {resume ? `${(resume.size / 1024).toFixed(0)} KB · click to replace` : 'PDF, DOC or DOCX — up to 5 MB'}
                    </span>
                  </span>
                </button>
              </section>
            </div>

            {error && <p className="border-t border-border px-5 py-2.5 text-sm text-accent">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-hover disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? 'Sending…' : 'Submit application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
