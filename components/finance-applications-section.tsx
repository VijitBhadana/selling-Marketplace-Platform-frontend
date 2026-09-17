'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, ClipboardList, FileText, Mail, MessageCircle, Phone, Search, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { api, ApiError } from '@/lib/api';
import { formatRupees } from '@/lib/booking-details';
import {
  DOCUMENT_LABELS,
  DOCUMENT_NUMBER_RULES,
  EMPLOYMENT_LABELS,
  FINANCE_STATUS_LABELS,
  INSTALMENT_WORD,
  INTEREST_TYPE_LABELS,
  ageFrom,
  financeItemType,
  formatApplicationDate,
  loanQuote,
  type FinanceApplicant,
  type FinanceApplicationStatus,
  type LoanDetails,
} from '@/lib/finance-details';
import { openResume } from '@/lib/jobs';
import { Skeleton, SkeletonGroup } from './skeleton';

const inputClass =
  'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15';

const STATUS_BADGE: Record<FinanceApplicationStatus, string> = {
  APPLIED: 'bg-brand-soft text-brand',
  UNDER_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  APPROVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'bg-surface-hover text-ink-muted',
};

/**
 * Agency-only: everyone who applied for one of this shop's schemes, with their details, the
 * papers they uploaded, the repayment they applied under, and approve / review / reject
 * actions. Renders nothing for anyone but the agency that owns the shop.
 */
export function FinanceApplicationsSection({ listingId, sellerId, shopName }: { listingId: string; sellerId: string; shopName: string }) {
  const { user, token, loading: authLoading } = useAuth();
  const [applicants, setApplicants] = useState<FinanceApplicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isOwner = !!user && user.id === sellerId;

  useEffect(() => {
    if (!isOwner || !token) return;
    let cancelled = false;
    api.finance
      .shopApplications(listingId, token)
      .then((data) => {
        if (!cancelled) setApplicants(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load applications.');
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, token, listingId]);

  // The "someone applied" alert deep-links to #applications.
  useEffect(() => {
    if (applicants && window.location.hash === '#applications') {
      document.getElementById('applications')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [applicants]);

  if (authLoading || !isOwner) return null;

  function replace(next: FinanceApplicant) {
    setApplicants((prev) => prev?.map((a) => (a.id === next.id ? next : a)) ?? prev);
  }

  const pending = applicants?.filter((a) => a.status === 'APPLIED').length ?? 0;

  return (
    <section id="applications" className="mt-6 scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <ClipboardList size={15} className="text-brand" /> Scheme applications {applicants && <span>({applicants.length})</span>}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Only you can see who applied and their documents{pending > 0 ? ` · ${pending} awaiting your decision` : ''}.
        </p>
      </div>

      {applicants === null && !error && <ApplicantsSkeleton />}
      {error && <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">{error}</p>}
      {applicants?.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink-muted">
          No one has applied yet. You'll get a notification as soon as someone does.
        </p>
      )}

      <div className="space-y-4">
        {applicants?.map((a) => (
          <ApplicantCard key={a.id} applicant={a} listingId={listingId} shopName={shopName} onUpdated={replace} />
        ))}
      </div>
    </section>
  );
}

function ApplicantsSkeleton() {
  return (
    <SkeletonGroup label="Loading applications…" className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border p-5">
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
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

function ApplicantCard({
  applicant: a,
  listingId,
  shopName,
  onUpdated,
}: {
  applicant: FinanceApplicant;
  listingId: string;
  shopName: string;
  onUpdated: (next: FinanceApplicant) => void;
}) {
  const { token } = useAuth();
  const { openChat } = useChat();
  const [deciding, setDeciding] = useState<null | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const details = a.termsSnapshot;
  const type = financeItemType(details);
  const loan = type === 'LOAN' ? (details as LoanDetails) : null;
  const age = a.dateOfBirth ? ageFrom(a.dateOfBirth) : null;

  // What the agency is about to sanction, priced on the scheme's terms as they stood when
  // this application was made — so the applicant is quoted the instalment they will pay.
  const sanctionQuote =
    loan && deciding === 'APPROVED' && Number(amount) > 0 && Number(tenure) > 0
      ? loanQuote(loan, Number(amount), Number(tenure), rate ? Number(rate) : undefined)
      : null;

  async function viewDocument(documentId: string, fileName: string) {
    if (!token || busy) return;
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const tab = isPdf ? window.open('', '_blank') : null;
    setBusy(documentId);
    setError(null);
    try {
      const doc = await api.finance.document(documentId, token);
      openResume(doc.dataUrl, doc.fileName, tab);
    } catch (err) {
      tab?.close();
      setError(err instanceof ApiError ? err.message : 'Could not open that document.');
    } finally {
      setBusy(null);
    }
  }

  function startDeciding(status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') {
    setError(null);
    setNotice(null);
    if (status === 'APPROVED') {
      setAmount(String(a.approvedAmount ?? a.requestedAmount ?? ''));
      setRate(String(a.approvedRate ?? loan?.interestRateMin ?? ''));
      setTenure(String(a.approvedTenure ?? a.tenureMonths ?? ''));
    }
    setNote(a.sellerNote ?? '');
    setDeciding(status);
  }

  async function sendDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !deciding || busy) return;
    setBusy('decision');
    setError(null);
    try {
      const { conversationId: _conversationId, ...updated } = await api.finance.decide(
        a.id,
        {
          status: deciding,
          note: note.trim() || undefined,
          ...(deciding === 'APPROVED'
            ? {
                approvedAmount: amount ? Number(amount) : undefined,
                approvedRate: rate ? Number(rate) : undefined,
                approvedTenure: tenure ? Number(tenure) : undefined,
              }
            : {}),
        },
        token,
      );
      onUpdated(updated);
      setDeciding(null);
      setNotice(
        deciding === 'APPROVED'
          ? `Approval sent to ${a.fullName}'s chat.`
          : deciding === 'REJECTED'
            ? `${a.fullName} has been told this application was not approved.`
            : `${a.fullName} has been told you are reviewing their application.`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your decision.');
    } finally {
      setBusy(null);
    }
  }

  const detailRows: [string, string][] = [
    ['Applied for', a.product.name],
    ['Amount asked for', a.requestedAmount != null ? formatRupees(a.requestedAmount) : '—'],
    ...(loan ? ([['Tenure asked for', a.tenureMonths ? `${a.tenureMonths} months` : '—']] as [string, string][]) : []),
    ['Occupation', a.occupation ? EMPLOYMENT_LABELS[a.occupation] ?? a.occupation : '—'],
    ['Employer / business', a.employerName || '—'],
    ['Monthly income', a.monthlyIncome != null ? formatRupees(a.monthlyIncome) : '—'],
    ...(loan
      ? ([
          ['Existing EMIs', a.existingEmi != null ? `${formatRupees(a.existingEmi)} / month` : '—'],
          ['CIBIL score', a.creditScore != null ? String(a.creditScore) : '—'],
        ] as [string, string][])
      : []),
    ['Age', age != null ? `${age} years` : '—'],
    ...(a.nomineeName ? ([['Nominee', `${a.nomineeName}${a.nomineeRelation ? ` (${a.nomineeRelation})` : ''}`]] as [string, string][]) : []),
    ['Purpose', a.purpose || '—'],
    ['Address', [a.address, a.city, a.pincode].filter(Boolean).join(', ')],
  ];

  const isClosed = a.status === 'REJECTED';

  return (
    <article className={`rounded-2xl border border-border bg-surface p-4 sm:p-5 ${isClosed ? 'opacity-70' : ''}`}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-base font-bold text-brand-ink">
          {a.fullName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink">{a.fullName}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[a.status]}`}>
              {FINANCE_STATUS_LABELS[a.status]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-brand">
              <Mail size={12} /> {a.email}
            </a>
            <a href={`tel:${a.phone}`} className="flex items-center gap-1 hover:text-brand">
              <Phone size={12} /> {a.phone}
            </a>
            <span>Applied {formatApplicationDate(a.appliedAt)}</span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2.5 rounded-xl border border-border bg-bg/50 p-4 text-sm sm:grid-cols-2">
        {detailRows.map(([label, value]) => (
          <div key={label} className={label === 'Address' || label === 'Purpose' ? 'sm:col-span-2' : undefined}>
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {/* The working this application was made under — kept as it was on the day. */}
      {a.quote && (
        <div className="mt-3 rounded-xl border border-border bg-bg/50 p-4">
          <p className="text-xs font-semibold text-ink">
            Applied under {INTEREST_TYPE_LABELS[a.quote.interestType] ?? a.quote.interestType} at {a.quote.annualRate}% p.a.
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
            {[
              [INSTALMENT_WORD[a.quote.repaymentFrequency] ?? 'EMI', formatRupees(a.quote.instalment)],
              ['Instalments', String(a.quote.instalmentCount)],
              ['Total interest', formatRupees(a.quote.totalInterest)],
              ['Total repayable', formatRupees(a.quote.totalPayable)],
              ...(a.quote.processingFee ? ([['Processing fee', formatRupees(a.quote.processingFee + a.quote.gstOnFee)]] as [string, string][]) : []),
              ['Net disbursal', formatRupees(a.quote.netDisbursal)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] text-ink-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Documents */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-semibold text-ink">Documents ({a.documents.length})</p>
        <div className="flex flex-wrap gap-2">
          {a.documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => viewDocument(doc.id, doc.fileName)}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
            >
              <FileText size={13} className="text-brand" />
              {DOCUMENT_LABELS[doc.docType] ?? doc.docType}
              {doc.docNumber && <span className="text-ink-muted">· {doc.docNumber}</span>}
              {busy === doc.id ? <span className="text-ink-muted">opening…</span> : <Search size={11} className="text-ink-muted" />}
            </button>
          ))}
        </div>
        {a.documents.some((d) => DOCUMENT_NUMBER_RULES[d.docType]) && (
          <p className="mt-1.5 text-[11px] text-ink-muted">PAN and Aadhaar numbers were checked for format when the applicant submitted them.</p>
        )}
      </div>

      {/* The decision already taken */}
      {a.status === 'APPROVED' && !deciding && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <BadgeCheck size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              Approved{a.approvedAmount ? ` · ${formatRupees(a.approvedAmount)}` : ''}
              {a.approvedRate ? ` at ${a.approvedRate}% p.a.` : ''}
              {a.approvedTenure ? ` for ${a.approvedTenure} months` : ''}
            </p>
            {a.sellerNote && <p className="mt-0.5 whitespace-pre-line text-xs opacity-90">{a.sellerNote}</p>}
          </div>
        </div>
      )}

      {deciding && (
        <form onSubmit={sendDecision} className="mt-4 space-y-3 rounded-xl border border-brand/40 bg-brand-soft/40 p-4">
          <p className="text-sm font-semibold text-ink">
            {deciding === 'APPROVED' ? 'Approve this application' : deciding === 'REJECTED' ? 'Decline this application' : 'Mark as under review'}
          </p>

          {deciding === 'APPROVED' && type !== 'SERVICE' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">{loan ? 'Sanctioned amount (₹)' : 'Approved amount (₹)'}</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
              {loan && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink">Interest rate (% p.a.)</label>
                    <input
                      value={rate}
                      onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 6))}
                      inputMode="decimal"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink">Tenure (months)</label>
                    <input
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {sanctionQuote && (
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs font-semibold text-ink">What the borrower will be told</p>
              <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                {[
                  [INSTALMENT_WORD[sanctionQuote.repaymentFrequency] ?? 'EMI', formatRupees(sanctionQuote.instalment)],
                  ['Instalments', String(sanctionQuote.instalmentCount)],
                  ['Total interest', formatRupees(sanctionQuote.totalInterest)],
                  ['Net disbursal', formatRupees(sanctionQuote.netDisbursal)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-ink-muted">{label}</dt>
                    <dd className="font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Note to the applicant (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 1000))}
              rows={2}
              placeholder={
                deciding === 'APPROVED'
                  ? 'e.g. Visit the branch with the original PAN and Aadhaar to sign the agreement.'
                  : deciding === 'REJECTED'
                    ? 'e.g. Income proof did not meet the scheme requirement.'
                    : 'e.g. We are verifying your bank statement — expect an answer in 2 days.'
              }
              className={inputClass}
            />
          </div>

          <p className="text-xs text-ink-muted">This lands in {a.fullName}'s chat with {shopName}, with a notification.</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy !== null}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy === 'decision' ? 'Sending…' : 'Send'}
            </button>
            <button
              type="button"
              onClick={() => setDeciding(null)}
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
          onClick={() => openChat({ listingId, title: a.fullName, subtitle: `About: ${a.product.name}` })}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          <MessageCircle size={15} /> Chat
        </button>
        {!deciding && (
          <>
            {a.status !== 'APPROVED' && (
              <button
                type="button"
                onClick={() => startDeciding('APPROVED')}
                className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
              >
                <CheckCircle2 size={15} /> Approve
              </button>
            )}
            {a.status === 'APPLIED' && (
              <button
                type="button"
                onClick={() => startDeciding('UNDER_REVIEW')}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
              >
                <Search size={15} /> Mark under review
              </button>
            )}
            {a.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => startDeciding('REJECTED')}
                className="flex items-center gap-1.5 rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
              >
                <XCircle size={15} /> Decline
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}
