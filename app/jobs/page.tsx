import Link from 'next/link';
import { Briefcase, MapPin, Clock, IndianRupee, PhoneCall } from 'lucide-react';
import { sampleJobs } from '@/lib/sample-listings';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Jobs Near You — IT, Office & Skilled Trade Jobs',
  description:
    'Browse IT, operational and skilled-trade jobs near you on DukanCloude. Apply in one click or call the employer directly.',
  path: '/jobs',
});

export default function JobsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Briefcase size={26} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Jobs Cloude</h1>
            <p className="mt-1 text-sm text-ink-muted">Categorised job listings across skill levels — apply directly or call HR.</p>
          </div>
        </div>
        <Link href="/post-ad?cloude=jobs" className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90">
          Post a job
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {sampleJobs.map((job) => (
          <div key={job.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">{job.title}</h2>
              <p className="text-sm text-ink-muted">{job.company}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><IndianRupee size={12} /> {job.salary}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">{job.type}</span>
                <span>{job.experience}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {job.postedAgo}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:opacity-90">
                Quick apply
              </button>
              <button className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-hover">
                <PhoneCall size={14} /> Call HR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
