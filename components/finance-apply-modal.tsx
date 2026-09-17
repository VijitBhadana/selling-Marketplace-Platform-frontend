'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, FileText, HandCoins, Paperclip, ShieldCheck, Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { formatRupees } from '@/lib/booking-details';
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_LABELS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_NUMBER_RULES,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  INSTALMENT_WORD,
  amountFieldLabel,
  documentToDataUrl,
  eligibilityProblem,
  financeItemType,
  loanQuote,
  rangeText,
  requiredDocuments,
  tenureText,
  type FinanceDetails,
  type LoanDetails,
  type MyFinanceApplication,
} from '@/lib/finance-details';
import { LoanCalculator } from '@/components/finance-details';

const inputClass =
  'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-ink-muted">{hint}</p>}
    </div>
  );
}

type UploadedDocument = { file: File; dataUrl: string };

/**
 * One paper the agency asked for: the file itself, plus the card number where the document
 * carries one (PAN, Aadhaar) — checked here so the applicant fixes a typo before uploading
 * the rest, and checked again on the server.
 */
function DocumentRow({
  docType,
  uploaded,
  number,
  error,
  onPick,
  onNumber,
  onRemove,
}: {
  docType: string;
  uploaded?: UploadedDocument;
  number: string;
  error?: string;
  onPick: (file: File) => void;
  onNumber: (value: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rule = DOCUMENT_NUMBER_RULES[docType];

  return (
    <div className={`rounded-xl border p-3 ${error ? 'border-accent/50 bg-accent/5' : 'border-border bg-bg/50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <FileText size={14} className="shrink-0 text-brand" /> {DOCUMENT_LABELS[docType] ?? docType}
          <span className="text-accent">*</span>
        </p>
        {uploaded ? (
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Paperclip size={12} className="text-brand" />
            <span className="max-w-[140px] truncate">{uploaded.file.name}</span>
            <button type="button" onClick={onRemove} aria-label={`Remove ${DOCUMENT_LABELS[docType]}`} className="text-ink-muted hover:text-accent">
              <X size={13} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Upload size={13} /> Upload
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={DOCUMENT_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onPick(file);
          }}
        />
      </div>

      {rule && (
        <input
          value={number}
          onChange={(e) => onNumber(e.target.value.toUpperCase().slice(0, 20))}
          placeholder={`${rule.label} — ${rule.placeholder}`}
          className={`${inputClass} mt-2`}
        />
      )}
      {error && <p className="mt-1.5 text-[11px] font-medium text-accent">{error}</p>}
    </div>
  );
}

/**
 * The buyer's application for a scheme: who they are, what they earn, what they are asking
 * for, every paper the agency wants, and a tick against the agency's written conditions.
 * Nothing goes through the cart — the agency reads it and approves or rejects.
 */
export function FinanceApplyModal({
  product,
  shopName,
  onClose,
  onApplied,
}: {
  product: { id: string; name: string; price: string | null; financeDetails?: FinanceDetails | null };
  shopName: string;
  onClose: () => void;
  onApplied: (application: MyFinanceApplication) => void;
}) {
  const { user, token } = useAuth();
  const details = product.financeDetails ?? null;
  const type = financeItemType(details);
  const loan = type === 'LOAN' ? (details as LoanDetails) : null;
  const docs = useMemo(() => requiredDocuments(details), [details]);

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [existingEmi, setExistingEmi] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [amount, setAmount] = useState(loan ? String(loan.amountMin) : '');
  const [tenure, setTenure] = useState(loan ? String(loan.tenureMax ?? loan.tenureMin) : '');
  const [purpose, setPurpose] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [accepted, setAccepted] = useState(false);

  const [uploads, setUploads] = useState<Record<string, UploadedDocument>>({});
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  async function pickDocument(docType: string, file: File) {
    if (file.size > DOCUMENT_MAX_BYTES) {
      setDocErrors((prev) => ({ ...prev, [docType]: 'This file is over 5 MB — upload a smaller scan or photo.' }));
      return;
    }
    try {
      const dataUrl = await documentToDataUrl(file);
      setUploads((prev) => ({ ...prev, [docType]: { file, dataUrl } }));
      setDocErrors((prev) => ({ ...prev, [docType]: '' }));
    } catch {
      setDocErrors((prev) => ({ ...prev, [docType]: 'Could not read that file — try another one.' }));
    }
  }

  const amountNumber = amount ? Number(amount) : undefined;
  const tenureNumber = tenure ? Number(tenure) : undefined;
  const quote = loan && amountNumber && tenureNumber ? loanQuote(loan, amountNumber, tenureNumber) : null;

  // The agency's own rules, checked as the form is filled in so nothing is uploaded in vain.
  const eligibility = details
    ? eligibilityProblem(details, {
        amount: amountNumber,
        tenure: tenureNumber,
        occupation: occupation || undefined,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        creditScore: creditScore ? Number(creditScore) : undefined,
        dateOfBirth: dateOfBirth || undefined,
      })
    : null;

  const missingDocs = docs.filter((doc) => !uploads[doc]);
  const badNumbers = docs.filter((doc) => {
    const rule = DOCUMENT_NUMBER_RULES[doc];
    return rule && !rule.test((numbers[doc] ?? '').replace(/\s+/g, '').toUpperCase());
  });

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    phone.trim() &&
    address.trim() &&
    (!loan || (amountNumber && tenureNumber)) &&
    (type !== 'INSURANCE' && type !== 'INVESTMENT' ? true : !!amountNumber) &&
    accepted &&
    missingDocs.length === 0 &&
    badNumbers.length === 0 &&
    !eligibility;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const application = await api.finance.apply(
        product.id,
        {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          dateOfBirth: dateOfBirth || undefined,
          address: address.trim(),
          city: city.trim() || undefined,
          pincode: pincode.trim() || undefined,
          occupation: occupation || undefined,
          employerName: employerName.trim() || undefined,
          monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
          existingEmi: existingEmi ? Number(existingEmi) : undefined,
          creditScore: creditScore ? Number(creditScore) : undefined,
          requestedAmount: amountNumber,
          tenureMonths: tenureNumber,
          purpose: purpose.trim() || undefined,
          nomineeName: nomineeName.trim() || undefined,
          nomineeRelation: nomineeRelation.trim() || undefined,
          acceptedTerms: true,
          documents: docs.map((docType) => ({
            docType,
            docNumber: numbers[docType]?.replace(/\s+/g, '').toUpperCase() || undefined,
            fileName: uploads[docType].file.name,
            dataUrl: uploads[docType].dataUrl,
          })),
        },
        token,
      );
      onApplied({
        id: application.id,
        productId: application.productId,
        listingId: application.listingId,
        status: application.status,
        requestedAmount: application.requestedAmount,
        approvedAmount: application.approvedAmount,
        sellerNote: application.sellerNote,
        appliedAt: application.appliedAt,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not send your application.');
    } finally {
      setSubmitting(false);
    }
  }

  const askNominee = type === 'INSURANCE' || type === 'INVESTMENT';

  // Portalled to <body>: scheme cards use hover transforms, which would otherwise become
  // the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onMouseDown={() => !submitting && onClose()} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Apply for ${product.name}`}
        className="relative flex max-h-[92vh] w-full max-w-2xl animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ animationDuration: '0.22s' }}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {loan ? <HandCoins size={18} /> : <ShieldCheck size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">Apply for {product.name}</p>
            <p className="truncate text-xs text-ink-muted">{shopName}</p>
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
              {shopName} has your application and your documents. Their decision — and, for a loan, the amount, rate and instalment they
              sanction — arrives in your chat with this shop, along with a notification.
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
              {/* What they're asking for */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {loan ? 'What you want to borrow' : 'What you are applying for'}
                </h3>
                {type && type !== 'SERVICE' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={amountFieldLabel(type)}
                      required
                      hint={loan ? rangeText(loan.amountMin, loan.amountMax) : undefined}
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
                        <input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                          inputMode="numeric"
                          placeholder="e.g. 200000"
                          className={`${inputClass} pl-8`}
                        />
                      </div>
                    </Field>
                    {loan && (
                      <Field label="Repay over (months)" required hint={tenureText(loan.tenureMin, loan.tenureMax)}>
                        <input
                          value={tenure}
                          onChange={(e) => setTenure(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                          inputMode="numeric"
                          placeholder="e.g. 36"
                          className={inputClass}
                        />
                      </Field>
                    )}
                  </div>
                )}

                {quote && (
                  <div className="rounded-xl border border-border bg-bg/50 p-3.5">
                    <p className="text-xs font-semibold text-ink">Your repayment, on this scheme's terms</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                      {[
                        [INSTALMENT_WORD[quote.repaymentFrequency] ?? 'EMI', formatRupees(quote.instalment)],
                        ['Instalments', String(quote.instalmentCount)],
                        ['Total interest', formatRupees(quote.totalInterest)],
                        ['Total repayable', formatRupees(quote.totalPayable)],
                        ...(quote.processingFee ? ([['Processing fee', formatRupees(quote.processingFee + quote.gstOnFee)]] as [string, string][]) : []),
                        ['You receive', formatRupees(quote.netDisbursal)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-[11px] text-ink-muted">{label}</dt>
                          <dd className="font-semibold text-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-2 text-[10px] leading-snug text-ink-muted">
                      These figures are saved with your application, so later changes to the scheme cannot change what you applied under.
                    </p>
                  </div>
                )}

                <Field label={loan ? 'What the loan is for' : 'Anything the agency should know'}>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value.slice(0, 500))}
                    rows={2}
                    placeholder={loan ? 'e.g. Shop renovation' : 'e.g. I already hold a policy with you'}
                    className={`${inputClass} resize-y`}
                  />
                </Field>
              </section>

              {/* Who they are */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Your details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name (as on PAN)" required>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value.slice(0, 100))} className={inputClass} />
                  </Field>
                  <Field label="Date of birth">
                    <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
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
                </div>
                <Field label="Address" required>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                    rows={2}
                    placeholder="House / street, area"
                    className={`${inputClass} resize-y`}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City">
                    <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 80))} className={inputClass} />
                  </Field>
                  <Field label="Pincode">
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              {/* What they earn */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Income & employment</h3>
                <Field label="What do you do?" required={!!loan?.employmentTypes?.length}>
                  <div className="flex flex-wrap gap-1.5">
                    {EMPLOYMENT_TYPES.map((option) => {
                      const allowed = !loan?.employmentTypes?.length || loan.employmentTypes.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={!allowed}
                          onClick={() => setOccupation(option)}
                          aria-pressed={occupation === option}
                          title={allowed ? undefined : 'This scheme is not open to this employment type'}
                          className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                            occupation === option
                              ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand'
                              : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
                          }`}
                        >
                          {EMPLOYMENT_LABELS[option]}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Employer / business name">
                    <input value={employerName} onChange={(e) => setEmployerName(e.target.value.slice(0, 120))} className={inputClass} />
                  </Field>
                  <Field
                    label="Monthly income (₹)"
                    required={!!loan?.minMonthlyIncome}
                    hint={loan?.minMonthlyIncome ? `This scheme needs at least ${formatRupees(loan.minMonthlyIncome)}.` : undefined}
                  >
                    <input
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </Field>
                  {loan && (
                    <>
                      <Field label="EMIs you already pay (₹ / month)">
                        <input
                          value={existingEmi}
                          onChange={(e) => setExistingEmi(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </Field>
                      <Field
                        label="CIBIL score"
                        hint={loan.minCreditScore ? `This scheme needs at least ${loan.minCreditScore}.` : 'If you know it.'}
                      >
                        <input
                          value={creditScore}
                          onChange={(e) => setCreditScore(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </Field>
                    </>
                  )}
                </div>
                {askNominee && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nominee name">
                      <input value={nomineeName} onChange={(e) => setNomineeName(e.target.value.slice(0, 100))} className={inputClass} />
                    </Field>
                    <Field label="Nominee relation">
                      <input
                        value={nomineeRelation}
                        onChange={(e) => setNomineeRelation(e.target.value.slice(0, 60))}
                        placeholder="e.g. Spouse"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}
              </section>

              {/* Papers */}
              <section className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Documents</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Upload each paper as a PDF or a clear photo, up to 5 MB each. Only {shopName} can open them.
                  </p>
                </div>
                {docs.map((docType) => (
                  <DocumentRow
                    key={docType}
                    docType={docType}
                    uploaded={uploads[docType]}
                    number={numbers[docType] ?? ''}
                    error={docErrors[docType] || undefined}
                    onPick={(file) => pickDocument(docType, file)}
                    onNumber={(value) => setNumbers((prev) => ({ ...prev, [docType]: value }))}
                    onRemove={() =>
                      setUploads((prev) => {
                        const next = { ...prev };
                        delete next[docType];
                        return next;
                      })
                    }
                  />
                ))}
              </section>

              {/* Conditions */}
              {details?.terms && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">Terms & conditions</h3>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-bg/50 p-3.5">
                    <p className="whitespace-pre-line text-xs leading-relaxed text-ink-muted">{details.terms}</p>
                  </div>
                </section>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-bg/50 p-3.5">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
                />
                <span className="text-xs leading-relaxed text-ink-muted">
                  I have read and accept {shopName}'s terms & conditions{loan ? ', the interest rate and every charge listed above' : ''}, and I
                  confirm that the details and documents I am sending are mine and correct.
                </span>
              </label>

              {eligibility && (
                <p className="rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs font-medium text-accent">{eligibility}</p>
              )}
              {!eligibility && missingDocs.length > 0 && (
                <p className="text-[11px] leading-snug text-ink-muted">
                  Still needed: <span className="font-medium text-ink">{missingDocs.map((d) => DOCUMENT_LABELS[d]).join(', ')}</span>
                </p>
              )}
              {error && <p className="rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs font-medium text-accent">{error}</p>}
            </div>

            <div className="flex gap-2 border-t border-border bg-bg/60 px-5 py-3.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="flex-[2] rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/0.9)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:shadow-none"
              >
                {submitting ? 'Sending…' : 'Send application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
