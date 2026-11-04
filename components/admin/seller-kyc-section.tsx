'use client';

import { useEffect, useState } from 'react';
import { Check, Fingerprint, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_TAX_ID_RULE, type SellerTaxIdRule } from '@/lib/seller-kyc';
import { ErrorNote, LoadingRow, SectionHeader, cardClass } from './shared';

type Need = 'Required' | 'Optional' | 'Either one';

const RULE_OPTIONS: { value: SellerTaxIdRule; title: string; text: string; gst: Need; pan: Need }[] = [
  {
    value: 'EITHER',
    title: 'GST or PAN',
    text: 'Seller must give at least one of the two.',
    gst: 'Either one',
    pan: 'Either one',
  },
  {
    value: 'GST_REQUIRED',
    title: 'GST required, PAN optional',
    text: 'GST field comes first; PAN is shown below it as optional.',
    gst: 'Required',
    pan: 'Optional',
  },
  {
    value: 'PAN_REQUIRED',
    title: 'PAN required, GST optional',
    text: 'PAN field comes first; GST is shown below it as optional.',
    gst: 'Optional',
    pan: 'Required',
  },
  {
    value: 'BOTH_REQUIRED',
    title: 'Both required',
    text: 'Seller must give both GST and PAN.',
    gst: 'Required',
    pan: 'Required',
  },
  {
    value: 'BOTH_OPTIONAL',
    title: 'Both optional',
    text: 'Seller may fill either, both or none.',
    gst: 'Optional',
    pan: 'Optional',
  },
];

function NeedTag({ label, need }: { label: string; need: Need }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        need === 'Required' ? 'bg-brand-soft text-brand' : 'bg-surface-hover text-ink-muted'
      }`}
    >
      {label}: {need}
    </span>
  );
}

export function SellerKycSection() {
  const { token } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<SellerTaxIdRule>(DEFAULT_TAX_ID_RULE);
  const [rule, setRule] = useState<SellerTaxIdRule>(DEFAULT_TAX_ID_RULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.settings
      .sellerKyc()
      .then((s) => {
        setSaved(s.taxIdRule);
        setRule(s.taxIdRule);
      })
      .catch(() => setError('Could not load the seller KYC setting.'))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.admin.updateSellerKyc(rule, token);
      setSaved(res.taxIdRule);
      setRule(res.taxIdRule);
      setNotice('Saved — new seller sign-ups now follow this rule.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the seller KYC setting.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <LoadingRow label="Loading seller KYC…" />;

  return (
    <div className="pb-4">
      <SectionHeader title="Seller KYC" subtitle="Choose which of GST and PAN a seller must give when creating an account.">
        <button
          type="button"
          onClick={save}
          disabled={rule === saved || saving}
          className="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Changes
        </button>
      </SectionHeader>

      {error && (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      )}
      {notice && (
        <p className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      )}

      <section className={`${cardClass} p-5 sm:p-6`}>
        <h2 className="font-display text-lg font-bold text-ink">GST &amp; PAN on seller sign-up</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <Fingerprint size={13} /> Aadhaar is always required. These fields appear right below it on the sign-up form.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RULE_OPTIONS.map((o) => {
            const active = rule === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setRule(o.value);
                  setNotice(null);
                }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active ? 'border-brand bg-brand-soft/30' : 'border-border hover:border-ink-muted/30'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{o.title}</span>
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? 'border-brand' : 'border-border'
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </span>
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-ink-muted">{o.text}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  <NeedTag label="GST" need={o.gst} />
                  <NeedTag label="PAN" need={o.pan} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
