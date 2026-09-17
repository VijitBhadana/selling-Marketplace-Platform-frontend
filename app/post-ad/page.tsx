'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Hash,
  ImagePlus,
  Lightbulb,
  Loader2,
  LocateFixed,
  Lock,
  MapPin,
  PartyPopper,
  Pencil,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  X,
  Zap,
} from 'lucide-react';
import { cloudes } from '@/lib/cloudes-data';
import { Icon } from '@/components/icon';
import { Stepper } from '@/components/stepper';
import {
  EMPTY_JOB_DRAFT,
  JOB_STEPS,
  JobDetailsStep,
  JobSkillsStep,
  isJobDetailsValid,
  isJobSkillsValid,
  jobDraftPayload,
  jobReviewRows,
  type JobDraft,
} from '@/components/job-post-steps';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { fileToResizedDataUrl, withImageParams } from '@/lib/image-utils';
import { Skeleton, SkeletonGroup } from '@/components/skeleton';

const MAX_PHOTOS = 12;

type PhotoDraft = { file: File; previewUrl: string };

const STEPS = ['Category', 'Details', 'Photos', 'Location', 'Review'] as const;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

// Heading + helper line shown at the top of the form card, per step.
const AD_STEP_COPY = [
  { title: 'Choose a Cloude, then a category', hint: 'This decides where buyers will find your ad.' },
  { title: 'Tell buyers about your ad', hint: 'A clear title and an honest description bring more enquiries.' },
  { title: 'Upload photos', hint: `Up to ${MAX_PHOTOS} photos. First photo becomes the cover image.` },
  { title: 'Confirm location', hint: 'Buyers around you discover your ad first.' },
  { title: 'Review & verify', hint: 'Check everything once — then it goes live.' },
];

const JOB_STEP_COPY = [
  { title: 'Choose a Cloude, then a category', hint: 'This decides where candidates will find your job.' },
  { title: 'Job details', hint: 'The basics candidates see on the job card.' },
  { title: 'Skills & role', hint: 'What the candidate should know and will be doing.' },
  { title: 'Job location', hint: "Where the job is based — for remote jobs, the company's city." },
  { title: 'Review & verify', hint: 'Check everything once — then it goes live.' },
];

const AD_TIPS = [
  ['Pick the most specific sub-section — buyers browse by category.', 'A shop name makes your card look more trustworthy.'],
  ['Mention brand, condition, experience or timings.', 'Keep the title short and specific.'],
  ['Bright, well-lit photos get far more enquiries.', 'Your first photo is the cover — make it your best one.'],
  ['“Use current location” fills city & pincode instantly.', 'Double-check the pincode for accurate local reach.'],
  ['Check the title and location one last time.', 'You can post more ads anytime.'],
];

const JOB_TIPS = [
  ['Pick the category candidates would search in.', 'Only seller / recruiter accounts can post jobs.'],
  ['A specific title (e.g. “React Developer”) attracts better applicants.', 'Showing a salary range builds trust.'],
  ['Keep skills short — “React”, “Excel”, “Tally”.', 'Write one responsibility per line.'],
  ["For remote roles, use the company's city."],
  ["You'll get a notification every time someone applies."],
];

function PostAdForm() {
  const { user, token, loading, requireAuth } = useAuth();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [cloudeSlug, setCloudeSlug] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // Financing Cloude takes both shops and job posts, so the seller says which one this is.
  // (Jobs & Freelancing is jobs-only, and every other Cloude is shops-only.)
  const [postType, setPostType] = useState<'SHOP' | 'JOB'>('SHOP');
  // Jobs & Freelancing Cloude: a job is posted straight into the category instead of a shop.
  const [jobDraft, setJobDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT);
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PhotoDraft[]>([]);
  photosRef.current = photos;

  // Uses the browser's native geolocation permission prompt (the same "Allow
  // location access?" dialog phones/laptops show) then reverse-geocodes the
  // coordinates to a city + pincode and fills them in immediately.
  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setLocationError('Location isn\'t supported in this browser — enter your city manually.');
      return;
    }
    setLocationError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();
          const addr = data?.address ?? {};
          const detectedCity: string = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.county || '';
          const detectedPincode: string = addr.postcode || '';

          if (detectedCity) setCity(detectedCity);
          if (detectedPincode) setPincode(detectedPincode);
          if (!detectedCity) setLocationError('Could not determine your city from your location — please enter it manually.');
        } catch {
          setLocationError('Could not detect your location — please enter it manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — please enter your city manually.'
            : 'Could not get your location — please enter it manually.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/')).slice(0, room);
    const drafts = picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...drafts]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  // Release any remaining blob URLs when the form is left.
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // Deep-link support: /post-ad?cloude=shopping&category=hardware — used by the
  // "Post in {Cloude}" and "be the first to post" CTAs across the site.
  useEffect(() => {
    const c = searchParams.get('cloude');
    const cat = searchParams.get('category');
    if (c && cloudes.some((cl) => cl.slug === c)) setCloudeSlug(c);
    if (cat) setCategorySlug(cat);
    // "Post a job" links from a Cloude that takes both land here with ?post=job.
    if (searchParams.get('post') === 'job') setPostType('JOB');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cloude = cloudes.find((c) => c.slug === cloudeSlug);
  const category = cloude?.categories.find((c) => c.slug === categorySlug);

  // Jobs-only Cloude, or a Cloude that takes both where the seller chose "a job".
  const canChoosePostType = !!cloude?.jobPosts && !cloude?.jobBoard;
  const isJobPost = !!cloude?.jobBoard || (canChoosePostType && postType === 'JOB');
  const steps = isJobPost ? JOB_STEPS : STEPS;
  // Recruiters post jobs from seller accounts; buyer accounts are the job seekers.
  const canPostJobs = user?.role === 'SELLER' || user?.role === 'ADMIN';

  function updateJobDraft(patch: Partial<JobDraft>) {
    setJobDraft((d) => ({ ...d, ...patch }));
  }

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!categorySlug && (!isJobPost || canPostJobs);
      case 1: return isJobPost ? isJobDetailsValid(jobDraft) : title.trim().length > 0 && description.trim().length > 0;
      case 2: return isJobPost ? isJobSkillsValid(jobDraft) : true; // photos optional for services per spec
      case 3: return city.trim().length > 0;
      default: return true;
    }
  }, [step, categorySlug, title, description, city, isJobPost, canPostJobs, jobDraft]);

  useEffect(() => {
    if (!loading && !user) requireAuth(undefined, 'post-ad');
  }, [loading, user, requireAuth]);

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-card sm:px-10">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-8 ring-brand-soft/40">
            <Lock size={26} />
          </span>
          <h1 className="relative mt-6 font-display text-2xl font-bold text-ink">Log in to post your ad</h1>
          <p className="relative mt-2 text-sm text-ink-muted">
            You need a DukanCloude account before you can list something for sale, service, or booking.
          </p>
          <button
            type="button"
            onClick={() => requireAuth(undefined, 'post-ad')}
            className="relative mt-7 inline-flex items-center gap-1.5 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-brand-ink shadow-[0_10px_24px_-10px_rgb(var(--brand)/0.8)] transition-transform hover:-translate-y-0.5"
          >
            Log in to continue <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  if (published && isJobPost) {
    return (
      <SuccessCard
        title="Your job is live!"
        body={
          <>
            "{jobDraft.title}" at <span className="font-semibold text-ink">{jobDraft.companyName}</span> is now listed under{' '}
            {cloude?.name} → {category?.name}. You'll get a notification every time someone applies.
          </>
        }
      >
        {postedJobId && (
          <Link href={`/jobs/${postedJobId}`} className={primaryCta}>
            View your job <ArrowRight size={15} />
          </Link>
        )}
        {cloude && category && (
          <Link href={`/cloudes/${cloude.slug}?category=${category.slug}`} className={secondaryCta}>
            See it in {category.name}
          </Link>
        )}
      </SuccessCard>
    );
  }

  if (published) {
    return (
      <SuccessCard
        title="Your ad is live!"
        body={
          <>
            "{title}" has been published under {cloude?.name} → {category?.name}
            {shopName.trim() ? <> as <span className="font-semibold text-ink">{shopName.trim()}</span></> : null}. Buyers can now find and contact you.
          </>
        }
      >
        {cloude && category && (
          <Link href={`/cloudes/${cloude.slug}?category=${category.slug}`} className={primaryCta}>
            View your shop card <ArrowRight size={15} />
          </Link>
        )}
        <a href="/" className={secondaryCta}>
          Back to home
        </a>
      </SuccessCard>
    );
  }

  async function handlePublish() {
    if (!cloude || !category || submitting || !token) return;
    setSubmitting(true);
    setPublishError(null);

    try {
      // The backend/DB is the only source of truth — every visitor's browser reads
      // shops from there, linked to the seller who posted them. No more local-only
      // "demo" fallback: if this fails, the seller sees the real error and can
      // retry, instead of a fake success that never actually got saved.
      const remoteCloude = await api.cloudes.bySlug(cloude.slug);
      const remoteCategory = remoteCloude?.categories?.find((c: any) => c.slug === category.slug);
      if (!remoteCloude?.id || !remoteCategory?.id) {
        throw new Error("This category couldn't be found on the server — go back and pick it again.");
      }

      // Jobs & Freelancing: the job itself is the post — no shop, no photos.
      if (isJobPost) {
        const job = await api.jobs.create(jobDraftPayload(jobDraft, remoteCategory.id, city, pincode), token);
        setPostedJobId(job.id);
        setPublished(true);
        return;
      }

      const matchedGroup = cloude.groups?.find((g) => g.items.some((it) => it.slug === category.slug));
      const stockImage = matchedGroup?.image ?? cloude.groups?.[0]?.image ?? FALLBACK_IMAGE;
      const image = photos[0] ? await fileToResizedDataUrl(photos[0].file).catch(() => stockImage) : stockImage;

      await api.listings.create(
        {
          cloudeId: remoteCloude.id,
          categoryId: remoteCategory.id,
          title: title.trim(),
          description: description.trim(),
          shopName: shopName.trim() || undefined,
          priceType: 'CONTACT_FOR_PRICE',
          city: city.trim(),
          pincode: pincode.trim() || undefined,
          images: [image],
        },
        token,
      );
      setPublished(true);
    } catch (err) {
      setPublishError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : `Could not publish your ${isJobPost ? 'job' : 'shop'} — please try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Presentation-only values (nothing below feeds back into the form state) ----
  const cloudeShortName = cloude?.name.replace(' Cloude', '');
  const stepCopy = (isJobPost ? JOB_STEP_COPY : AD_STEP_COPY)[step];
  const tips = (isJobPost ? JOB_TIPS : AD_TIPS)[step] ?? [];
  const previewGroup =
    cloude?.groups?.find((g) => g.items.some((it) => it.slug === categorySlug)) ?? cloude?.groups?.[0];
  const previewImage = photos[0]?.previewUrl ?? withImageParams(previewGroup?.image ?? FALLBACK_IMAGE, 'w=640&q=70&auto=format&fit=crop');
  const blockedHint = (() => {
    if (canProceed) return null;
    switch (step) {
      case 0: return !categorySlug ? 'Pick a category to continue' : 'A seller account is needed to post jobs';
      case 1: return 'Fill in the required fields to continue';
      case 2: return 'Add at least one skill and the responsibilities';
      case 3: return 'Enter your city to continue';
      default: return null;
    }
  })();

  return (
    <div className="pb-16">
      {/* Page header */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-6 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgb(var(--border))_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-14 pt-8 sm:px-6 sm:pt-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles size={12} /> Free listing · live in about 2 minutes
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {isJobPost ? 'Post a job' : 'Post your ad'}
            </h1>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">Pick a category first — the form adapts to what you're posting.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: ShieldCheck, label: 'OTP-verified sellers' },
              { icon: MapPin, label: 'Location-based reach' },
              { icon: Zap, label: 'Free to post' },
            ].map(({ icon: I, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg/70 px-3 py-1.5 text-xs font-medium text-ink-muted backdrop-blur"
              >
                <I size={13} className="text-brand" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-8 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
        {/* Sidebar: progress, live preview, tips */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
            <div className="lg:hidden">
              <Stepper steps={steps} current={step} onStepClick={setStep} />
            </div>
            <div className="hidden lg:block">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">Your progress</p>
              <Stepper steps={steps} current={step} onStepClick={setStep} orientation="vertical" />
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-card lg:block">
            <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Live preview</p>
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" /> Live
              </span>
            </div>
            {isJobPost ? (
              <div className="mx-4 mb-4 rounded-xl border border-border bg-bg p-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Briefcase size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${jobDraft.title ? 'text-ink' : 'text-ink-muted/70'}`}>
                      {jobDraft.title || 'Job title'}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{jobDraft.companyName || 'Company name'}</p>
                  </div>
                </div>
                {jobDraft.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {jobDraft.skills.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">{s}</span>
                    ))}
                    {jobDraft.skills.length > 4 && (
                      <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">+{jobDraft.skills.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5 text-[11px] text-ink-muted">
                  {category && <span className="font-medium text-brand">{category.name}</span>}
                  <span className="flex items-center gap-1"><MapPin size={11} /> {city || 'City'}</span>
                </div>
              </div>
            ) : (
              <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-border bg-bg">
                <div className="relative aspect-[16/10] bg-brand-soft">
                  {cloude ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-brand/60">
                      <Camera size={28} />
                    </div>
                  )}
                  {cloude && !photos[0] && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Default cover
                    </span>
                  )}
                  {photos.length > 1 && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                      +{photos.length - 1} photos
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {shopName.trim() && (
                    <p className="mb-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-brand">
                      <Store size={11} /> {shopName.trim()}
                    </p>
                  )}
                  <p className={`line-clamp-2 text-sm font-semibold ${title ? 'text-ink' : 'text-ink-muted/70'}`}>
                    {title || 'Your ad title'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                    {category && <span className="font-medium text-ink">{category.name}</span>}
                    <span className="flex items-center gap-1"><MapPin size={11} /> {city || 'City'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {tips.length > 0 && (
            <div className="hidden rounded-2xl border border-dashed border-border p-4 lg:block">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Lightbulb size={14} className="text-accent" /> Quick tips
              </p>
              <ul className="space-y-1.5">
                {tips.map((t) => (
                  <li key={t} className="flex gap-2 text-xs leading-relaxed text-ink-muted">
                    <Check size={12} className="mt-0.5 shrink-0 text-brand" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Form card */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <header className="border-b border-border bg-gradient-to-r from-brand-soft/60 via-surface to-surface px-5 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
              {step === 4 ? (
                <span className="flex items-center gap-2"><Sparkles size={18} className="text-brand" /> {stepCopy.title}</span>
              ) : (
                stepCopy.title
              )}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{stepCopy.hint}</p>
          </header>

          <div className="px-5 py-6 sm:px-7">
            {/* Selected category breadcrumb (steps 2–4) */}
            {step >= 1 && step <= 3 && cloude && (
              <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-2 py-1 font-semibold text-brand">
                  <Icon name={cloude.icon} size={13} /> {cloudeShortName}
                </span>
                <ChevronRight size={14} />
                <span className="font-medium text-ink">{category?.name}</span>
                {!isJobPost && shopName.trim() && (
                  <>
                    <ChevronRight size={14} />
                    <span className="flex items-center gap-1 font-medium text-ink"><Store size={12} /> {shopName.trim()}</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-brand transition-colors hover:bg-brand-soft"
                >
                  <Pencil size={12} /> Change
                </button>
              </div>
            )}

            {/* Step 0: Category */}
            {step === 0 && (
              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {cloudes.map((c) => {
                    const selected = cloudeSlug === c.slug;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => { setCloudeSlug(c.slug); setCategorySlug(null); setPostType('SHOP'); }}
                        aria-pressed={selected}
                        className={`group relative flex flex-col items-start gap-2.5 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                          selected
                            ? 'border-brand bg-brand-soft/60 ring-1 ring-brand shadow-[0_10px_24px_-14px_rgb(var(--brand)/0.9)]'
                            : 'border-border bg-bg hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-card'
                        }`}
                      >
                        {selected && (
                          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-ink">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                            selected ? 'bg-brand text-brand-ink' : 'bg-surface text-brand ring-1 ring-border group-hover:bg-brand-soft'
                          }`}
                        >
                          <Icon name={c.icon} size={19} />
                        </span>
                        <span className="min-w-0 pr-5">
                          <span className={`block text-sm font-semibold leading-snug ${selected ? 'text-brand' : 'text-ink'}`}>
                            {c.name.replace(' Cloude', '')}
                          </span>
                          <span className="mt-0.5 hidden sm:block">
                            <span className="line-clamp-2 text-xs leading-snug text-ink-muted">{c.description}</span>
                          </span>
                        </span>
                        {(c.jobBoard || c.jobPosts) && (
                          <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                            {c.jobBoard ? 'Job posts' : 'Shops + jobs'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {canChoosePostType && (
                  <div className="mt-7 animate-fade-in-up">
                    <h3 className="text-sm font-semibold text-ink">What are you posting in {cloudeShortName}?</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      A shop lists your loan schemes, policies and services for buyers to apply to. A job post is a vacancy candidates apply to
                      with their resume.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {([
                        {
                          value: 'SHOP' as const,
                          icon: <Store size={16} />,
                          title: 'A shop / agency',
                          body: 'Post your agency, then add loan schemes, policies or plans with their rates, charges and conditions.',
                        },
                        {
                          value: 'JOB' as const,
                          icon: <Briefcase size={16} />,
                          title: 'A job vacancy',
                          body: 'Hiring a field officer, tele-caller, accountant or advisor? Candidates apply and you schedule interviews.',
                        },
                      ]).map((option) => {
                        const selected = postType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPostType(option.value)}
                            aria-pressed={selected}
                            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                              selected
                                ? 'border-brand bg-brand-soft/60 ring-1 ring-brand'
                                : 'border-border bg-bg hover:border-brand/50 hover:shadow-card'
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                selected ? 'bg-brand text-brand-ink' : 'bg-surface text-brand ring-1 ring-border'
                              }`}
                            >
                              {option.icon}
                            </span>
                            <span className="min-w-0">
                              <span className={`block text-sm font-semibold ${selected ? 'text-brand' : 'text-ink'}`}>{option.title}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{option.body}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cloude && (
                  <div className="mt-7 animate-fade-in-up">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-soft text-brand">
                            <Icon name={cloude.icon} size={13} />
                          </span>
                          Sub-section in {cloude.name.replace(' Cloude', '')}
                        </h3>
                        <p className="mt-1 text-xs text-ink-muted">
                          {isJobPost
                            ? 'Pick the category your job belongs in — this is where candidates will find it.'
                            : 'Pick the sub-section your shop or ad belongs in — this is where buyers will find it.'}
                        </p>
                      </div>
                      <span className="rounded-full bg-surface-hover px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                        {cloude.categories.length} options
                      </span>
                    </div>
                    <div className="no-scrollbar max-h-72 overflow-y-auto rounded-xl border border-border bg-bg p-3">
                      <div className="flex flex-wrap gap-2">
                        {cloude.categories.map((cat) => {
                          const selected = categorySlug === cat.slug;
                          return (
                            <button
                              key={cat.slug}
                              type="button"
                              onClick={() => setCategorySlug(cat.slug)}
                              aria-pressed={selected}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                                selected
                                  ? 'border-brand bg-brand text-brand-ink shadow-[0_6px_16px_-8px_rgb(var(--brand)/0.8)]'
                                  : 'border-border bg-surface text-ink-muted hover:border-brand/60 hover:text-ink'
                              }`}
                            >
                              {selected && <Check size={13} strokeWidth={3} />}
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isJobPost && !canPostJobs && (
                  <div className="mt-6 flex animate-fade-in-up items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-accent">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>
                      Only seller / recruiter accounts can post jobs in {cloude?.name.replace(' Cloude', '')}. Log in with a seller
                      account to post a job — with a buyer account you can browse jobs and apply to them.
                    </span>
                  </div>
                )}

                {isJobPost && canPostJobs && categorySlug && (
                  <div className="mt-6 flex animate-fade-in-up items-start gap-3 rounded-xl border border-brand/30 bg-brand-soft/40 p-4 text-sm text-ink-muted">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
                      <Briefcase size={16} />
                    </span>
                    <span>
                      You're posting a <span className="font-semibold text-ink">job</span> — it goes live directly in {category?.name}{' '}
                      and candidates apply to it from the job card. No shop or photos needed.
                    </span>
                  </div>
                )}

                {cloude && categorySlug && !isJobPost && (
                  <div className="mt-6 animate-fade-in-up rounded-xl border border-brand/30 bg-brand-soft/30 p-4 sm:p-5">
                    <div className="mb-3 flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
                        <Store size={16} />
                      </span>
                      <div>
                        <label htmlFor="shop-name" className="block text-sm font-semibold text-ink">
                          Shop / business name <span className="font-normal text-ink-muted">(optional)</span>
                        </label>
                        <p className="text-xs text-ink-muted">
                          Shown on your ad's shop card inside {cloude.name.replace(' Cloude', '')} → {category?.name}.
                        </p>
                      </div>
                    </div>
                    <input
                      id="shop-name"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value.slice(0, 80))}
                      placeholder={`e.g. ${category?.name ?? 'Your'} Store`}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Details */}
            {step === 1 && (
              <div className="space-y-6">
                {isJobPost ? (
                  <JobDetailsStep draft={jobDraft} onChange={updateJobDraft} />
                ) : (
                  <>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="ad-title" className="text-sm font-semibold text-ink">
                          Ad title <span className="text-accent">*</span>
                        </label>
                        <span className={`text-xs ${title.length >= 70 ? 'font-semibold text-accent' : 'text-ink-muted'}`}>{title.length}/70</span>
                      </div>
                      <input
                        id="ad-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 70))}
                        placeholder="e.g. AC Repair & Gas Refill — Same Day Service"
                        className={inputClass}
                      />
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(title.length / 70) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="ad-description" className="text-sm font-semibold text-ink">
                          Description <span className="text-accent">*</span>
                        </label>
                        <span className="text-xs text-ink-muted">{description.length}/4096</span>
                      </div>
                      <textarea
                        id="ad-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 4096))}
                        rows={7}
                        placeholder="Describe condition, experience, availability, or anything a buyer should know..."
                        className={`${inputClass} resize-y leading-relaxed`}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2 (jobs): Skills & role — job posts have no photo upload */}
            {step === 2 && isJobPost && (
              <div className="space-y-6">
                <JobSkillsStep draft={jobDraft} onChange={updateJobDraft} />
              </div>
            )}

            {/* Step 2: Photos */}
            {step === 2 && !isJobPost && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                />

                {photos.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-bg px-6 py-12 text-center transition-colors hover:border-brand hover:bg-brand-soft/30"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand transition-transform group-hover:scale-110">
                      <ImagePlus size={28} />
                    </span>
                    <span className="text-base font-semibold text-ink">Click to add photos</span>
                    <span className="max-w-xs text-xs text-ink-muted">
                      Add up to {MAX_PHOTOS} photos. Photos are optional — without one, a default cover for your category is used.
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-ink">
                      <Camera size={14} /> Choose photos
                    </span>
                  </button>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">
                        {photos.length} <span className="font-normal text-ink-muted">of {MAX_PHOTOS} photos added</span>
                      </p>
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {photos.map((p, i) => (
                        <div
                          key={p.previewUrl}
                          className={`group/photo relative aspect-square overflow-hidden rounded-xl border ${
                            i === 0 ? 'border-brand ring-2 ring-brand/30' : 'border-border'
                          }`}
                        >
                          <img src={p.previewUrl} alt={`Upload ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-105" />
                          {i === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-ink">
                              <Sparkles size={10} /> Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            aria-label="Remove photo"
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-opacity hover:bg-black/80 sm:opacity-0 sm:group-hover/photo:opacity-100 sm:focus:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {photos.length < MAX_PHOTOS && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-bg text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft/30 hover:text-brand"
                        >
                          <ImagePlus size={22} />
                          <span className="text-xs font-medium">Add photo</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-brand/30 bg-brand-soft/30 p-4 text-left transition-colors hover:border-brand hover:bg-brand-soft/60 disabled:cursor-wait disabled:opacity-80"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/0.9)]">
                      {locating ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">
                        {locating ? 'Detecting your location…' : 'Use current location'}
                      </span>
                      <span className="block text-xs text-ink-muted">We'll fill in your city and pincode automatically.</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
                  </button>
                  {locationError && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
                      <AlertCircle size={14} className="mt-px shrink-0" /> {locationError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                  <span className="h-px flex-1 bg-border" /> or enter manually <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="mb-2 block text-sm font-semibold text-ink">
                      City <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Jaipur" className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pincode" className="mb-2 block text-sm font-semibold text-ink">
                      Pincode <span className="font-normal text-ink-muted">(optional)</span>
                    </label>
                    <div className="relative">
                      <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        id="pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 302001"
                        inputMode="numeric"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Summary card */}
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-bg p-4 sm:flex-row">
                  {isJobPost ? (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                      <Briefcase size={24} />
                    </span>
                  ) : (
                    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-brand-soft sm:aspect-square sm:w-28">
                      {cloude && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewImage} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      {cloude && (
                        <span className="flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-brand">
                          <Icon name={cloude.icon} size={11} /> {cloudeShortName}
                        </span>
                      )}
                      {category && <span className="rounded-md bg-surface-hover px-2 py-0.5 text-ink-muted">{category.name}</span>}
                    </div>
                    <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">
                      {isJobPost ? jobDraft.title : title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                      {isJobPost ? (
                        <span className="flex items-center gap-1"><Building2 size={12} /> {jobDraft.companyName}</span>
                      ) : (
                        shopName.trim() && <span className="flex items-center gap-1"><Store size={12} /> {shopName.trim()}</span>
                      )}
                      <span className="flex items-center gap-1"><MapPin size={12} /> {city}{pincode ? `, ${pincode}` : ''}</span>
                    </p>
                    {!isJobPost && description && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{description}</p>
                    )}
                  </div>
                </div>

                <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {[
                    ['Category', `${cloude?.name} → ${category?.name}`],
                    ...(isJobPost
                      ? jobReviewRows(jobDraft)
                      : [
                          ['Shop name', shopName.trim() || '—'],
                          ['Title', title],
                          ['Photos', `${photos.length} uploaded`],
                        ]),
                    ['Location', `${city}${pincode ? `, ${pincode}` : ''}`],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm odd:bg-bg/60">
                      <dt className="text-ink-muted">{k}</dt>
                      <dd className="break-words text-right font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  <ShieldCheck size={14} className="shrink-0 text-brand" />
                  Everything looks right? Hit <span className="font-semibold text-ink">Post now</span> and it goes live instantly.
                </p>

                {publishError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
                    <AlertCircle size={18} className="mt-px shrink-0" />
                    <span>{publishError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <footer className="flex items-center justify-between gap-3 border-t border-border bg-bg/50 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft size={15} /> Back
            </button>

            {blockedHint && <p className="hidden text-center text-xs text-ink-muted md:block">{blockedHint}</p>}

            {step < steps.length - 1 ? (
              <button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep((s) => s + 1)}
                className="group inline-flex items-center gap-1.5 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_10px_24px_-12px_rgb(var(--brand)/0.9)] transition-all hover:opacity-95 disabled:opacity-40 disabled:shadow-none"
              >
                Continue <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handlePublish}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgb(var(--accent)/0.9)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                {submitting ? 'Publishing…' : 'Post now'}
              </button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}

const primaryCta =
  'inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-[0_10px_24px_-10px_rgb(var(--brand)/0.8)] transition-transform hover:-translate-y-0.5';
const secondaryCta =
  'inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover';

function SuccessCard({ title, body, children }: { title: string; body: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-card sm:px-10">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
        <span className="relative mx-auto flex h-20 w-20 animate-fade-in-up items-center justify-center rounded-full bg-brand text-brand-ink shadow-[0_0_0_10px_rgb(var(--brand)/0.12),0_0_0_20px_rgb(var(--brand)/0.06)]">
          <Check size={34} strokeWidth={3} />
        </span>
        <p className="relative mt-7 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <PartyPopper size={13} /> Published
        </p>
        <h1 className="relative mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <p className="relative mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

// Shown in the static HTML until the form hydrates (useSearchParams opts it out of prerendering).
function PostAdSkeleton() {
  return (
    <SkeletonGroup label="Loading the ad form…" className="pb-16">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
          <Skeleton className="h-6 w-56 rounded-full" />
          <Skeleton className="mt-3 h-9 w-64" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>
      </div>

      <div className="mx-auto -mt-8 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex gap-1.5 lg:hidden">
              {STEPS.map((s) => (
                <Skeleton key={s} className="h-1.5 flex-1 rounded-full" />
              ))}
            </div>
            <div className="hidden space-y-5 lg:block">
              {STEPS.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="hidden h-60 rounded-2xl lg:block" />
        </div>

        <div className="rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-5 sm:px-7">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-72 max-w-full" />
            <Skeleton className="mt-2 h-4 w-60 max-w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-6 sm:grid-cols-3 sm:px-7">
            {cloudes.map((c) => (
              <Skeleton key={c.slug} className="h-[104px] rounded-xl" />
            ))}
          </div>
          <div className="flex justify-between border-t border-border px-5 py-4 sm:px-7">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonGroup>
  );
}

export default function PostAdPage() {
  return (
    <Suspense fallback={<PostAdSkeleton />}>
      <PostAdForm />
    </Suspense>
  );
}
