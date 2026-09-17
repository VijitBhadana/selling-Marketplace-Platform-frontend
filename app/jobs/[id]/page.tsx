import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, CalendarDays, Clock, Laptop, MapPin, Users } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cloudes } from '@/lib/cloudes-data';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS, formatSalary, type Job, type JobType } from '@/lib/jobs';
import { JsonLd } from '@/components/json-ld';
import { JobApplyPanel } from '@/components/job-actions';
import { JobResponses } from '@/components/job-responses';
import { breadcrumbJsonLd, pageMetadata, truncate, type JsonLdNode } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';

type Props = { params: { id: string } };

const jobsCloude = cloudes.find((c) => c.jobBoard)!;

async function getJob(id: string): Promise<Job | null> {
  try {
    return await api.jobs.byId(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob(params.id).catch(() => null);
  if (!job) return {};
  const summary = [JOB_TYPE_LABELS[job.jobType], WORK_MODE_LABELS[job.workMode], job.location, formatSalary(job)]
    .filter(Boolean)
    .join(' · ');
  return pageMetadata({
    title: `${job.title} at ${job.companyName}`,
    description: `${summary}. ${truncate(job.responsibilities ?? job.description ?? '', 120)}`,
    path: `/jobs/${job.id}`,
    ogSubtitle: `${job.companyName} · ${summary}`,
  });
}

// Google for Jobs: https://developers.google.com/search/docs/appearance/structured-data/job-posting
const SCHEMA_EMPLOYMENT_TYPE: Partial<Record<JobType, string>> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  INTERNSHIP: 'INTERN',
  CONTRACTUAL: 'CONTRACTOR',
  FREELANCE: 'CONTRACTOR',
};

function jobPostingJsonLd(job: Job): JsonLdNode {
  return {
    '@type': 'JobPosting',
    title: job.title,
    description: [job.description, job.responsibilities].filter(Boolean).join('\n\n') || job.title,
    datePosted: job.createdAt,
    employmentType: SCHEMA_EMPLOYMENT_TYPE[job.jobType] ?? 'OTHER',
    hiringOrganization: { '@type': 'Organization', name: job.companyName },
    jobLocation: job.location
      ? {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: job.location, postalCode: job.pincode ?? undefined, addressCountry: 'IN' },
        }
      : undefined,
    jobLocationType: job.workMode === 'REMOTE' ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: job.workMode === 'REMOTE' ? { '@type': 'Country', name: 'India' } : undefined,
    baseSalary:
      job.salaryMin != null
        ? {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax ?? job.salaryMin,
              unitText: job.salaryPeriod === 'MONTHLY' ? 'MONTH' : 'YEAR',
            },
          }
        : undefined,
    skills: job.skills.join(', ') || undefined,
    experienceRequirements: job.experience ?? undefined,
    url: absoluteUrl(`/jobs/${job.id}`),
  };
}

export default async function JobDetailPage({ params }: Props) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const categoryHref = `/cloudes/${jobsCloude.slug}?category=${job.category.slug}`;
  const applicants = job._count?.applications ?? 0;
  const postedOn = new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: jobsCloude.name, path: `/cloudes/${jobsCloude.slug}` },
    { name: job.category.name, path: categoryHref },
    { name: job.title, path: `/jobs/${job.id}` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={[breadcrumbJsonLd(crumbs), jobPostingJsonLd(job)]} />
      <nav className="mb-4 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/cloudes/${jobsCloude.slug}`} className="hover:text-brand">{jobsCloude.name}</Link>
        <span className="mx-1.5">/</span>
        <Link href={categoryHref} className="hover:text-brand">{job.category.name}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{job.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-brand-ink shadow-card">
                {job.companyName.trim().charAt(0).toUpperCase() || 'J'}
              </span>
              <div className="min-w-0">
                <Link
                  href={categoryHref}
                  className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                >
                  {job.category.name}
                </Link>
                <h1 className="mt-2 font-display text-2xl font-bold text-ink">{job.title}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
                  <Building2 size={14} /> {job.companyName}
                  {job.isStartup && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">Startup</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand">{JOB_TYPE_LABELS[job.jobType]}</span>
              <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-ink-muted">
                <Laptop size={12} /> {WORK_MODE_LABELS[job.workMode]}
              </span>
              {job.experience && (
                <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-ink-muted">
                  <Clock size={12} /> {job.experience}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-ink-muted">
                  <MapPin size={12} /> {job.location}
                  {job.pincode ? ` - ${job.pincode}` : ''}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><CalendarDays size={12} /> Posted {postedOn}</span>
              <span className="flex items-center gap-1"><Users size={12} /> {applicants} applicant{applicants === 1 ? '' : 's'}</span>
            </div>
          </div>

          {job.skills.length > 0 && (
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-base font-bold text-ink">Skills required</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill} className="rounded-lg bg-surface-hover px-3 py-1.5 text-sm text-ink">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {job.responsibilities && (
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-base font-bold text-ink">Roles & responsibilities</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{job.responsibilities}</p>
            </section>
          )}

          {job.description && (
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-base font-bold text-ink">About the job</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{job.description}</p>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <JobApplyPanel job={job} />
        </aside>
      </div>

      <JobResponses jobId={job.id} postedById={job.postedBy.id} jobTitle={job.title} />
    </div>
  );
}
