'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Check, ChevronRight, ExternalLink, EyeOff, Layers, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, ApiError, type AdminCloude } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { slugify } from '@/lib/cloudes-data';
import { RETIRED_CLOUDE_SLUGS, isBuiltInCloude } from '@/lib/cloudes-catalogue';
import { resetCatalogue } from '@/lib/use-catalogue';
import { Icon, ICON_NAMES } from '@/components/icon';
import { EmptyState, ErrorNote, LoadingRow, SectionHeader, cardClass, inputClass } from './shared';

type AdminCategory = AdminCloude['categories'][number];
type Kind = 'built-in' | 'custom' | 'hidden';

// Built-in Cloudes take their name, icon and layout from the site's code (lib/cloudes-data.ts);
// only their categories are managed here. Ones the admin adds are fully editable.
const kindOf = (slug: string): Kind => (RETIRED_CLOUDE_SLUGS.has(slug) ? 'hidden' : isBuiltInCloude(slug) ? 'built-in' : 'custom');

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError && err.message ? err.message : fallback);

/** "Gifts, Toys" or one per line → ['Gifts', 'Toys']. */
const splitNames = (text: string) =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const postCount = (c: AdminCategory) => c._count.listings + c._count.jobs;

const primaryBtn =
  'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60';
const secondaryBtn =
  'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-60';
const iconBtn =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

function KindBadge({ kind }: { kind: Kind }) {
  if (kind === 'hidden') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
        <EyeOff size={10} /> Not on site
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        kind === 'custom' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-surface-hover text-ink-muted'
      }`}
    >
      {kind === 'custom' ? 'Added by admin' : 'Built-in'}
    </span>
  );
}

export function CloudesSection() {
  const { token } = useAuth();
  const [cloudes, setCloudes] = useState<AdminCloude[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Phones show the list or one Cloude's detail, not both.
  const [showDetail, setShowDetail] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminCloude | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const list = await api.admin.cloudes(token);
      setCloudes(list);
      setSelectedId((id) => (id && list.some((c) => c.id === id) ? id : (list[0]?.id ?? null)));
    } catch (err) {
      setError(errorText(err, 'Could not load Cloudes.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const replace = useCallback((updated: AdminCloude) => {
    setCloudes((list) => list?.map((c) => (c.id === updated.id ? updated : c)) ?? null);
    resetCatalogue();
  }, []);

  function select(id: string) {
    setSelectedId(id);
    setShowDetail(true);
    window.scrollTo({ top: 0 });
  }

  const selected = cloudes?.find((c) => c.id === selectedId) ?? null;
  const q = query.trim().toLowerCase();
  const shown = q ? cloudes?.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)) : cloudes;
  const totalCategories = cloudes?.reduce((sum, c) => sum + c.categories.length, 0) ?? 0;

  return (
    <div>
      <SectionHeader title="Cloudes" subtitle="Add new Cloudes and manage the categories sellers post their shops and jobs in.">
        <div className="flex flex-wrap items-center gap-2">
          {cloudes && cloudes.length > 0 && (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              {cloudes.length} Cloudes · {totalCategories} categories
            </span>
          )}
          <button type="button" onClick={() => setCreateOpen(true)} className={primaryBtn}>
            <Plus size={16} strokeWidth={2.6} /> New Cloude
          </button>
        </div>
      </SectionHeader>

      {error && (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={load} />
        </div>
      )}

      {loading && !cloudes ? (
        <div className={cardClass}>
          <LoadingRow label="Loading Cloudes…" />
        </div>
      ) : cloudes && cloudes.length === 0 ? (
        <div className={cardClass}>
          <EmptyState icon={<Layers size={22} />} title="No Cloudes yet" text="Create the first Cloude with “New Cloude”." />
        </div>
      ) : cloudes ? (
        <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
          <aside className={`${cardClass} overflow-hidden lg:sticky lg:top-20 ${showDetail ? 'max-lg:hidden' : ''}`}>
            <div className="border-b border-border p-3">
              <label className="relative block">
                <span className="sr-only">Search Cloudes</span>
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Cloudes"
                  className={`${inputClass} pl-9`}
                />
              </label>
            </div>
            <ul className="divide-y divide-border lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
              {shown?.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        active ? 'bg-brand-soft/60' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          active ? 'bg-brand text-brand-ink' : 'bg-brand-soft text-brand'
                        }`}
                      >
                        <Icon name={c.icon || 'Layers'} size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>{c.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                          {c.categories.length} categories · {c._count.listings} shops
                          {kindOf(c.slug) !== 'built-in' && <KindBadge kind={kindOf(c.slug)} />}
                        </span>
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-ink-muted lg:hidden" />
                    </button>
                  </li>
                );
              })}
              {shown?.length === 0 && <li className="px-4 py-6 text-center text-xs text-ink-muted">No Cloude matches “{query.trim()}”.</li>}
            </ul>
          </aside>

          <div className={showDetail ? '' : 'max-lg:hidden'}>
            {selected ? (
              <CloudeDetail
                key={selected.id}
                cloude={selected}
                onChanged={replace}
                onDelete={() => setDeleting(selected)}
                onBack={() => setShowDetail(false)}
              />
            ) : (
              <div className={cardClass}>
                <EmptyState icon={<Layers size={22} />} title="Pick a Cloude" text="Choose a Cloude on the left to manage its categories." />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {createOpen && (
        <CreateCloudeDialog
          existing={cloudes ?? []}
          onClose={() => setCreateOpen(false)}
          onCreated={(created) => {
            setCloudes((list) => [...(list ?? []), created]);
            resetCatalogue();
            setCreateOpen(false);
            select(created.id);
          }}
        />
      )}
      {deleting && (
        <DeleteCloudeDialog
          cloude={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setCloudes((list) => list?.filter((c) => c.id !== deleting.id) ?? null);
            setSelectedId((id) => (id === deleting.id ? null : id));
            resetCatalogue();
            setDeleting(null);
            setShowDetail(false);
          }}
        />
      )}
    </div>
  );
}

function CloudeDetail({
  cloude,
  onChanged,
  onDelete,
  onBack,
}: {
  cloude: AdminCloude;
  onChanged: (c: AdminCloude) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const { token } = useAuth();
  const kind = kindOf(cloude.slug);
  const [editing, setEditing] = useState(false);
  const [addText, setAddText] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const jobs = cloude.categories.reduce((sum, c) => sum + c._count.jobs, 0);
  const hasPosts = cloude._count.listings > 0 || jobs > 0;
  const f = filter.trim().toLowerCase();
  const categories = f ? cloude.categories.filter((c) => c.name.toLowerCase().includes(f)) : cloude.categories;

  async function addCategories(e: React.FormEvent) {
    e.preventDefault();
    const names = splitNames(addText);
    if (!token || names.length === 0 || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const before = cloude.categories.length;
      const updated = await api.admin.addCategories(cloude.id, names, token);
      onChanged(updated);
      setAddText('');
      const added = updated.categories.length - before;
      const skipped = names.length - added;
      setNotice(`${added} ${added === 1 ? 'category' : 'categories'} added${skipped > 0 ? ` · ${skipped} already existed` : ''}.`);
    } catch (err) {
      setAddError(errorText(err, 'Could not add the categories.'));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline lg:hidden"
      >
        <ArrowLeft size={15} /> All Cloudes
      </button>

      <section className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name={cloude.icon || 'Layers'} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{cloude.name}</h2>
              <KindBadge kind={kind} />
            </div>
            <p className="mt-0.5 break-all text-xs text-ink-muted">/cloudes/{cloude.slug}</p>
            {cloude.description && <p className="mt-1.5 text-sm text-ink-muted">{cloude.description}</p>}
            <p className="mt-2 text-xs text-ink-muted">
              {cloude.categories.length} categories · {cloude._count.listings} shops · {jobs} jobs
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {kind !== 'hidden' && (
              <Link href={`/cloudes/${cloude.slug}`} target="_blank" className={`${secondaryBtn} h-9 px-3`}>
                <ExternalLink size={14} /> View
              </Link>
            )}
            {kind === 'custom' && !editing && (
              <button type="button" onClick={() => setEditing(true)} className={`${secondaryBtn} h-9 px-3`}>
                <Pencil size={14} /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={hasPosts}
              title={hasPosts ? 'Shops or jobs are posted in this Cloude — it can’t be deleted' : undefined}
              className={`${secondaryBtn} h-9 px-3 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-ink dark:hover:text-red-400`}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {kind === 'built-in' && (
          <p className="mt-4 rounded-xl bg-bg/60 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
            This is one of the site’s built-in Cloudes — its name, icon and layout come from the site’s code. You can add, rename
            and delete its categories here; new ones appear in its category list on the site.
          </p>
        )}
        {kind === 'hidden' && (
          <p className="mt-4 flex gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            An old Cloude kept in the database for the seed script — it isn’t shown on the site (Jobs &amp; Freelancing lives under
            “software”), so changes here have no effect there.
          </p>
        )}

        {editing && (
          <EditCloudeForm
            cloude={cloude}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              onChanged(updated);
              setEditing(false);
              setNotice('Cloude details saved.');
            }}
          />
        )}
      </section>

      <section className={`${cardClass} p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-ink">Add categories</h3>
        <p className="mt-0.5 text-xs text-ink-muted">Add one, or several at once separated by commas.</p>
        <form onSubmit={addCategories} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="e.g. Toy Shop, Gift Hampers"
            aria-label="New category names"
            maxLength={2000}
            className={inputClass}
          />
          <button type="submit" disabled={adding || splitNames(addText).length === 0} className={primaryBtn}>
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} strokeWidth={2.6} />} Add
          </button>
        </form>
        {addError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{addError}</p>}
        {notice && (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check size={13} strokeWidth={3} /> {notice}
          </p>
        )}
        <p className="mt-3 text-[11px] text-ink-muted">Changes reach the live site within about a minute.</p>
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h3 className="text-sm font-semibold text-ink">
            Categories <span className="font-normal text-ink-muted">({cloude.categories.length})</span>
          </h3>
          {cloude.categories.length > 8 && (
            <label className="relative w-full sm:w-60">
              <span className="sr-only">Filter categories</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter categories"
                className={`${inputClass} h-9 pl-8`}
              />
            </label>
          )}
        </div>
        {cloude.categories.length === 0 ? (
          <EmptyState icon={<Layers size={22} />} title="No categories yet" text="Add the first category above so sellers can post in this Cloude." />
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} onChanged={onChanged} />
            ))}
            {categories.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-ink-muted">No category matches “{filter.trim()}”.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function CategoryRow({ category, onChanged }: { category: AdminCategory; onChanged: (c: AdminCloude) => void }) {
  const { token } = useAuth();
  const [mode, setMode] = useState<'view' | 'rename' | 'confirm-delete'>('view');
  const [name, setName] = useState(category.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const posts = postCount(category);
  const locked = posts > 0 || category._count.children > 0;

  function reset() {
    setMode('view');
    setName(category.name);
    setError(null);
  }

  async function run(action: () => Promise<AdminCloude>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      setMode('view');
      onChanged(updated);
    } catch (err) {
      setError(errorText(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  function rename(e: React.FormEvent) {
    e.preventDefault();
    const next = name.trim();
    if (!token || next.length < 2) return;
    if (next === category.name) return reset();
    run(() => api.admin.renameCategory(category.id, next, token), 'Could not rename the category.');
  }

  return (
    <li className="px-4 py-3">
      {mode === 'rename' ? (
        <form onSubmit={rename} className="flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && reset()}
            maxLength={80}
            aria-label={`New name for ${category.name}`}
            className={`${inputClass} h-9`}
          />
          <button type="submit" disabled={busy || name.trim().length < 2} aria-label="Save name" className={`${iconBtn} text-brand`}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} strokeWidth={2.6} />}
          </button>
          <button type="button" onClick={reset} disabled={busy} aria-label="Cancel rename" className={iconBtn}>
            <X size={16} />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-medium text-ink">{category.name}</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {posts === 0
                ? 'Nothing posted yet'
                : `${category._count.listings} shop${category._count.listings === 1 ? '' : 's'} · ${category._count.jobs} job${category._count.jobs === 1 ? '' : 's'}`}
            </p>
          </div>
          {mode === 'confirm-delete' ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-ink-muted sm:inline">Delete?</span>
              <button
                type="button"
                onClick={() => token && run(() => api.admin.deleteCategory(category.id, token), 'Could not delete the category.')}
                disabled={busy}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {busy && <Loader2 size={13} className="animate-spin" />} Delete
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover"
              >
                Keep
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setMode('rename')} aria-label={`Rename ${category.name}`} className={iconBtn}>
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMode('confirm-delete')}
                disabled={locked}
                aria-label={`Delete ${category.name}`}
                title={locked ? 'Shops or jobs are posted in this category — it can’t be deleted' : undefined}
                className={`${iconBtn} hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </li>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Cloude icon" className="grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-border bg-bg/60 p-2 sm:grid-cols-8">
      {ICON_NAMES.map((name) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            title={name}
            onClick={() => onChange(name)}
            className={`flex aspect-square items-center justify-center rounded-lg transition-colors ${
              selected ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:bg-surface-hover hover:text-brand'
            }`}
          >
            <Icon name={name} size={17} />
          </button>
        );
      })}
    </div>
  );
}

const labelClass = 'mb-1.5 block text-xs font-semibold text-ink';

function EditCloudeForm({
  cloude,
  onCancel,
  onSaved,
}: {
  cloude: AdminCloude;
  onCancel: () => void;
  onSaved: (c: AdminCloude) => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState(cloude.name);
  const [description, setDescription] = useState(cloude.description ?? '');
  const [icon, setIcon] = useState(cloude.icon || 'Layers');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token || name.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.admin.updateCloude(cloude.id, { name: name.trim(), description: description.trim(), icon }, token));
    } catch (err) {
      setError(errorText(err, 'Could not save the Cloude.'));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-3 border-t border-border pt-4">
      <div>
        <label htmlFor="edit-cloude-name" className={labelClass}>Name</label>
        <input id="edit-cloude-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />
      </div>
      <div>
        <label htmlFor="edit-cloude-desc" className={labelClass}>Description</label>
        <input
          id="edit-cloude-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </div>
      <div>
        <span className={labelClass}>Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={secondaryBtn}>Cancel</button>
        <button type="submit" disabled={busy || name.trim().length < 2} className={primaryBtn}>
          {busy && <Loader2 size={15} className="animate-spin" />} Save
        </button>
      </div>
    </form>
  );
}

/** Backdrop + panel shared by the create / delete dialogs; Escape or a backdrop click closes it. */
function Dialog({
  labelledBy,
  busy,
  onClose,
  className = 'max-w-sm',
  children,
}: {
  labelledBy: string;
  busy: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busyRef.current && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-card animate-fade-in-up ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function CreateCloudeDialog({
  existing,
  onClose,
  onCreated,
}: {
  existing: AdminCloude[];
  onClose: () => void;
  onCreated: (c: AdminCloude) => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [categories, setCategories] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalSlug = slugTouched ? slugify(slug) : slugify(name);
  const taken = existing.some((c) => c.slug === finalSlug);
  const names = splitNames(categories);
  const canSave = name.trim().length >= 2 && !!finalSlug && !taken && !busy;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !canSave) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.admin.createCloude(
        { name: name.trim(), slug: finalSlug, description: description.trim() || undefined, icon, categories: names },
        token,
      );
      onCreated(created);
    } catch (err) {
      setError(errorText(err, 'Could not create the Cloude.'));
      setBusy(false);
    }
  }

  return (
    <Dialog labelledBy="create-cloude-title" busy={busy} onClose={onClose} className="max-w-lg">
      <form onSubmit={create}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="create-cloude-title" className="font-display text-lg font-bold text-ink">New Cloude</h2>
            <p className="mt-1 text-sm text-ink-muted">It appears on the site with its categories, ready for sellers to post in.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className={iconBtn}>
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="new-cloude-name" className={labelClass}>Name</label>
            <input
              id="new-cloude-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pet Care Cloude"
              maxLength={60}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-cloude-slug" className={labelClass}>Page address</label>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-ink-muted">/cloudes/</span>
              <input
                id="new-cloude-slug"
                value={slugTouched ? slug : finalSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="pet-care"
                maxLength={60}
                className={inputClass}
              />
            </div>
            {taken && <p className="mt-1 text-xs text-red-600 dark:text-red-400">Another Cloude already uses this address.</p>}
          </div>
          <div>
            <label htmlFor="new-cloude-desc" className={labelClass}>
              Description <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <input
              id="new-cloude-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One line about what sellers list here"
              maxLength={200}
              className={inputClass}
            />
          </div>
          <div>
            <span className={labelClass}>Icon</span>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div>
            <label htmlFor="new-cloude-cats" className={labelClass}>
              Categories <span className="font-normal text-ink-muted">(one per line — you can add more later)</span>
            </label>
            <textarea
              id="new-cloude-cats"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              rows={4}
              placeholder={'Pet Shop\nPet Grooming\nVeterinary Clinic'}
              className={`${inputClass} h-auto py-2`}
            />
            {names.length > 0 && <p className="mt-1 text-[11px] text-ink-muted">{names.length} categories</p>}
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={`${secondaryBtn} flex-1`}>Cancel</button>
          <button type="submit" disabled={!canSave} className={`${primaryBtn} flex-1`}>
            {busy && <Loader2 size={15} className="animate-spin" />} Create Cloude
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteCloudeDialog({
  cloude,
  onClose,
  onDeleted,
}: {
  cloude: AdminCloude;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { token } = useAuth();
  const builtIn = kindOf(cloude.slug) === 'built-in';
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A built-in Cloude is part of the site's main navigation — make the admin type its address.
  const confirmed = !builtIn || typed.trim() === cloude.slug;

  async function confirm() {
    if (!token || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api.admin.deleteCloude(cloude.id, token);
      onDeleted();
    } catch (err) {
      setError(errorText(err, 'Could not delete the Cloude.'));
      setBusy(false);
    }
  }

  return (
    <Dialog labelledBy="delete-cloude-title" busy={busy} onClose={onClose}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
        <Trash2 size={20} />
      </span>
      <h2 id="delete-cloude-title" className="mt-4 font-display text-lg font-bold text-ink">
        Delete {cloude.name}?
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        The Cloude and its {cloude.categories.length} categories are removed from the site. This can’t be undone.
      </p>
      {builtIn && (
        <div className="mt-3">
          <label htmlFor="delete-cloude-confirm" className="mb-1.5 block text-xs text-ink-muted">
            This is a built-in Cloude. Type <span className="font-semibold text-ink">{cloude.slug}</span> to confirm.
          </label>
          <input
            id="delete-cloude-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
        </div>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={`${secondaryBtn} flex-1`}>Cancel</button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !confirmed}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />} Delete
        </button>
      </div>
    </Dialog>
  );
}
