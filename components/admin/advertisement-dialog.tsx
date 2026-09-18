'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, Sparkles, Store, Trash2, X } from 'lucide-react';
import { api, ApiError, type AdAudience, type AdminAdvertisement } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fileToResizedDataUrl } from '@/lib/image-utils';
import { AdvertisementCard } from '@/components/advertisement-card';
import { EmptyState, ErrorNote, LoadingRow, Segmented, formatDate, inputClass } from './shared';
import { timeAgo } from './overview-section';

type Kind = 'SHOP' | 'SERVICE';
type Duration = '1' | '7' | '30' | 'NONE';

// Same rule as the backend: a page on this site or an http(s) link.
const LINK_RE = /^(https?:\/\/|\/(?!\/))\S*$/;
const AUDIENCE_LABEL: Record<AdAudience, string> = { ALL: 'Everyone', BUYER: 'Buyers', SELLER: 'Sellers' };

const labelClass = 'mb-1.5 block text-xs font-semibold text-ink-muted';

/** Posts a shop / service advertisement that pops up for buyers and sellers, and lists the ones running. */
export function AdvertisementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const [view, setView] = useState<'create' | 'posted'>('create');
  const [kind, setKind] = useState<Kind>('SHOP');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [audience, setAudience] = useState<AdAudience>('ALL');
  const [duration, setDuration] = useState<Duration>('7');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reach, setReach] = useState<number | null>(null);
  const [ads, setAds] = useState<AdminAdvertisement[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function resetForm() {
    setKind('SHOP');
    setName('');
    setDescription('');
    setImageUrl(null);
    setLinkUrl('');
    setAudience('ALL');
    setDuration('7');
    setError(null);
    setReach(null);
  }

  const loadAds = useCallback(async () => {
    if (!token) return;
    setListError(null);
    try {
      setAds(await api.admin.advertisements(token));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Could not load the advertisements.');
    }
  }, [token]);

  useEffect(() => {
    if (!open) return;
    resetForm();
    setView('create');
    setBusy(false);
    setAds(null);
    setConfirmId(null);
    loadAds();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loadAds]);

  if (!open) return null;

  const link = linkUrl.trim();
  const linkInvalid = link !== '' && !LINK_RE.test(link);
  const valid = name.trim().length >= 2 && !!imageUrl && !linkInvalid;

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Pick an image file — JPG, PNG or WebP.');
      return;
    }
    setImageBusy(true);
    setError(null);
    try {
      setImageUrl(await fileToResizedDataUrl(file, 1200, 0.82));
    } catch {
      setError('Could not read that image. Try another one.');
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !valid || !imageUrl) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.admin.createAdvertisement(
        {
          kind,
          name: name.trim(),
          imageUrl,
          audience,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(link ? { linkUrl: link } : {}),
          ...(duration !== 'NONE' ? { days: Number(duration) as 1 | 7 | 30 } : {}),
        },
        token,
      );
      setReach(res.reach);
      loadAds();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post the advertisement.');
    } finally {
      setBusy(false);
    }
  }

  async function takeDown(id: string) {
    if (!token) return;
    setRemovingId(id);
    try {
      await api.admin.removeAdvertisement(id, token);
      setAds((list) => list?.filter((a) => a.id !== id) ?? null);
      setConfirmId(null);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Could not take the advertisement down.');
    } finally {
      setRemovingId(null);
    }
  }

  const form = (
    <form onSubmit={post}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <div>
            <p className={labelClass}>What are you promoting?</p>
            <Segmented
              label="Advertisement type"
              value={kind}
              onChange={setKind}
              options={[
                { value: 'SHOP', label: 'A shop' },
                { value: 'SERVICE', label: 'A service' },
              ]}
            />
          </div>

          <label className="block">
            <span className={labelClass}>{kind === 'SHOP' ? 'Shop name' : 'Service name'}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder={kind === 'SHOP' ? 'e.g. Sharma Sweets & Bakery' : 'e.g. AC repair at home'}
              className={inputClass}
              autoFocus
            />
          </label>

          <div>
            <p className={labelClass}>Photo</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="advert-image"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            {imageUrl ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg/60 p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                <p className="min-w-0 flex-1 truncate text-xs text-ink-muted">Photo added</p>
                <label
                  htmlFor="advert-image"
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
                >
                  Change
                </label>
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  aria-label="Remove photo"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="advert-image"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickImage(e.dataTransfer.files?.[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-bg/40 px-4 py-6 text-center transition-colors hover:border-brand/50 hover:bg-brand-soft/40"
              >
                {imageBusy ? <Loader2 size={22} className="animate-spin text-brand" /> : <ImagePlus size={22} className="text-brand" />}
                <span className="text-sm font-semibold text-ink">{imageBusy ? 'Preparing photo…' : 'Upload a photo'}</span>
                <span className="text-xs text-ink-muted">Click or drop an image — it’s shown big, so pick a sharp one.</span>
              </label>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 flex justify-between text-xs font-semibold text-ink-muted">
              About it <span className="font-normal tabular-nums">{description.length}/300</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder={kind === 'SHOP' ? 'What makes this shop worth a visit?' : 'What does the service include?'}
              className={`${inputClass} h-auto resize-none py-2.5`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Button link (optional)</span>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              maxLength={500}
              placeholder="/listing/… or https://…"
              className={inputClass}
              aria-invalid={linkInvalid}
            />
            <span className={`mt-1 block text-xs ${linkInvalid ? 'text-red-600 dark:text-red-400' : 'text-ink-muted'}`}>
              {linkInvalid
                ? 'Start with / for a page on DukanCloude, or with https://'
                : `Adds a “${kind === 'SHOP' ? 'Visit shop' : 'View service'}” button. Leave empty for none.`}
            </span>
          </label>

          <div className="space-y-4">
            <div className="min-w-0">
              <p className={labelClass}>Show to</p>
              <Segmented
                label="Audience"
                value={audience}
                onChange={setAudience}
                options={[
                  { value: 'ALL', label: 'Everyone' },
                  { value: 'BUYER', label: 'Buyers' },
                  { value: 'SELLER', label: 'Sellers' },
                ]}
              />
            </div>
            <div className="min-w-0">
              <p className={labelClass}>Runs for</p>
              <Segmented
                label="Runs for"
                value={duration}
                onChange={setDuration}
                options={[
                  { value: '1', label: '1 day' },
                  { value: '7', label: '7 days' },
                  { value: '30', label: '30 days' },
                  { value: 'NONE', label: 'Until removed' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className={labelClass}>Live preview</p>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black px-7 pb-3 pt-8">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
            <AdvertisementCard
              ad={{ kind, name: name.trim(), description: description.trim(), imageUrl, linkUrl: linkInvalid ? null : link }}
              enterClass=""
            />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Pops up when they open the site, and keeps coming back until they close it with ✕.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-5 flex gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-10 rounded-xl border border-border px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || busy || imageBusy}
          className="flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand px-5 text-sm font-semibold text-brand-ink transition hover:brightness-110 disabled:opacity-50 sm:flex-none"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Post advertisement
        </button>
      </div>
    </form>
  );

  const success = (
    <div className="mx-auto max-w-md py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 size={24} />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">Advertisement is live</h3>
      <p className="mt-1.5 text-sm text-ink-muted">
        It will pop up for {reach} {reach === 1 ? 'account' : 'accounts'} the next time they open DukanCloude, and
        keeps coming back until they close it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={resetForm}
          className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          Post another
        </button>
        <button
          type="button"
          onClick={() => setView('posted')}
          className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          See all ads
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-ink transition hover:brightness-110"
        >
          Done
        </button>
      </div>
    </div>
  );

  const now = Date.now();
  const posted = (
    <div>
      {listError && <ErrorNote message={listError} onRetry={loadAds} />}
      {!ads && !listError && <LoadingRow label="Loading advertisements…" />}
      {ads && ads.length === 0 && (
        <EmptyState
          icon={<Sparkles size={20} />}
          title="No advertisements yet"
          text="Post one and it pops up for buyers and sellers as soon as they open the site."
        />
      )}
      {ads && ads.length > 0 && (
        <ul className="mt-1 space-y-2.5">
          {ads.map((ad) => {
            const ended = !!ad.endsAt && new Date(ad.endsAt).getTime() <= now;
            const seenPct = ad.reach > 0 ? Math.min(100, Math.round((ad.seen / ad.reach) * 100)) : 0;
            const KindIcon = ad.kind === 'SHOP' ? Store : Sparkles;
            return (
              <li key={ad.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg/40 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-20" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="min-w-0 truncate text-sm font-semibold text-ink">{ad.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                      <KindIcon size={11} /> {ad.kind === 'SHOP' ? 'Shop' : 'Service'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        ended ? 'bg-surface-hover text-ink-muted' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${ended ? 'bg-ink-muted' : 'bg-emerald-500'}`} />
                      {ended ? 'Ended' : 'Live'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {AUDIENCE_LABEL[ad.audience]} ·{' '}
                    {ad.endsAt ? `${ended ? 'Ended' : 'Ends'} ${formatDate(ad.endsAt)}` : 'Until removed'} · Posted{' '}
                    {timeAgo(ad.createdAt).toLowerCase()}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${seenPct}%` }} />
                    </div>
                    <span className="text-[11px] tabular-nums text-ink-muted">
                      Seen by {ad.seen} of {ad.reach}
                    </span>
                  </div>
                </div>
                {confirmId === ad.id ? (
                  <div className="ml-auto flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      disabled={removingId === ad.id}
                      className="h-8 rounded-lg border border-border px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => takeDown(ad.id)}
                      disabled={removingId === ad.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {removingId === ad.id && <Loader2 size={13} className="animate-spin" />} Take down
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(ad.id)}
                    aria-label={`Take down ${ad.name}`}
                    title="Take down"
                    className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="advert-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Sparkles size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="advert-title" className="font-display text-lg font-bold text-ink">
                Advertisements
              </h2>
              <p className="text-sm text-ink-muted">Promote a shop or service with a pop-up buyers and sellers see when they land.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-4 sm:px-6">
          <Segmented
            label="Advertisements view"
            value={view}
            onChange={setView}
            options={[
              { value: 'create', label: 'New advertisement' },
              { value: 'posted', label: `Posted${ads ? ` (${ads.length})` : ''}` },
            ]}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 sm:px-6">
          {view === 'posted' ? posted : reach !== null ? success : form}
        </div>
      </div>
    </div>
  );
}
