'use client';

import { useState } from 'react';
import { Building2, Check, IndianRupee, ListChecks, Plus, X } from 'lucide-react';
import {
  EXPERIENCE_OPTIONS,
  JOB_TYPE_LABELS,
  JOB_TYPE_OPTIONS,
  WORK_MODE_LABELS,
  WORK_MODE_OPTIONS,
  formatSalary,
  type JobType,
  type SalaryPeriod,
  type WorkMode,
} from '@/lib/jobs';

// Post Your Ad, Jobs & Freelancing Cloude: the job replaces the shop, and there's
// no photo step — Category → Job details → Skills & role → Location → Review.
export const JOB_STEPS = ['Category', 'Job details', 'Skills & role', 'Location', 'Review'] as const;

export type JobDraft = {
  title: string;
  companyName: string;
  isStartup: boolean;
  jobType: JobType | '';
  workMode: WorkMode | '';
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: SalaryPeriod;
  experience: string;
  skills: string[];
  responsibilities: string;
  description: string;
};

export const EMPTY_JOB_DRAFT: JobDraft = {
  title: '',
  companyName: '',
  isStartup: false,
  jobType: '',
  workMode: '',
  salaryMin: '',
  salaryMax: '',
  salaryPeriod: 'YEARLY',
  experience: '',
  skills: [],
  responsibilities: '',
  description: '',
};

const MAX_SKILLS = 25;

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

function parsedSalary(d: JobDraft) {
  return {
    salaryMin: d.salaryMin.trim() === '' ? null : Number(d.salaryMin),
    salaryMax: d.salaryMax.trim() === '' ? null : Number(d.salaryMax),
    salaryPeriod: d.salaryPeriod,
  };
}

function salaryError(d: JobDraft): string | null {
  const { salaryMin: min, salaryMax: max } = parsedSalary(d);
  if (min != null && (!Number.isFinite(min) || min < 0)) return 'Enter a valid salary amount.';
  if (max != null && (!Number.isFinite(max) || (min != null && max < min))) {
    return 'Maximum salary must be at least the minimum.';
  }
  return null;
}

export function isJobDetailsValid(d: JobDraft) {
  return (
    d.title.trim().length > 0 &&
    d.companyName.trim().length > 0 &&
    !!d.jobType &&
    !!d.workMode &&
    !!d.experience &&
    d.salaryMin.trim() !== '' &&
    !salaryError(d)
  );
}

export function isJobSkillsValid(d: JobDraft) {
  return d.skills.length > 0 && d.responsibilities.trim().length > 0;
}

export function jobDraftPayload(d: JobDraft, categoryId: string, city: string, pincode: string) {
  const { salaryMin, salaryMax } = parsedSalary(d);
  return {
    categoryId,
    title: d.title.trim(),
    companyName: d.companyName.trim(),
    isStartup: d.isStartup,
    jobType: d.jobType,
    workMode: d.workMode,
    salaryMin: Math.round(salaryMin ?? 0),
    salaryMax: salaryMax != null ? Math.round(salaryMax) : undefined,
    salaryPeriod: d.salaryPeriod,
    experience: d.experience,
    skills: d.skills,
    responsibilities: d.responsibilities.trim(),
    description: d.description.trim() || undefined,
    location: city.trim(),
    pincode: pincode.trim() || undefined,
  };
}

export function jobReviewRows(d: JobDraft): [string, string][] {
  return [
    ['Job title', d.title],
    ['Company', `${d.companyName}${d.isStartup ? ' (startup)' : ''}`],
    ['Job type', d.jobType ? JOB_TYPE_LABELS[d.jobType] : '—'],
    ['Work mode', d.workMode ? WORK_MODE_LABELS[d.workMode] : '—'],
    ['Experience', d.experience || '—'],
    ['Salary / package', formatSalary(parsedSalary(d))],
    ['Skills', d.skills.join(', ') || '—'],
  ];
}

function FieldLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">{children}</span>
      {aside}
    </div>
  );
}

function Required() {
  return <span className="text-accent">*</span>;
}

function Pills<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { value: T; label: string }[];
  value: T | '';
  onSelect: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            aria-pressed={selected}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
              selected
                ? 'border-brand bg-brand text-brand-ink shadow-[0_6px_16px_-8px_rgb(var(--brand)/0.8)]'
                : 'border-border bg-bg text-ink-muted hover:border-brand/60 hover:text-ink'
            }`}
          >
            {selected && <Check size={14} strokeWidth={3} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type StepProps = { draft: JobDraft; onChange: (patch: Partial<JobDraft>) => void };

export function JobDetailsStep({ draft, onChange }: StepProps) {
  const error = salaryError(draft);
  const isMonthly = draft.salaryPeriod === 'MONTHLY';

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel aside={<span className="text-xs text-ink-muted">{draft.title.length}/120</span>}>
            Job title <Required />
          </FieldLabel>
          <input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value.slice(0, 120) })}
            placeholder="e.g. Full Stack Web Developer"
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>
            <Building2 size={15} className="text-brand" /> Company / startup name <Required />
          </FieldLabel>
          <input
            value={draft.companyName}
            onChange={(e) => onChange({ companyName: e.target.value.slice(0, 120) })}
            placeholder="e.g. Acme Technologies"
            className={inputClass}
          />
        </div>
      </div>

      <label className="-mt-1 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-bg px-4 py-3 transition-colors hover:border-brand/50">
        <span>
          <span className="block text-sm font-medium text-ink">This is a startup</span>
          <span className="block text-xs text-ink-muted">Tick this if your company is an early-stage startup.</span>
        </span>
        <span className="relative inline-flex h-6 w-11 shrink-0">
          <input
            type="checkbox"
            checked={draft.isStartup}
            onChange={(e) => onChange({ isStartup: e.target.checked })}
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-border transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      <div className="rounded-2xl border border-border p-4 sm:p-5">
        <div className="space-y-5">
          <div>
            <FieldLabel>
              Job type <Required />
            </FieldLabel>
            <Pills
              options={JOB_TYPE_OPTIONS}
              value={draft.jobType}
              onSelect={(jobType) =>
                // Internships pay a monthly stipend — switch the salary unit if nothing's been typed yet.
                onChange(jobType === 'INTERNSHIP' && !draft.salaryMin ? { jobType, salaryPeriod: 'MONTHLY' } : { jobType })
              }
            />
          </div>

          <div className="border-t border-border pt-5">
            <FieldLabel>
              Work mode <Required />
            </FieldLabel>
            <Pills options={WORK_MODE_OPTIONS} value={draft.workMode} onSelect={(workMode) => onChange({ workMode })} />
          </div>

          <div className="border-t border-border pt-5">
            <FieldLabel>
              Experience required <Required />
            </FieldLabel>
            <Pills
              options={EXPERIENCE_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={draft.experience}
              onSelect={(experience) => onChange({ experience })}
            />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel
          aside={
            <div className="flex rounded-xl border border-border bg-bg p-1 text-xs font-semibold">
              {(['MONTHLY', 'YEARLY'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => onChange({ salaryPeriod: period })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    draft.salaryPeriod === period ? 'bg-brand text-brand-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {period === 'MONTHLY' ? 'Per month' : 'Per year'}
                </button>
              ))}
            </div>
          }
        >
          <IndianRupee size={15} className="text-brand" /> Salary / package offered <Required />
        </FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
            <input
              type="number"
              min={0}
              value={draft.salaryMin}
              onChange={(e) => onChange({ salaryMin: e.target.value })}
              placeholder={isMonthly ? 'Minimum, e.g. 15000' : 'Minimum, e.g. 400000'}
              aria-label="Minimum salary"
              className={`${inputClass} pl-8`}
            />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
            <input
              type="number"
              min={0}
              value={draft.salaryMax}
              onChange={(e) => onChange({ salaryMax: e.target.value })}
              placeholder="Maximum (optional)"
              aria-label="Maximum salary"
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-xs ${
            error ? 'bg-accent/10 font-medium text-accent' : draft.salaryMin ? 'bg-brand-soft/60 text-ink' : 'text-ink-muted'
          }`}
        >
          {error ??
            (draft.salaryMin
              ? `Shown to candidates as: ${formatSalary(parsedSalary(draft))}`
              : draft.jobType === 'INTERNSHIP'
                ? 'For internships, enter the monthly stipend.'
                : 'Candidates see this on the job card.')}
        </p>
      </div>
    </>
  );
}

export function JobSkillsStep({ draft, onChange }: StepProps) {
  const [skillInput, setSkillInput] = useState('');

  function addSkills(raw: string) {
    const incoming = raw
      .split(',')
      .map((s) => s.trim().slice(0, 50))
      .filter(Boolean);
    if (incoming.length === 0) return;
    const merged = [...draft.skills];
    for (const skill of incoming) {
      if (merged.length >= MAX_SKILLS) break;
      if (!merged.some((m) => m.toLowerCase() === skill.toLowerCase())) merged.push(skill);
    }
    onChange({ skills: merged });
    setSkillInput('');
  }

  return (
    <>
      <div>
        <FieldLabel
          aside={
            <span className={`text-xs ${draft.skills.length >= MAX_SKILLS ? 'font-semibold text-accent' : 'text-ink-muted'}`}>
              {draft.skills.length}/{MAX_SKILLS} skills
            </span>
          }
        >
          Skills required <Required />
        </FieldLabel>
        <div className="flex gap-2">
          <div className="flex min-h-[48px] flex-1 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-bg px-2.5 py-2 transition focus-within:border-brand focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand/10">
            {draft.skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 rounded-lg bg-brand-soft py-1 pl-2.5 pr-1 text-sm font-medium text-brand"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => onChange({ skills: draft.skills.filter((s) => s !== skill) })}
                  aria-label={`Remove ${skill}`}
                  className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-brand/15"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addSkills(skillInput);
                } else if (e.key === 'Backspace' && !skillInput && draft.skills.length > 0) {
                  onChange({ skills: draft.skills.slice(0, -1) });
                }
              }}
              placeholder={draft.skills.length ? 'Add another…' : 'Type a skill and press Enter — e.g. React'}
              disabled={draft.skills.length >= MAX_SKILLS}
              className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1 text-sm text-ink outline-none placeholder:text-ink-muted/70 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="button"
            onClick={() => addSkills(skillInput)}
            disabled={!skillInput.trim() || draft.skills.length >= MAX_SKILLS}
            className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-ink disabled:border-border disabled:bg-transparent disabled:text-ink-muted disabled:opacity-60 disabled:hover:bg-transparent"
          >
            <Plus size={15} /> Add
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-muted">Press Enter or type a comma to add each skill.</p>
      </div>

      <div>
        <FieldLabel aside={<span className="text-xs text-ink-muted">{draft.responsibilities.length}/5000</span>}>
          <ListChecks size={15} className="text-brand" /> Roles & responsibilities <Required />
        </FieldLabel>
        <textarea
          value={draft.responsibilities}
          onChange={(e) => onChange({ responsibilities: e.target.value.slice(0, 5000) })}
          rows={6}
          placeholder={'One per line, e.g.\nBuild and maintain REST APIs\nReview pull requests\nWork with the design team on new features'}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div>
        <FieldLabel aside={<span className="text-xs text-ink-muted">{draft.description.length}/4096</span>}>
          About the job <span className="font-normal text-ink-muted">(optional)</span>
        </FieldLabel>
        <textarea
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value.slice(0, 4096) })}
          rows={4}
          placeholder="Team, perks, working hours, hiring process…"
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>
    </>
  );
}
