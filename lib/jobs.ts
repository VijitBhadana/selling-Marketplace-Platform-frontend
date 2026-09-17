// Jobs & Freelancing Cloude — shared types, option labels and formatters.
// Jobs here are posted straight into a category (no shop in between).

export type JobType = 'FULL_TIME' | 'INTERNSHIP' | 'CONTRACTUAL' | 'PART_TIME' | 'FREELANCE' | 'FIELD_JOB' | 'WORK_FROM_HOME';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type SalaryPeriod = 'MONTHLY' | 'YEARLY';
export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'INTERVIEW_SCHEDULED';

export type Job = {
  id: string;
  title: string;
  companyName: string;
  isStartup: boolean;
  description: string | null;
  responsibilities: string | null;
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod;
  location: string | null;
  pincode: string | null;
  jobType: JobType;
  workMode: WorkMode;
  experience: string | null;
  isClosed: boolean;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  postedBy: { id: string; name: string };
  _count?: { applications: number };
};

/** The signed-in candidate's own application to a job (drives the card's Apply button state). */
export type MyApplication = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  interviewAt: string | null;
  appliedAt: string;
};

/** An applicant as the recruiter sees them (the resume itself is fetched on demand). */
export type JobApplicant = {
  id: string;
  jobId: string;
  applicantId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  totalExperience: number | null;
  currentCompany: string | null;
  currentDesignation: string | null;
  currentSalary: number | null;
  currentLocation: string | null;
  noticePeriod: string | null;
  resumeFileName: string | null;
  status: ApplicationStatus;
  interviewAt: string | null;
  interviewDetails: string | null;
  appliedAt: string;
};

// Offered in the post form. (The enum also carries the legacy FIELD_JOB / WORK_FROM_HOME values.)
export const JOB_TYPE_OPTIONS: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACTUAL', label: 'Contractual' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'FREELANCE', label: 'Freelance' },
];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  INTERNSHIP: 'Internship',
  CONTRACTUAL: 'Contractual',
  PART_TIME: 'Part-time',
  FREELANCE: 'Freelance',
  FIELD_JOB: 'Field job',
  WORK_FROM_HOME: 'Work from home',
};

export const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
];

export const WORK_MODE_LABELS: Record<WorkMode, string> = { ONSITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };

export const EXPERIENCE_OPTIONS = ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'];

export const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  'Within 15 days',
  'Within 30 days',
  'Within 60 days',
  'Within 90 days',
  'More than 90 days',
];

export const DATE_POSTED_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '1', label: 'Last 24 hours' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'New',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
};

const inr = new Intl.NumberFormat('en-IN');

export function formatInr(n: number) {
  return `₹${inr.format(n)}`;
}

function lakhs(n: number) {
  return (n / 100000).toFixed(2).replace(/\.?0+$/, '');
}

/** "₹4.5 – 6 LPA", "₹15,000 – ₹20,000 /month", ... */
export function formatSalary(job: Pick<Job, 'salaryMin' | 'salaryMax' | 'salaryPeriod'>) {
  const { salaryMin: min, salaryMax: max, salaryPeriod } = job;
  if (min == null) return 'Not disclosed';
  const hasRange = max != null && max !== min;

  if (salaryPeriod === 'YEARLY' && min >= 100000) {
    return hasRange ? `₹${lakhs(min)} – ${lakhs(max!)} LPA` : `₹${lakhs(min)} LPA`;
  }
  const unit = salaryPeriod === 'MONTHLY' ? '/month' : '/year';
  return hasRange ? `${formatInr(min)} – ${formatInr(max!)} ${unit}` : `${formatInr(min)} ${unit}`;
}

export function postedAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isNewJob(iso: string) {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}

export function formatInterviewTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Resume upload / viewing ────────────────────────────────────────────────

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ACCEPT = '.pdf,.doc,.docx';

const RESUME_MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function resumeMimeType(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return RESUME_MIME_BY_EXT[ext] ?? null;
}

// Reads a resume as a base64 data URL. The MIME type is taken from the extension
// because some browsers report an empty `file.type` for .doc/.docx.
export function resumeToDataUrl(file: File): Promise<string> {
  const mime = resumeMimeType(file.name);
  return new Promise((resolve, reject) => {
    if (!mime) return reject(new Error('Upload your resume as a PDF, DOC or DOCX file.'));
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(`data:${mime};base64,${result.slice(result.indexOf(',') + 1)}`);
    };
    reader.onerror = () => reject(new Error('Could not read the resume file.'));
    reader.readAsDataURL(file);
  });
}

// Browsers block navigating a tab straight to a data: URL, so go through a blob.
// PDFs open in a new tab — pass `tab` when it was opened synchronously in the click
// handler (before the resume was fetched), otherwise popup blockers may stop it.
// Word files are downloaded.
export function openResume(dataUrl: string, fileName: string, tab?: Window | null) {
  const [header, base64 = ''] = dataUrl.split(',');
  const mime = header.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));

  if (mime === 'application/pdf') {
    if (tab) tab.location.href = url;
    else window.open(url, '_blank');
  } else {
    tab?.close();
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
