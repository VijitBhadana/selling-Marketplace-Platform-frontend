'use client';

import { useState } from 'react';
import {
  BadgeIndianRupee,
  Banknote,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  HandCoins,
  Landmark,
  Package,
  Percent,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CHARGE_TYPES,
  CHARGE_TYPE_LABELS,
  DOCUMENT_LABELS,
  DOCUMENT_TYPES,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  GST_RATE,
  INTEREST_TYPES,
  INTEREST_TYPE_HINTS,
  INTEREST_TYPE_LABELS,
  INSTALMENT_WORD,
  INVESTMENT_LABELS,
  INVESTMENT_TYPES,
  POLICY_LABELS,
  POLICY_TYPES,
  PREMIUM_FREQUENCIES,
  PREMIUM_LABELS,
  REPAYMENT_FREQUENCIES,
  REPAYMENT_LABELS,
  RETURN_TYPES,
  RETURN_TYPE_LABELS,
  RISK_LABELS,
  RISK_LEVELS,
  SECURITY_LABELS,
  SECURITY_TYPES,
  SERVICE_FEE_LABELS,
  SERVICE_FEE_UNITS,
  financeActionLabel,
  financeHighlights,
  financeItemType,
  financePriceText,
  formatFinanceDetails,
  loanChargeRows,
  loanEligibilityRows,
  loanQuote,
  rangeText,
  rateText,
  requiredDocuments,
  tenureText,
  type ChargeType,
  type FinanceDetails,
  type FinanceFormType,
  type FinanceFormValues,
  type FinanceItemType,
  type InsuranceDetails,
  type InvestmentDetails,
  type LoanDetails,
  type FinanceServiceDetails,
} from '@/lib/finance-details';
import { formatRupees } from '@/lib/booking-details';
import { withImageParams } from '@/lib/image-utils';
import { Chip, DetailsButton, Field, Group } from '@/components/clinic-details';

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10';

export type FinanceProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  priceType: 'FIXED' | 'CONTACT_FOR_PRICE';
  imageUrl: string | null;
  financeDetails?: FinanceDetails | null;
};

const TYPE_ICONS: Record<FinanceItemType, React.ReactNode> = {
  LOAN: <HandCoins size={15} />,
  INSURANCE: <ShieldCheck size={15} />,
  INVESTMENT: <TrendingUp size={15} />,
  SERVICE: <Landmark size={15} />,
};

// --- Seller side ------------------------------------------------------------------------

const TYPE_OPTIONS: { value: FinanceFormType; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    value: 'LOAN',
    label: 'Loan',
    icon: <HandCoins size={15} />,
    hint: 'A loan scheme — borrowers see the amount range, interest rate and type, tenure, every charge, who can apply and your conditions, work out their EMI, then apply with their papers.',
  },
  {
    value: 'INSURANCE',
    label: 'Insurance',
    icon: <ShieldCheck size={15} />,
    hint: 'A policy — buyers see the cover, premium, policy term, waiting period, what is and is not covered, and apply with their KYC.',
  },
  {
    value: 'INVESTMENT',
    label: 'Investment',
    icon: <TrendingUp size={15} />,
    hint: 'A mutual fund, SIP, FD, bond or demat plan — investors see the minimum, expected return, lock-in, risk and exit load.',
  },
  {
    value: 'SERVICE',
    label: 'Service',
    icon: <Landmark size={15} />,
    hint: 'A paid service — ITR or GST filing, bookkeeping, CIBIL report, mini bank, money transfer. Clients see the fee and what it covers.',
  },
  { value: 'OTHER', label: 'Other', icon: <Package size={15} />, hint: 'Anything else you sell that has no financial terms.' },
];

/** Is the agency adding a loan, a policy, an investment plan, a service, or anything else? */
export function FinanceTypePicker({ value, onChange }: { value: FinanceFormType; onChange: (value: FinanceFormType) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink">What are you adding?</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2.5 text-center text-xs font-medium leading-tight transition-all ${
              value === option.value
                ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand'
                : 'border-border bg-bg text-ink-muted hover:border-brand/50 hover:text-ink'
            }`}
          >
            {option.icon} {option.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{TYPE_OPTIONS.find((o) => o.value === value)?.hint}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

/** The loan / policy / investment / service part of the "Add" form. */
export function FinanceFieldsEditor({
  type,
  values,
  onChange,
}: {
  type: FinanceItemType;
  values: FinanceFormValues;
  onChange: (values: FinanceFormValues) => void;
}) {
  const set = (key: string, value: string | string[]) => onChange({ ...values, [key]: value });
  const text = (key: string) => (typeof values[key] === 'string' ? (values[key] as string) : '');
  const list = (key: string) => (Array.isArray(values[key]) ? (values[key] as string[]) : []);
  const toggle = (key: string, item: string) => set(key, list(key).includes(item) ? list(key).filter((v) => v !== item) : [...list(key), item]);

  const textInput = (key: string, placeholder: string, max = 120) => (
    <input value={text(key)} onChange={(e) => set(key, e.target.value.slice(0, max))} placeholder={placeholder} className={inputClass} />
  );
  const numberInput = (key: string, placeholder: string, maxDigits: number) => (
    <input
      value={text(key)}
      onChange={(e) => set(key, e.target.value.replace(/[^0-9]/g, '').slice(0, maxDigits))}
      placeholder={placeholder}
      inputMode="numeric"
      className={inputClass}
    />
  );
  // Rates and percentages take one decimal point (10.75%).
  const rateInput = (key: string, placeholder: string) => (
    <div className="relative">
      <input
        value={text(key)}
        onChange={(e) => set(key, e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 6))}
        placeholder={placeholder}
        inputMode="decimal"
        className={`${inputClass} pr-7`}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">%</span>
    </div>
  );
  const moneyInput = (key: string, placeholder: string) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
      <input
        value={text(key)}
        onChange={(e) => set(key, e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
        placeholder={placeholder}
        inputMode="numeric"
        className={`${inputClass} pl-8`}
      />
    </div>
  );
  const chips = (key: string, options: readonly string[], labels?: Record<string, string>, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Chip
          key={option}
          selected={multi ? list(key).includes(option) : text(key) === option}
          onClick={() => (multi ? toggle(key, option) : set(key, option))}
        >
          {labels?.[option] ?? option}
        </Chip>
      ))}
    </div>
  );
  const yesNo = (key: string, yes: string, no: string) => (
    <div className="flex gap-2">
      <Chip wide selected={text(key) === 'YES'} onClick={() => set(key, 'YES')}>
        {yes}
      </Chip>
      <Chip wide selected={text(key) !== 'YES'} onClick={() => set(key, 'NO')}>
        {no}
      </Chip>
    </div>
  );
  /** None / % of amount / flat ₹, with the figure box appearing once one is picked. */
  const chargeField = (label: string, typeKey: string, valueKey: string, hint?: string) => {
    const chargeType = (text(typeKey) || 'NONE') as ChargeType;
    return (
      <Field label={label}>
        <div className="flex flex-wrap gap-1.5">
          {CHARGE_TYPES.map((option) => (
            <Chip key={option} selected={chargeType === option} onClick={() => set(typeKey, option)}>
              {CHARGE_TYPE_LABELS[option]}
            </Chip>
          ))}
        </div>
        {chargeType !== 'NONE' && (
          <div className="mt-2 max-w-[200px]">{chargeType === 'PERCENT' ? rateInput(valueKey, 'e.g. 2') : moneyInput(valueKey, 'e.g. 1500')}</div>
        )}
        {hint && <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{hint}</p>}
      </Field>
    );
  };
  const documentsField = () => (
    <Field label="Documents you want with an application">
      <div className="flex flex-wrap gap-1.5">
        {DOCUMENT_TYPES.map((doc) => {
          const always = doc === 'PAN_CARD' || doc === 'AADHAAR_CARD';
          return (
            <Chip key={doc} selected={always || list('documents').includes(doc)} onClick={() => !always && toggle('documents', doc)}>
              {DOCUMENT_LABELS[doc]}
            </Chip>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
        PAN card and Aadhaar card are asked for on every application. Applicants upload each of these as a PDF or photo before they can apply.
      </p>
    </Field>
  );
  const termsField = (required: boolean, placeholder: string) => (
    <Field label="Terms & conditions" required={required}>
      <textarea
        value={text('terms')}
        onChange={(e) => set('terms', e.target.value.slice(0, 4000))}
        rows={5}
        placeholder={placeholder}
        className={`${inputClass} resize-y leading-relaxed`}
      />
      <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
        One condition per line. The applicant has to tick that they accept these before applying, and the wording is saved with their
        application — so editing it later never changes what someone already agreed to.
      </p>
    </Field>
  );

  if (type === 'LOAN') {
    return (
      <>
        <Section title="Loan amount & interest" icon={<BadgeIndianRupee size={13} className="text-brand" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum loan amount" required>
              {moneyInput('amountMin', 'e.g. 50000')}
            </Field>
            <Field label="Maximum loan amount">{moneyInput('amountMax', 'e.g. 500000')}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Interest rate (from)" required>
              {rateInput('interestRateMin', 'e.g. 10.5')}
            </Field>
            <Field label="Interest rate (up to)">{rateInput('interestRateMax', 'e.g. 16')}</Field>
          </div>
          <Field label="Interest is charged on" required>
            {chips('interestType', INTEREST_TYPES, INTEREST_TYPE_LABELS)}
            <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{INTEREST_TYPE_HINTS[text('interestType') || 'REDUCING']}</p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum tenure (months)" required>
              {numberInput('tenureMin', 'e.g. 12', 3)}
            </Field>
            <Field label="Maximum tenure (months)">{numberInput('tenureMax', 'e.g. 60', 3)}</Field>
          </div>
          <Field label="Repayment">{chips('repaymentFrequency', REPAYMENT_FREQUENCIES, REPAYMENT_LABELS)}</Field>
        </Section>

        <Section title="Charges" icon={<Percent size={13} className="text-brand" />}>
          {chargeField('Processing fee', 'processingFeeType', 'processingFee', 'Deducted before the money is paid out — borrowers see what will actually reach their account.')}
          {chargeField('Part-prepayment charge', 'prepaymentChargeType', 'prepaymentCharge')}
          {chargeField('Foreclosure / preclosure charge', 'foreclosureChargeType', 'foreclosureCharge')}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Late payment penalty (% per month)">{rateInput('latePaymentPenalty', 'e.g. 2')}</Field>
            <Field label="Cheque / ECS bounce charge">{moneyInput('bounceCharge', 'e.g. 500')}</Field>
          </div>
          <Field label="GST on charges">{yesNo('gstOnCharges', `Extra, at ${GST_RATE}%`, 'Included in the figures above')}</Field>
          <Field label="Any other charges">{textInput('otherCharges', 'e.g. Documentation ₹500, stamp duty at actuals', 500)}</Field>
        </Section>

        <Section title="Security & eligibility" icon={<ClipboardList size={13} className="text-brand" />}>
          <Field label="Security / collateral" required>
            {chips('securityType', SECURITY_TYPES, SECURITY_LABELS)}
          </Field>
          {text('securityType') !== 'UNSECURED' && (
            <Field label="What you take as security">{textInput('collateralNote', 'e.g. Gold ornaments, valued at 75% of market rate', 300)}</Field>
          )}
          <Field label="Guarantor">{yesNo('guarantorRequired', 'Guarantor required', 'No guarantor needed')}</Field>
          <Field label="Who can apply" required>
            {chips('employmentTypes', EMPLOYMENT_TYPES, EMPLOYMENT_LABELS, true)}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum age">{numberInput('minAge', 'e.g. 21', 2)}</Field>
            <Field label="Maximum age">{numberInput('maxAge', 'e.g. 60', 2)}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum monthly income">{moneyInput('minMonthlyIncome', 'e.g. 15000')}</Field>
            <Field label="Minimum CIBIL score">{numberInput('minCreditScore', 'e.g. 700', 3)}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum years in business">{numberInput('minBusinessYears', 'e.g. 2', 2)}</Field>
            <Field label="Money paid out within (days)">{numberInput('disbursalDays', 'e.g. 3', 3)}</Field>
          </div>
        </Section>

        <Section title="Papers & conditions" icon={<ScrollText size={13} className="text-brand" />}>
          {documentsField()}
          {termsField(true, 'e.g.\nEMI is due on the 5th of every month.\nThe loan can be recalled if three EMIs are missed.\nAll charges are as listed above; nothing else is payable.\nSanction is at the agency’s discretion after document verification.')}
        </Section>
      </>
    );
  }

  if (type === 'INSURANCE') {
    return (
      <>
        <Section title="Policy & cover" icon={<ShieldCheck size={13} className="text-brand" />}>
          <Field label="Type of insurance" required>
            {chips('policyType', POLICY_TYPES, POLICY_LABELS)}
          </Field>
          <Field label="Insurance company" required>
            {textInput('insurerName', 'e.g. LIC of India, Star Health')}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum cover (sum assured)" required>
              {moneyInput('coverMin', 'e.g. 300000')}
            </Field>
            <Field label="Maximum cover">{moneyInput('coverMax', 'e.g. 2500000')}</Field>
          </div>
          <Field label="Premium is paid" required>
            {chips('premiumFrequency', PREMIUM_FREQUENCIES, PREMIUM_LABELS)}
            <p className="mt-1.5 text-[11px] text-ink-muted">Enter the premium amount in the price box below.</p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Policy term (from, years)">{numberInput('policyTermMin', 'e.g. 1', 2)}</Field>
            <Field label="Policy term (to, years)">{numberInput('policyTermMax', 'e.g. 20', 2)}</Field>
          </div>
        </Section>

        <Section title="Eligibility & fine print" icon={<ClipboardList size={13} className="text-brand" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum entry age">{numberInput('entryAgeMin', 'e.g. 18', 2)}</Field>
            <Field label="Maximum entry age">{numberInput('entryAgeMax', 'e.g. 65', 2)}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Waiting period (days)">{numberInput('waitingPeriodDays', 'e.g. 30', 4)}</Field>
            <Field label="Free-look period (days)">{numberInput('freeLookDays', 'e.g. 15', 2)}</Field>
          </div>
          <Field label="Claim settlement ratio">{rateInput('claimRatio', 'e.g. 98.5')}</Field>
          <Field label="GST on premium">{yesNo('gstOnPremium', `Extra, at ${GST_RATE}%`, 'Included in the premium shown')}</Field>
          <Field label="Tax benefit">{yesNo('taxBenefit', 'Available (80C / 80D)', 'Not applicable')}</Field>
          <Field label="What is covered">
            <textarea
              value={text('coverageIncludes')}
              onChange={(e) => set('coverageIncludes', e.target.value.slice(0, 2000))}
              rows={3}
              placeholder={'One per line, e.g.\nHospitalisation and ICU\nPre and post hospitalisation for 60 days\nDay-care procedures'}
              className={`${inputClass} resize-y`}
            />
          </Field>
          <Field label="What is not covered">
            <textarea
              value={text('exclusions')}
              onChange={(e) => set('exclusions', e.target.value.slice(0, 2000))}
              rows={3}
              placeholder={'One per line, e.g.\nPre-existing illness for the first 2 years\nCosmetic treatment\nSelf-inflicted injury'}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </Section>

        <Section title="Papers & conditions" icon={<ScrollText size={13} className="text-brand" />}>
          {documentsField()}
          {termsField(true, 'e.g.\nCover starts only after the first premium is realised.\nClaims are settled by the insurer as per policy wording.\nThe policy lapses if a premium is not paid within the grace period.')}
        </Section>
      </>
    );
  }

  if (type === 'INVESTMENT') {
    return (
      <>
        <Section title="Plan & returns" icon={<TrendingUp size={13} className="text-brand" />}>
          <Field label="Type of investment" required>
            {chips('investmentType', INVESTMENT_TYPES, INVESTMENT_LABELS)}
          </Field>
          <Field label="Fund house / provider">{textInput('provider', 'e.g. SBI Mutual Fund, HDFC Bank')}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum investment" required>
              {moneyInput('minInvestment', 'e.g. 5000')}
            </Field>
            <Field label="Minimum SIP (per month)">{moneyInput('minSip', 'e.g. 500')}</Field>
          </div>
          <Field label="Return" required>
            {chips('returnType', RETURN_TYPES, RETURN_TYPE_LABELS)}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expected return (from)">{rateInput('expectedReturnMin', 'e.g. 7')}</Field>
            <Field label="Expected return (up to)">{rateInput('expectedReturnMax', 'e.g. 12')}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tenure (months)">{numberInput('tenureMonths', 'e.g. 60', 3)}</Field>
            <Field label="Lock-in (months)">{numberInput('lockInMonths', 'e.g. 36', 3)}</Field>
          </div>
          <Field label="Risk level" required>
            {chips('riskLevel', RISK_LEVELS, RISK_LABELS)}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Exit load">{rateInput('exitLoad', 'e.g. 1')}</Field>
            <Field label="Expense ratio">{rateInput('expenseRatio', 'e.g. 0.75')}</Field>
          </div>
          <Field label="Payout / maturity">{textInput('payoutNote', 'e.g. Interest paid quarterly, principal on maturity', 300)}</Field>
        </Section>

        <Section title="Papers & conditions" icon={<ScrollText size={13} className="text-brand" />}>
          {documentsField()}
          {termsField(true, 'e.g.\nReturns are indicative, not guaranteed — investments are subject to market risk.\nUnits are allotted at the NAV of the realisation date.\nExit before the lock-in period is not allowed.')}
        </Section>
      </>
    );
  }

  return (
    <>
      <Section title="Service & fee" icon={<Landmark size={13} className="text-brand" />}>
        <Field label="Fee is" required>
          {chips('feeUnit', SERVICE_FEE_UNITS, SERVICE_FEE_LABELS)}
          <p className="mt-1.5 text-[11px] text-ink-muted">Enter the fee amount in the price box below.</p>
        </Field>
        <Field label="Turnaround time (working days)">{numberInput('turnaroundDays', 'e.g. 3', 3)}</Field>
        <Field label="Government / portal fee">{yesNo('govtFeeExtra', 'Charged extra, at actuals', 'Included in the fee')}</Field>
        <Field label="GST">{yesNo('gstExtra', `Extra, at ${GST_RATE}%`, 'Included in the fee shown')}</Field>
        <Field label="What the fee includes">
          <textarea
            value={text('includes')}
            onChange={(e) => set('includes', e.target.value.slice(0, 2000))}
            rows={3}
            placeholder={'One per line, e.g.\nITR-1 preparation and e-filing\nComputation sheet and acknowledgement\nOne revision if the department raises a query'}
            className={`${inputClass} resize-y`}
          />
        </Field>
      </Section>

      <Section title="Papers & conditions" icon={<ScrollText size={13} className="text-brand" />}>
        {documentsField()}
        {termsField(false, 'e.g.\nThe fee is payable in advance.\nPenalties or interest charged by the department are not our liability.')}
      </Section>
    </>
  );
}

// --- Buyer side -------------------------------------------------------------------------

type CardProps<P extends FinanceProduct> = {
  product: P;
  isOwner: boolean;
  /** The buyer's own application to this scheme, when they have one. */
  appliedStatus?: string;
  actions: React.ReactNode;
  onView: () => void;
  onApply: () => void;
};

function ApplyButton({ label, appliedStatus, onClick }: { label: string; appliedStatus?: string; onClick: () => void }) {
  if (appliedStatus) {
    return (
      <span className="flex flex-[1.4] items-center justify-center gap-1 rounded-full bg-brand-soft px-2 py-1.5 text-[11px] font-semibold text-brand">
        <CheckCircle2 size={12} /> {appliedStatus}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-[1.4] rounded-full bg-brand px-2 py-1.5 text-[11px] font-semibold text-brand-ink transition-opacity hover:opacity-90"
    >
      {label}
    </button>
  );
}

function Tag({ strong, children }: { strong?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        strong ? 'border-brand/30 bg-brand-soft text-brand' : 'border-border bg-bg text-ink-muted'
      }`}
    >
      {children}
    </span>
  );
}

function SchemeCard<P extends FinanceProduct>(props: CardProps<P>) {
  const { product: p, isOwner, appliedStatus, actions, onView, onApply } = props;
  const d = p.financeDetails;
  const type = financeItemType(d);
  const highlights = financeHighlights(d);
  const docs = requiredDocuments(d);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-3">
      <button type="button" onClick={onView} className="flex items-start gap-3 text-left">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-brand-soft text-brand">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withImageParams(p.imageUrl, 'w=160&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
          ) : type ? (
            TYPE_ICONS[type]
          ) : (
            <Package size={22} />
          )}
        </span>
        <span className="min-w-0 flex-1 pr-14">
          <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
          <span className="block truncate text-xs font-semibold text-brand">{financePriceText(p)}</span>
          {d?.type === 'LOAN' && (
            <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{rangeText(d.amountMin, d.amountMax)}</span>
          )}
          {d?.type === 'INSURANCE' && <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{d.insurerName}</span>}
          {d?.type === 'INVESTMENT' && d.provider && <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{d.provider}</span>}
        </span>
      </button>
      {actions}

      {highlights.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {highlights.map((fact, i) => (
            <Tag key={fact} strong={i === 0}>
              {fact}
            </Tag>
          ))}
        </div>
      )}

      {d?.type === 'LOAN' && (
        <div className="mt-2 space-y-1 rounded-lg bg-bg px-2.5 py-2 text-[11px] text-ink-muted">
          <p className="flex items-center gap-1.5">
            <Calculator size={12} className="shrink-0 text-brand" />
            <span className="truncate">
              {INSTALMENT_WORD[d.repaymentFrequency] ?? 'EMI'} from{' '}
              <span className="font-semibold text-ink">
                {formatRupees(loanQuote(d, d.amountMin, d.tenureMax ?? d.tenureMin).instalment)}
              </span>
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <FileText size={12} className="shrink-0 text-brand" />
            <span className="truncate">{docs.length} documents needed</span>
          </p>
        </div>
      )}

      <div className="mt-auto flex gap-1.5 pt-3">
        <DetailsButton onClick={onView} />
        {!isOwner && <ApplyButton label={financeActionLabel(d)} appliedStatus={appliedStatus} onClick={onApply} />}
      </div>
    </div>
  );
}

function OtherTile<P extends FinanceProduct>({ product: p, isOwner, actions, onView }: CardProps<P>) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border">
      <button type="button" onClick={onView} className="block aspect-square w-full bg-brand-soft">
        {p.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withImageParams(p.imageUrl, 'w=300&q=75&auto=format&fit=crop')} alt={p.name} className="h-full w-full object-cover" />
        )}
      </button>
      {isOwner && actions}
      <div className="p-2">
        <p className="truncate text-xs font-medium text-ink">{p.name}</p>
        <p className="truncate text-[11px] font-semibold text-brand">{financePriceText(p)}</p>
      </div>
    </div>
  );
}

/** An agency's items, grouped: loans, policies, investment plans, services, then the rest. */
export function FinanceProductGroups<P extends FinanceProduct>({
  products,
  isOwner,
  appliedStatus,
  ownerActions,
  onView,
  onApply,
}: {
  products: P[];
  isOwner: boolean;
  appliedStatus: (product: P) => string | undefined;
  ownerActions: (product: P) => React.ReactNode;
  onView: (product: P) => void;
  onApply: (product: P) => void;
}) {
  const ofType = (type: FinanceItemType | null) => products.filter((p) => financeItemType(p.financeDetails) === type);
  const cardProps = (p: P): CardProps<P> => ({
    product: p,
    isOwner,
    appliedStatus: appliedStatus(p),
    actions: isOwner ? ownerActions(p) : null,
    onView: () => onView(p),
    onApply: () => onApply(p),
  });

  const groups: { type: FinanceItemType; title: string; icon: React.ReactNode }[] = [
    { type: 'LOAN', title: 'Loan schemes', icon: <HandCoins size={14} /> },
    { type: 'INSURANCE', title: 'Insurance policies', icon: <ShieldCheck size={14} /> },
    { type: 'INVESTMENT', title: 'Investment plans', icon: <TrendingUp size={14} /> },
    { type: 'SERVICE', title: 'Services', icon: <Landmark size={14} /> },
  ];
  const others = ofType(null);

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const items = ofType(group.type);
        if (items.length === 0) return null;
        return (
          <Group key={group.type} icon={group.icon} title={group.title} count={items.length}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <SchemeCard key={p.id} {...cardProps(p)} />
              ))}
            </div>
          </Group>
        );
      })}

      {others.length > 0 && (
        <Group icon={<Package size={14} />} title="Other products" count={others.length}>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {others.map((p) => (
              <OtherTile key={p.id} {...cardProps(p)} />
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}

function FactGrid({ rows, className = '' }: { rows: { label: string; value: string }[]; className?: string }) {
  if (rows.length === 0) return null;
  return (
    <dl className={`grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-border bg-bg p-3.5 text-xs ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className={row.value.length > 28 ? 'col-span-2' : ''}>
          <dt className="text-[11px] text-ink-muted">{row.label}</dt>
          <dd className="mt-0.5 break-words font-medium text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FinanceFacts({ details, className = '' }: { details: FinanceDetails | null | undefined; className?: string }) {
  return <FactGrid rows={formatFinanceDetails(details)} className={className} />;
}

function BulletList({ title, text }: { title: string; text?: string }) {
  const lines = (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold text-ink">{title}</h4>
      <ul className="space-y-1">
        {lines.map((line, i) => (
          <li key={`${line}-${i}`} className="flex gap-2 text-xs leading-relaxed text-ink-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A row of the repayment working — label on the left, figure on the right. */
function QuoteRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? 'border-t border-border pt-1.5' : ''}`}>
      <span className="text-[11px] text-ink-muted">{label}</span>
      <span className={`shrink-0 text-xs font-semibold ${strong ? 'text-brand' : 'text-ink'}`}>{value}</span>
    </div>
  );
}

/**
 * The borrower's own sums: they pick an amount and a tenure and see the instalment, the
 * interest, the processing fee, the GST on it and what actually reaches their account —
 * all worked out from the agency's published terms, before they apply.
 */
export function LoanCalculator({ details, compact = false }: { details: LoanDetails; compact?: boolean }) {
  const maxAmount = details.amountMax ?? details.amountMin * 10;
  const maxTenure = details.tenureMax ?? details.tenureMin;
  const [amount, setAmount] = useState(Math.round((details.amountMin + maxAmount) / 2));
  const [tenure, setTenure] = useState(maxTenure);
  const quote = loanQuote(details, amount, tenure);
  const word = INSTALMENT_WORD[details.repaymentFrequency] ?? 'EMI';

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-soft/30 p-3.5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
        <Calculator size={13} /> Work out your {word}
      </p>

      <label className="block text-[11px] font-medium text-ink">
        Loan amount: <span className="font-semibold text-brand">{formatRupees(amount)}</span>
      </label>
      <input
        type="range"
        min={details.amountMin}
        max={maxAmount}
        step={Math.max(1000, Math.round((maxAmount - details.amountMin) / 100))}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mt-1.5 w-full accent-[rgb(var(--brand))]"
      />

      <label className="mt-3 block text-[11px] font-medium text-ink">
        Tenure: <span className="font-semibold text-brand">{tenure} months</span>
      </label>
      <input
        type="range"
        min={details.tenureMin}
        max={Math.max(maxTenure, details.tenureMin + 1)}
        step={1}
        value={tenure}
        onChange={(e) => setTenure(Number(e.target.value))}
        className="mt-1.5 w-full accent-[rgb(var(--brand))]"
      />

      <div className="mt-3 space-y-1.5 rounded-lg bg-surface p-3">
        <QuoteRow label={`Your ${word}`} value={formatRupees(quote.instalment)} strong />
        <QuoteRow label={`Instalments (${INTEREST_TYPE_LABELS[quote.interestType]})`} value={`${quote.instalmentCount} × ${formatRupees(quote.instalment)}`} />
        <QuoteRow label={`Interest at ${quote.annualRate}% p.a.`} value={formatRupees(quote.totalInterest)} />
        <QuoteRow label="Total you repay" value={formatRupees(quote.totalPayable)} />
        {quote.processingFee > 0 && (
          <QuoteRow
            label={`Processing fee${quote.gstOnFee ? ` + ${GST_RATE}% GST` : ''}`}
            value={`− ${formatRupees(quote.processingFee + quote.gstOnFee)}`}
          />
        )}
        <QuoteRow label="Credited to your account" value={formatRupees(quote.netDisbursal)} strong />
      </div>

      {!compact && (
        <p className="mt-2 text-[10px] leading-snug text-ink-muted">
          Worked out from this scheme's published rate. The agency's final figures are confirmed after they check your documents.
        </p>
      )}
    </div>
  );
}

/** Buyer side: the full scheme sheet — terms, charges, eligibility, papers and an Apply action. */
export function FinanceDetailsModal({
  product,
  appliedStatus,
  actionLabel,
  onAction,
  onClose,
}: {
  product: FinanceProduct;
  appliedStatus?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  const details = product.financeDetails;
  const type = financeItemType(details);
  const loan = type === 'LOAN' ? (details as LoanDetails) : null;
  const policy = type === 'INSURANCE' ? (details as InsuranceDetails) : null;
  const plan = type === 'INVESTMENT' ? (details as InvestmentDetails) : null;
  const service = type === 'SERVICE' ? (details as FinanceServiceDetails) : null;
  const docs = requiredDocuments(details);

  const kicker = loan
    ? `Loan · ${rateText(loan.interestRateMin, loan.interestRateMax)} · ${tenureText(loan.tenureMin, loan.tenureMax)}`
    : policy
      ? `${POLICY_LABELS[policy.policyType]} · ${policy.insurerName}`
      : plan
        ? `${INVESTMENT_LABELS[plan.investmentType]} · ${RISK_LABELS[plan.riskLevel]}`
        : service
          ? `Service · ${SERVICE_FEE_LABELS[service.feeUnit]}`
          : 'Product';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-lg animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          <div className={`relative flex items-center justify-center bg-brand-soft text-brand ${product.imageUrl ? 'aspect-video' : 'h-28'}`}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={withImageParams(product.imageUrl, 'w=900&q=80&auto=format&fit=crop')} alt={product.name} className="h-full w-full object-cover" />
            ) : loan ? (
              <HandCoins size={36} />
            ) : policy ? (
              <ShieldCheck size={36} />
            ) : plan ? (
              <TrendingUp size={36} />
            ) : service ? (
              <Landmark size={36} />
            ) : (
              <Package size={36} />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{kicker}</p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h3>
              <p className="mt-0.5 text-base font-bold text-brand">{financePriceText(product)}</p>
              {loan && <p className="mt-0.5 text-xs text-ink-muted">{rangeText(loan.amountMin, loan.amountMax)}</p>}
            </div>

            {loan && <LoanCalculator details={loan} />}

            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Banknote size={13} className="text-brand" /> Scheme terms
              </h4>
              <FinanceFacts details={details} />
            </div>

            {loan && (
              <>
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Percent size={13} className="text-brand" /> Charges
                  </h4>
                  <FactGrid rows={loanChargeRows(loan)} />
                </div>
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <ClipboardList size={13} className="text-brand" /> Who can apply
                  </h4>
                  <FactGrid rows={loanEligibilityRows(loan)} />
                </div>
              </>
            )}

            {policy && (
              <>
                <BulletList title="What is covered" text={policy.coverageIncludes} />
                <BulletList title="What is not covered" text={policy.exclusions} />
              </>
            )}

            {service && <BulletList title="What the fee includes" text={service.includes} />}

            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                <FileText size={13} className="text-brand" /> Documents you will need
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {docs.map((doc) => (
                  <span key={doc} className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
                    {DOCUMENT_LABELS[doc]}
                  </span>
                ))}
              </div>
            </div>

            {details?.terms && <BulletList title="Terms & conditions" text={details.terms} />}

            {product.description && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-ink">About this {loan ? 'scheme' : policy ? 'policy' : plan ? 'plan' : 'service'}</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {(actionLabel || appliedStatus) && (
          <div className="flex gap-2 border-t border-border bg-bg/60 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              Close
            </button>
            {appliedStatus ? (
              <span className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-brand-soft px-4 py-2.5 text-sm font-semibold text-brand">
                <CheckCircle2 size={15} /> {appliedStatus}
              </span>
            ) : (
              actionLabel &&
              onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="flex-[2] rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_8px_20px_-10px_rgb(var(--brand)/calc(0.9*var(--glow)))] transition-opacity hover:opacity-90"
                >
                  {actionLabel}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
