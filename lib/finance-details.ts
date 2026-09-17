// Financing Cloude: an agency, DSA, bank correspondent, CA firm or advisor lists what it
// offers as products — a LOAN scheme (amount range, rate, tenure, every charge, eligibility,
// the papers it wants and its written conditions), an INSURANCE policy, an INVESTMENT
// product or a paid SERVICE (ITR / GST filing, accounting, mini bank...). Buyers don't
// "buy" these: they apply, upload their KYC papers, and the agency approves or rejects.
// Mirrors backend/src/modules/products/finance-details.ts and finance/quote.ts.

import { formatRupees } from './booking-details';

export const FINANCING_CLOUDE_SLUG = 'financing';

export type FinanceItemType = 'LOAN' | 'INSURANCE' | 'INVESTMENT' | 'SERVICE';

export function isFinanceCloude(cloudeSlug?: string | null) {
  return cloudeSlug === FINANCING_CLOUDE_SLUG;
}

export type ChargeType = 'NONE' | 'PERCENT' | 'FIXED';

export type LoanDetails = {
  type: 'LOAN';
  amountMin: number;
  amountMax?: number;
  interestRateMin: number;
  interestRateMax?: number;
  interestType: 'REDUCING' | 'FLAT';
  tenureMin: number;
  tenureMax?: number;
  repaymentFrequency: 'MONTHLY' | 'WEEKLY' | 'DAILY';
  processingFeeType: ChargeType;
  processingFee?: number;
  prepaymentChargeType: ChargeType;
  prepaymentCharge?: number;
  foreclosureChargeType: ChargeType;
  foreclosureCharge?: number;
  latePaymentPenalty?: number;
  bounceCharge?: number;
  gstOnCharges: boolean;
  otherCharges?: string;
  securityType: string;
  collateralNote?: string;
  guarantorRequired: boolean;
  employmentTypes: string[];
  minAge?: number;
  maxAge?: number;
  minMonthlyIncome?: number;
  minCreditScore?: number;
  minBusinessYears?: number;
  disbursalDays?: number;
  documents: string[];
  terms: string;
};

export type InsuranceDetails = {
  type: 'INSURANCE';
  policyType: string;
  insurerName: string;
  coverMin: number;
  coverMax?: number;
  premiumFrequency: string;
  policyTermMin?: number;
  policyTermMax?: number;
  entryAgeMin?: number;
  entryAgeMax?: number;
  waitingPeriodDays?: number;
  claimRatio?: number;
  freeLookDays?: number;
  gstOnPremium: boolean;
  taxBenefit: boolean;
  coverageIncludes?: string;
  exclusions?: string;
  documents: string[];
  terms: string;
};

export type InvestmentDetails = {
  type: 'INVESTMENT';
  investmentType: string;
  provider?: string;
  minInvestment: number;
  minSip?: number;
  returnType: 'FIXED' | 'MARKET_LINKED';
  expectedReturnMin?: number;
  expectedReturnMax?: number;
  tenureMonths?: number;
  lockInMonths?: number;
  riskLevel: string;
  exitLoad?: number;
  expenseRatio?: number;
  payoutNote?: string;
  documents: string[];
  terms: string;
};

export type FinanceServiceDetails = {
  type: 'SERVICE';
  feeUnit: string;
  turnaroundDays?: number;
  govtFeeExtra: boolean;
  gstExtra: boolean;
  includes?: string;
  documents: string[];
  terms?: string;
};

export type FinanceDetails = LoanDetails | InsuranceDetails | InvestmentDetails | FinanceServiceDetails;

const ITEM_TYPES: FinanceItemType[] = ['LOAN', 'INSURANCE', 'INVESTMENT', 'SERVICE'];

export function financeItemType(details?: FinanceDetails | null): FinanceItemType | null {
  return details && ITEM_TYPES.includes(details.type) ? details.type : null;
}

// --- Option lists & labels -------------------------------------------------------------

export const INTEREST_TYPES = ['REDUCING', 'FLAT'];
export const INTEREST_TYPE_LABELS: Record<string, string> = { REDUCING: 'Reducing balance', FLAT: 'Flat rate' };
export const INTEREST_TYPE_HINTS: Record<string, string> = {
  REDUCING: 'Interest is charged only on what is still owed — the usual bank / NBFC method.',
  FLAT: 'Interest is charged on the full amount for the whole tenure — works out dearer than the same rate on reducing balance.',
};

export const REPAYMENT_FREQUENCIES = ['MONTHLY', 'WEEKLY', 'DAILY'];
export const REPAYMENT_LABELS: Record<string, string> = { MONTHLY: 'Monthly EMI', WEEKLY: 'Weekly', DAILY: 'Daily' };
export const INSTALMENT_WORD: Record<string, string> = { MONTHLY: 'EMI', WEEKLY: 'weekly instalment', DAILY: 'daily instalment' };

export const CHARGE_TYPES: ChargeType[] = ['NONE', 'PERCENT', 'FIXED'];
export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = { NONE: 'None', PERCENT: '% of amount', FIXED: 'Flat ₹' };

export const SECURITY_TYPES = ['UNSECURED', 'GOLD', 'PROPERTY', 'VEHICLE', 'FD', 'OTHER'];
export const SECURITY_LABELS: Record<string, string> = {
  UNSECURED: 'Unsecured (no security)',
  GOLD: 'Gold pledged',
  PROPERTY: 'Property mortgage',
  VEHICLE: 'Vehicle hypothecation',
  FD: 'Against fixed deposit',
  OTHER: 'Other security',
};

export const EMPLOYMENT_TYPES = ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'FARMER', 'STUDENT', 'PENSIONER'];
export const EMPLOYMENT_LABELS: Record<string, string> = {
  SALARIED: 'Salaried',
  SELF_EMPLOYED: 'Self-employed',
  BUSINESS: 'Business owner',
  FARMER: 'Farmer',
  STUDENT: 'Student',
  PENSIONER: 'Pensioner',
};

export const POLICY_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY', 'OTHER'];
export const POLICY_LABELS: Record<string, string> = {
  LIFE: 'Life insurance',
  HEALTH: 'Health insurance',
  VEHICLE: 'Vehicle insurance',
  PROPERTY: 'Property / general insurance',
  OTHER: 'Other insurance',
};

export const PREMIUM_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'SINGLE'];
export const PREMIUM_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-yearly',
  YEARLY: 'Yearly',
  SINGLE: 'One-time (single premium)',
};
const PREMIUM_SUFFIX: Record<string, string> = {
  MONTHLY: '/ month',
  QUARTERLY: '/ quarter',
  HALF_YEARLY: '/ half-year',
  YEARLY: '/ year',
  SINGLE: 'one-time',
};
export const PREMIUMS_PER_YEAR: Record<string, number> = { MONTHLY: 12, QUARTERLY: 4, HALF_YEARLY: 2, YEARLY: 1, SINGLE: 0 };

export const INVESTMENT_TYPES = ['MUTUAL_FUND', 'SIP', 'FD', 'BONDS', 'DEMAT', 'ADVISORY', 'OTHER'];
export const INVESTMENT_LABELS: Record<string, string> = {
  MUTUAL_FUND: 'Mutual fund',
  SIP: 'SIP',
  FD: 'Fixed deposit',
  BONDS: 'Bonds',
  DEMAT: 'Demat / trading account',
  ADVISORY: 'Advisory plan',
  OTHER: 'Other',
};

export const RETURN_TYPES = ['FIXED', 'MARKET_LINKED'];
export const RETURN_TYPE_LABELS: Record<string, string> = { FIXED: 'Fixed return', MARKET_LINKED: 'Market-linked' };

export const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH'];
export const RISK_LABELS: Record<string, string> = { LOW: 'Low risk', MODERATE: 'Moderate risk', HIGH: 'High risk' };

export const SERVICE_FEE_UNITS = ['ONE_TIME', 'PER_FILING', 'PER_MONTH', 'PER_YEAR', 'PER_TRANSACTION'];
export const SERVICE_FEE_LABELS: Record<string, string> = {
  ONE_TIME: 'One-time',
  PER_FILING: 'Per filing',
  PER_MONTH: 'Per month',
  PER_YEAR: 'Per year',
  PER_TRANSACTION: 'Per transaction',
};
const SERVICE_FEE_SUFFIX: Record<string, string> = {
  ONE_TIME: '',
  PER_FILING: '/ filing',
  PER_MONTH: '/ month',
  PER_YEAR: '/ year',
  PER_TRANSACTION: '/ transaction',
};

// --- Documents -------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  'PAN_CARD',
  'AADHAAR_CARD',
  'PASSPORT_PHOTO',
  'ADDRESS_PROOF',
  'BANK_STATEMENT',
  'SALARY_SLIP',
  'FORM_16',
  'ITR',
  'INCOME_PROOF',
  'CANCELLED_CHEQUE',
  'BUSINESS_PROOF',
  'GST_CERTIFICATE',
  'PROPERTY_PAPERS',
  'VEHICLE_RC',
  'DRIVING_LICENCE',
  'MEDICAL_REPORT',
  'EXISTING_POLICY',
  'NOMINEE_ID',
  'SIGNATURE',
  'OTHER',
];

export const DOCUMENT_LABELS: Record<string, string> = {
  PAN_CARD: 'PAN card',
  AADHAAR_CARD: 'Aadhaar card',
  PASSPORT_PHOTO: 'Passport-size photo',
  ADDRESS_PROOF: 'Address proof',
  BANK_STATEMENT: 'Bank statement (last 6 months)',
  SALARY_SLIP: 'Salary slips (last 3 months)',
  FORM_16: 'Form 16',
  ITR: 'Income tax return (ITR)',
  INCOME_PROOF: 'Income proof',
  CANCELLED_CHEQUE: 'Cancelled cheque',
  BUSINESS_PROOF: 'Business proof / Udyam certificate',
  GST_CERTIFICATE: 'GST registration certificate',
  PROPERTY_PAPERS: 'Property papers',
  VEHICLE_RC: 'Vehicle RC',
  DRIVING_LICENCE: 'Driving licence',
  MEDICAL_REPORT: 'Medical report',
  EXISTING_POLICY: 'Existing policy copy',
  NOMINEE_ID: "Nominee's ID proof",
  SIGNATURE: 'Signature specimen',
  OTHER: 'Other document',
};

/** PAN and Aadhaar go with every application, whatever else the agency asks for. */
export const ALWAYS_REQUIRED_DOCUMENTS = ['PAN_CARD', 'AADHAAR_CARD'];

/** Documents whose number the applicant types in, with the format it has to match. */
export const DOCUMENT_NUMBER_RULES: Record<string, { label: string; placeholder: string; hint: string; test: (v: string) => boolean }> = {
  PAN_CARD: {
    label: 'PAN number',
    placeholder: 'ABCDE1234F',
    hint: 'Five letters, four digits, one letter.',
    test: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
  },
  AADHAAR_CARD: {
    label: 'Aadhaar number',
    placeholder: '1234 5678 9012',
    hint: '12 digits, as printed on the card.',
    test: (v) => /^[2-9][0-9]{11}$/.test(v),
  },
};

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';

/** The papers this scheme asks for, PAN and Aadhaar first. */
export function requiredDocuments(details?: FinanceDetails | null): string[] {
  const chosen = details?.documents ?? [];
  const all = new Set([...ALWAYS_REQUIRED_DOCUMENTS, ...chosen]);
  return DOCUMENT_TYPES.filter((doc) => all.has(doc));
}

/** Reads one scanned paper as a base64 data URL — same approach as resumes and photos. */
export function documentToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

// --- The accounting: EMI, totals, charges ----------------------------------------------

export const GST_RATE = 18;

export type LoanQuote = {
  principal: number;
  annualRate: number;
  interestType: string;
  tenureMonths: number;
  repaymentFrequency: string;
  instalmentCount: number;
  instalment: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  gstOnFee: number;
  netDisbursal: number;
};

export function instalmentPlan(months: number, frequency = 'MONTHLY') {
  if (frequency === 'WEEKLY') return { count: Math.max(1, Math.round((months * 52) / 12)), perYear: 52 };
  if (frequency === 'DAILY') return { count: Math.max(1, months * 30), perYear: 365 };
  return { count: Math.max(1, months), perYear: 12 };
}

/** What a charge comes to on this amount: nothing, a percentage of it, or a flat figure. */
export function chargeAmount(type: ChargeType | undefined, value: number | undefined, base: number) {
  if (type === 'PERCENT') return Math.round((base * (Number(value) || 0)) / 100);
  if (type === 'FIXED') return Math.round(Number(value) || 0);
  return 0;
}

export function chargeText(type: ChargeType | undefined, value: number | undefined) {
  if (type === 'PERCENT') return `${value}% of the loan amount`;
  if (type === 'FIXED') return formatRupees(Number(value) || 0);
  return 'Nil';
}

/**
 * The instalment and totals for a loan — the same working the backend stores with the
 * application, so what the borrower is shown before applying is what gets recorded.
 * REDUCING: E = P·r·(1+r)^n / ((1+r)^n − 1). FLAT: interest on the full principal for the
 * whole tenure, split evenly across the instalments.
 */
export function loanQuote(details: LoanDetails, principal: number, tenureMonths: number, rateOverride?: number): LoanQuote {
  const annualRate = rateOverride ?? details.interestRateMin ?? 0;
  const interestType = details.interestType === 'FLAT' ? 'FLAT' : 'REDUCING';
  const frequency = details.repaymentFrequency || 'MONTHLY';
  const { count, perYear } = instalmentPlan(tenureMonths, frequency);

  let instalment: number;
  let totalPayable: number;
  if (interestType === 'FLAT') {
    const interest = (principal * annualRate * tenureMonths) / (100 * 12);
    totalPayable = principal + interest;
    instalment = totalPayable / count;
  } else {
    const r = annualRate / 100 / perYear;
    instalment = r === 0 ? principal / count : (principal * r * (1 + r) ** count) / ((1 + r) ** count - 1);
    totalPayable = instalment * count;
  }

  const processingFee = chargeAmount(details.processingFeeType, details.processingFee, principal);
  const gstOnFee = details.gstOnCharges ? Math.round((processingFee * GST_RATE) / 100) : 0;

  return {
    principal: Math.round(principal),
    annualRate,
    interestType,
    tenureMonths,
    repaymentFrequency: frequency,
    instalmentCount: count,
    instalment: Math.round(instalment),
    totalInterest: Math.round(totalPayable - principal),
    totalPayable: Math.round(totalPayable),
    processingFee,
    gstOnFee,
    netDisbursal: Math.round(principal - processingFee - gstOnFee),
  };
}

// --- Display ---------------------------------------------------------------------------

/** '₹50,000 – ₹5,00,000', or '₹50,000 onwards' when the agency set no ceiling. */
export function rangeText(min: number, max?: number) {
  return max && max > min ? `${formatRupees(min)} – ${formatRupees(max)}` : `${formatRupees(min)} onwards`;
}

/** '10.5% – 14% p.a.' */
export function rateText(min: number, max?: number) {
  return max && max > min ? `${min}% – ${max}% p.a.` : `${min}% p.a.`;
}

/** '12 – 60 months', '5 years' for longer bands. */
export function tenureText(min: number, max?: number) {
  const word = (m: number) => (m % 12 === 0 && m >= 12 ? `${m / 12} year${m === 12 ? '' : 's'}` : `${m} months`);
  return max && max > min ? `${min} – ${max} months` : word(min);
}

export function monthsText(months?: number) {
  if (!months) return '';
  if (months % 12 === 0) return `${months / 12} year${months === 12 ? '' : 's'}`;
  return `${months} month${months === 1 ? '' : 's'}`;
}

type PricedProduct = { price: string | number | null; priceType: 'FIXED' | 'CONTACT_FOR_PRICE'; financeDetails?: FinanceDetails | null };

/**
 * What a scheme's card shows where a shop product shows its price: a loan leads with its
 * interest rate, an investment with its minimum, a policy with its premium and a service
 * with its fee.
 */
export function financePriceText(p: PricedProduct) {
  const d = p.financeDetails;
  if (d?.type === 'LOAN') return rateText(d.interestRateMin, d.interestRateMax);
  if (d?.type === 'INVESTMENT') return `${formatRupees(d.minInvestment)} minimum`;
  if (p.priceType === 'CONTACT_FOR_PRICE' || p.price == null) return d?.type === 'INSURANCE' ? 'Premium on request' : 'Contact for price';
  const amount = formatRupees(Number(p.price));
  if (d?.type === 'INSURANCE') return `${amount} ${PREMIUM_SUFFIX[d.premiumFrequency] ?? ''}`.trim();
  if (d?.type === 'SERVICE') return `${amount} ${SERVICE_FEE_SUFFIX[d.feeUnit] ?? ''}`.trim();
  return amount;
}

/** The buyer's button: you apply for a loan or a policy, you start an investment, you book a service. */
export function financeActionLabel(details?: FinanceDetails | null) {
  const type = financeItemType(details);
  if (type === 'LOAN') return 'Apply for loan';
  if (type === 'INSURANCE') return 'Apply for policy';
  if (type === 'INVESTMENT') return 'Start investing';
  return 'Apply';
}

export function financeNoun(type: FinanceFormType) {
  return { LOAN: 'loan scheme', INSURANCE: 'insurance policy', INVESTMENT: 'investment plan', SERVICE: 'service', OTHER: 'product' }[type];
}

/** Two or three headline facts for a scheme's card. */
export function financeHighlights(details?: FinanceDetails | null): string[] {
  if (details?.type === 'LOAN') {
    return [
      INTEREST_TYPE_LABELS[details.interestType],
      tenureText(details.tenureMin, details.tenureMax),
      SECURITY_LABELS[details.securityType] ?? details.securityType,
    ].filter(Boolean);
  }
  if (details?.type === 'INSURANCE') {
    return [POLICY_LABELS[details.policyType], `Cover ${rangeText(details.coverMin, details.coverMax)}`, PREMIUM_LABELS[details.premiumFrequency]].filter(Boolean);
  }
  if (details?.type === 'INVESTMENT') {
    return [
      INVESTMENT_LABELS[details.investmentType],
      RISK_LABELS[details.riskLevel],
      details.lockInMonths ? `Lock-in ${monthsText(details.lockInMonths)}` : '',
    ].filter(Boolean);
  }
  if (details?.type === 'SERVICE') {
    return [SERVICE_FEE_LABELS[details.feeUnit], details.turnaroundDays ? `Ready in ${details.turnaroundDays} day(s)` : ''].filter(Boolean);
  }
  return [];
}

/** The full sheet, as label / value rows. Charges and eligibility get their own sections. */
export function formatFinanceDetails(details: FinanceDetails | null | undefined): { label: string; value: string }[] {
  let rows: [string, string | undefined][] = [];

  if (details?.type === 'LOAN') {
    rows = [
      ['Loan amount', rangeText(details.amountMin, details.amountMax)],
      ['Interest rate', rateText(details.interestRateMin, details.interestRateMax)],
      ['Interest type', INTEREST_TYPE_LABELS[details.interestType]],
      ['Tenure', tenureText(details.tenureMin, details.tenureMax)],
      ['Repayment', REPAYMENT_LABELS[details.repaymentFrequency]],
      ['Security', SECURITY_LABELS[details.securityType]],
      ['Collateral details', details.collateralNote],
      ['Guarantor', details.guarantorRequired ? 'Required' : 'Not required'],
      ['Disbursal', details.disbursalDays != null ? `Within ${details.disbursalDays} working day(s)` : undefined],
    ];
  } else if (details?.type === 'INSURANCE') {
    rows = [
      ['Insurance type', POLICY_LABELS[details.policyType]],
      ['Insurance company', details.insurerName],
      ['Cover (sum assured)', rangeText(details.coverMin, details.coverMax)],
      ['Premium paid', PREMIUM_LABELS[details.premiumFrequency]],
      [
        'Policy term',
        details.policyTermMin
          ? details.policyTermMax && details.policyTermMax > details.policyTermMin
            ? `${details.policyTermMin} – ${details.policyTermMax} years`
            : `${details.policyTermMin} years`
          : undefined,
      ],
      [
        'Entry age',
        details.entryAgeMin != null || details.entryAgeMax != null
          ? `${details.entryAgeMin ?? 0} – ${details.entryAgeMax ?? 100} years`
          : undefined,
      ],
      ['Waiting period', details.waitingPeriodDays ? `${details.waitingPeriodDays} days` : undefined],
      ['Claim settlement ratio', details.claimRatio ? `${details.claimRatio}%` : undefined],
      ['Free-look period', details.freeLookDays ? `${details.freeLookDays} days` : undefined],
      ['GST on premium', details.gstOnPremium ? `Extra, at ${GST_RATE}%` : 'Included in the premium shown'],
      ['Tax benefit', details.taxBenefit ? 'Available (80C / 80D)' : undefined],
    ];
  } else if (details?.type === 'INVESTMENT') {
    rows = [
      ['Investment type', INVESTMENT_LABELS[details.investmentType]],
      ['Fund house / provider', details.provider],
      ['Minimum investment', formatRupees(details.minInvestment)],
      ['Minimum SIP', details.minSip ? `${formatRupees(details.minSip)} / month` : undefined],
      ['Return', RETURN_TYPE_LABELS[details.returnType]],
      [
        'Expected return',
        details.expectedReturnMin != null ? rateText(details.expectedReturnMin, details.expectedReturnMax) : undefined,
      ],
      ['Tenure', monthsText(details.tenureMonths) || undefined],
      ['Lock-in', details.lockInMonths ? monthsText(details.lockInMonths) : 'None'],
      ['Risk', RISK_LABELS[details.riskLevel]],
      ['Exit load', details.exitLoad ? `${details.exitLoad}%` : 'Nil'],
      ['Expense ratio', details.expenseRatio ? `${details.expenseRatio}%` : undefined],
      ['Payout', details.payoutNote],
    ];
  } else if (details?.type === 'SERVICE') {
    rows = [
      ['Fee is', SERVICE_FEE_LABELS[details.feeUnit]],
      ['Turnaround', details.turnaroundDays != null ? `${details.turnaroundDays} working day(s)` : undefined],
      ['Government fee', details.govtFeeExtra ? 'Charged extra, at actuals' : 'Included'],
      ['GST', details.gstExtra ? `Extra, at ${GST_RATE}%` : 'Included in the fee shown'],
    ];
  }

  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}

/** A loan's charge sheet — every rupee the borrower can be asked for beyond the interest. */
export function loanChargeRows(d: LoanDetails): { label: string; value: string }[] {
  const rows: [string, string | undefined][] = [
    ['Processing fee', chargeText(d.processingFeeType, d.processingFee)],
    ['Part-prepayment charge', chargeText(d.prepaymentChargeType, d.prepaymentCharge)],
    ['Foreclosure charge', chargeText(d.foreclosureChargeType, d.foreclosureCharge)],
    ['Late payment penalty', d.latePaymentPenalty ? `${d.latePaymentPenalty}% per month on the overdue amount` : 'Nil'],
    ['Cheque / ECS bounce', d.bounceCharge ? `${formatRupees(d.bounceCharge)} per bounce` : 'Nil'],
    ['GST on charges', d.gstOnCharges ? `Extra, at ${GST_RATE}%` : 'Included'],
    ['Other charges', d.otherCharges],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}

/** Who the agency will lend to — the bar an applicant has to clear. */
export function loanEligibilityRows(d: LoanDetails): { label: string; value: string }[] {
  const rows: [string, string | undefined][] = [
    ['Who can apply', d.employmentTypes?.map((t) => EMPLOYMENT_LABELS[t] ?? t).join(', ')],
    ['Age', d.minAge != null || d.maxAge != null ? `${d.minAge ?? 18} – ${d.maxAge ?? 70} years` : undefined],
    ['Minimum monthly income', d.minMonthlyIncome ? formatRupees(d.minMonthlyIncome) : undefined],
    ['Minimum CIBIL score', d.minCreditScore ? String(d.minCreditScore) : undefined],
    ['Years in business', d.minBusinessYears ? `${d.minBusinessYears}+ years` : undefined],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
}

// --- The seller's "Add scheme" form -----------------------------------------------------

/** Loan, insurance, investment, service, or anything else (a plain product). */
export type FinanceFormType = FinanceItemType | 'OTHER';

/** Form state: text inputs as strings, multi-selects as string arrays, yes/no as 'YES' / 'NO'. */
export type FinanceFormValues = Record<string, string | string[]>;

/** What a shop posted in each category most likely adds — pre-selected in the "Add" form. */
const TYPE_BY_CATEGORY: Record<string, FinanceItemType> = {
  'personal-loan': 'LOAN',
  'home-loan': 'LOAN',
  'business-loan': 'LOAN',
  'car-vehicle-loan': 'LOAN',
  'gold-loan': 'LOAN',
  'education-loan': 'LOAN',
  'loan-against-property': 'LOAN',
  'life-insurance': 'INSURANCE',
  'health-insurance': 'INSURANCE',
  'vehicle-insurance': 'INSURANCE',
  'general-property-insurance': 'INSURANCE',
  'mutual-funds': 'INVESTMENT',
  'stock-market-demat-account': 'INVESTMENT',
  'sip-investment-advisory': 'INVESTMENT',
  'fixed-deposit-bonds': 'INVESTMENT',
  'income-tax-filing-ca': 'SERVICE',
  'gst-registration-filing': 'SERVICE',
  'accounting-bookkeeping': 'SERVICE',
  'credit-score-cibil-services': 'SERVICE',
  'bank-correspondent-mini-bank': 'SERVICE',
  'credit-card-services': 'SERVICE',
  'money-transfer-dmt': 'SERVICE',
  'atm-csp-agent': 'SERVICE',
};

/** The security a category's loans usually carry, and the policy type an insurer sells. */
const DEFAULTS_BY_CATEGORY: Record<string, FinanceFormValues> = {
  'gold-loan': { securityType: 'GOLD' },
  'home-loan': { securityType: 'PROPERTY' },
  'loan-against-property': { securityType: 'PROPERTY' },
  'car-vehicle-loan': { securityType: 'VEHICLE' },
  'personal-loan': { securityType: 'UNSECURED' },
  'education-loan': { securityType: 'UNSECURED' },
  'business-loan': { securityType: 'UNSECURED' },
  'life-insurance': { policyType: 'LIFE' },
  'health-insurance': { policyType: 'HEALTH' },
  'vehicle-insurance': { policyType: 'VEHICLE' },
  'general-property-insurance': { policyType: 'PROPERTY' },
  'mutual-funds': { investmentType: 'MUTUAL_FUND', returnType: 'MARKET_LINKED' },
  'sip-investment-advisory': { investmentType: 'SIP', returnType: 'MARKET_LINKED' },
  'fixed-deposit-bonds': { investmentType: 'FD', returnType: 'FIXED' },
  'stock-market-demat-account': { investmentType: 'DEMAT', returnType: 'MARKET_LINKED' },
  'income-tax-filing-ca': { feeUnit: 'PER_FILING' },
  'gst-registration-filing': { feeUnit: 'PER_FILING' },
  'accounting-bookkeeping': { feeUnit: 'PER_MONTH' },
  'money-transfer-dmt': { feeUnit: 'PER_TRANSACTION' },
};

/** The papers a scheme of each kind normally needs, over and above PAN and Aadhaar. */
const DOCUMENTS_BY_TYPE: Record<FinanceItemType, string[]> = {
  LOAN: ['PASSPORT_PHOTO', 'ADDRESS_PROOF', 'BANK_STATEMENT', 'INCOME_PROOF'],
  INSURANCE: ['PASSPORT_PHOTO', 'ADDRESS_PROOF', 'NOMINEE_ID'],
  INVESTMENT: ['PASSPORT_PHOTO', 'CANCELLED_CHEQUE', 'SIGNATURE'],
  SERVICE: ['ADDRESS_PROOF'],
};

export function defaultFinanceType(categorySlug?: string | null): FinanceItemType {
  return TYPE_BY_CATEGORY[categorySlug ?? ''] ?? 'LOAN';
}

export const FINANCE_FORM_TEXT: Record<FinanceFormType, { nameLabel: string; namePlaceholder: string; descriptionPlaceholder: string }> = {
  LOAN: {
    nameLabel: 'Scheme name',
    namePlaceholder: 'e.g. Personal Loan — Salaried',
    descriptionPlaceholder: 'Who this scheme suits, how the money is paid out, how repayment works...',
  },
  INSURANCE: {
    nameLabel: 'Policy name',
    namePlaceholder: 'e.g. Family Health Cover — 5 Lakh',
    descriptionPlaceholder: 'What the policy covers, hospitals in the network, how a claim is filed...',
  },
  INVESTMENT: {
    nameLabel: 'Plan name',
    namePlaceholder: 'e.g. Monthly SIP — Balanced Fund',
    descriptionPlaceholder: 'How the plan works, past performance, who it suits...',
  },
  SERVICE: {
    nameLabel: 'Service name',
    namePlaceholder: 'e.g. ITR Filing — Salaried (Form 16)',
    descriptionPlaceholder: "What's included, how long it takes, what the client has to send you...",
  },
  OTHER: {
    nameLabel: 'Product name',
    namePlaceholder: 'e.g. Financial Planning Session',
    descriptionPlaceholder: "What it is, what's included...",
  },
};

/** The price box's label — a loan and an investment carry no single price. */
export function financePriceLabel(type: FinanceItemType, values: FinanceFormValues) {
  if (type === 'INSURANCE') {
    const frequency = typeof values.premiumFrequency === 'string' ? values.premiumFrequency : 'YEARLY';
    return `Premium (₹ ${PREMIUM_SUFFIX[frequency] ?? ''})`.replace(' )', ')');
  }
  if (type === 'SERVICE') {
    const unit = typeof values.feeUnit === 'string' ? values.feeUnit : 'ONE_TIME';
    return `Service fee (₹ ${SERVICE_FEE_SUFFIX[unit] ?? ''})`.replace(' )', ')');
  }
  return 'Price (₹)';
}

/** A loan and an investment are priced by their own terms, so the price box is hidden. */
export function financeHasPrice(type: FinanceFormType) {
  return type === 'INSURANCE' || type === 'SERVICE' || type === 'OTHER';
}

export function toFinanceFormValues(
  details: FinanceDetails | null | undefined,
  categorySlug?: string | null,
  type?: FinanceItemType,
): FinanceFormValues {
  const itemType = financeItemType(details) ?? type ?? defaultFinanceType(categorySlug);
  const defaults: FinanceFormValues = {
    interestType: 'REDUCING',
    repaymentFrequency: 'MONTHLY',
    processingFeeType: 'NONE',
    prepaymentChargeType: 'NONE',
    foreclosureChargeType: 'NONE',
    securityType: 'UNSECURED',
    policyType: 'LIFE',
    premiumFrequency: 'YEARLY',
    investmentType: 'MUTUAL_FUND',
    returnType: 'MARKET_LINKED',
    riskLevel: 'MODERATE',
    feeUnit: 'ONE_TIME',
    employmentTypes: [],
    documents: DOCUMENTS_BY_TYPE[itemType] ?? [],
    ...(DEFAULTS_BY_CATEGORY[categorySlug ?? ''] ?? {}),
  };
  if (!details || !financeItemType(details)) return defaults;

  const values: FinanceFormValues = { ...defaults };
  for (const [key, value] of Object.entries(details)) {
    if (key === 'type' || value === undefined || value === null) continue;
    values[key] = Array.isArray(value) ? value : typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
  }
  return values;
}

const filled = (value: string | string[] | undefined) => (Array.isArray(value) ? value.length > 0 : Boolean(value?.trim()));
const str = (value: string | string[] | undefined) => (typeof value === 'string' ? value.trim() : '');
const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value : []);
const num = (value: string | string[] | undefined) => (str(value) ? Number(str(value)) : undefined);
const bool = (value: string | string[] | undefined) => str(value) === 'YES';

/** Labels of the required terms the agency hasn't filled in yet. */
export function missingFinanceFields(type: FinanceFormType, values: FinanceFormValues): string[] {
  const missing: string[] = [];
  const need = (key: string, label: string) => {
    if (!filled(values[key])) missing.push(label);
  };
  const chargeValue = (typeKey: string, valueKey: string, label: string) => {
    if (str(values[typeKey]) !== 'NONE' && !filled(values[valueKey])) missing.push(label);
  };

  if (type === 'LOAN') {
    need('amountMin', 'Minimum loan amount');
    need('interestRateMin', 'Interest rate');
    need('tenureMin', 'Minimum tenure');
    need('employmentTypes', 'Who can apply');
    chargeValue('processingFeeType', 'processingFee', 'Processing fee amount');
    chargeValue('prepaymentChargeType', 'prepaymentCharge', 'Part-prepayment charge');
    chargeValue('foreclosureChargeType', 'foreclosureCharge', 'Foreclosure charge');
    need('terms', 'Terms & conditions');
  } else if (type === 'INSURANCE') {
    need('insurerName', 'Insurance company');
    need('coverMin', 'Minimum cover');
    need('terms', 'Terms & conditions');
  } else if (type === 'INVESTMENT') {
    need('minInvestment', 'Minimum investment');
    need('terms', 'Terms & conditions');
  }
  return missing;
}

/** What gets sent to the backend as the product's financeDetails. */
export function financePayload(type: FinanceItemType, values: FinanceFormValues): Record<string, unknown> {
  const documents = list(values.documents);

  if (type === 'LOAN') {
    return {
      type,
      amountMin: num(values.amountMin),
      amountMax: num(values.amountMax),
      interestRateMin: num(values.interestRateMin),
      interestRateMax: num(values.interestRateMax),
      interestType: str(values.interestType) || 'REDUCING',
      tenureMin: num(values.tenureMin),
      tenureMax: num(values.tenureMax),
      repaymentFrequency: str(values.repaymentFrequency) || 'MONTHLY',
      processingFeeType: str(values.processingFeeType) || 'NONE',
      processingFee: num(values.processingFee),
      prepaymentChargeType: str(values.prepaymentChargeType) || 'NONE',
      prepaymentCharge: num(values.prepaymentCharge),
      foreclosureChargeType: str(values.foreclosureChargeType) || 'NONE',
      foreclosureCharge: num(values.foreclosureCharge),
      latePaymentPenalty: num(values.latePaymentPenalty),
      bounceCharge: num(values.bounceCharge),
      gstOnCharges: bool(values.gstOnCharges),
      otherCharges: str(values.otherCharges) || undefined,
      securityType: str(values.securityType) || 'UNSECURED',
      collateralNote: str(values.collateralNote) || undefined,
      guarantorRequired: bool(values.guarantorRequired),
      employmentTypes: list(values.employmentTypes),
      minAge: num(values.minAge),
      maxAge: num(values.maxAge),
      minMonthlyIncome: num(values.minMonthlyIncome),
      minCreditScore: num(values.minCreditScore),
      minBusinessYears: num(values.minBusinessYears),
      disbursalDays: num(values.disbursalDays),
      documents,
      terms: str(values.terms),
    };
  }

  if (type === 'INSURANCE') {
    return {
      type,
      policyType: str(values.policyType) || 'LIFE',
      insurerName: str(values.insurerName),
      coverMin: num(values.coverMin),
      coverMax: num(values.coverMax),
      premiumFrequency: str(values.premiumFrequency) || 'YEARLY',
      policyTermMin: num(values.policyTermMin),
      policyTermMax: num(values.policyTermMax),
      entryAgeMin: num(values.entryAgeMin),
      entryAgeMax: num(values.entryAgeMax),
      waitingPeriodDays: num(values.waitingPeriodDays),
      claimRatio: num(values.claimRatio),
      freeLookDays: num(values.freeLookDays),
      gstOnPremium: bool(values.gstOnPremium),
      taxBenefit: bool(values.taxBenefit),
      coverageIncludes: str(values.coverageIncludes) || undefined,
      exclusions: str(values.exclusions) || undefined,
      documents,
      terms: str(values.terms),
    };
  }

  if (type === 'INVESTMENT') {
    return {
      type,
      investmentType: str(values.investmentType) || 'MUTUAL_FUND',
      provider: str(values.provider) || undefined,
      minInvestment: num(values.minInvestment),
      minSip: num(values.minSip),
      returnType: str(values.returnType) || 'MARKET_LINKED',
      expectedReturnMin: num(values.expectedReturnMin),
      expectedReturnMax: num(values.expectedReturnMax),
      tenureMonths: num(values.tenureMonths),
      lockInMonths: num(values.lockInMonths),
      riskLevel: str(values.riskLevel) || 'MODERATE',
      exitLoad: num(values.exitLoad),
      expenseRatio: num(values.expenseRatio),
      payoutNote: str(values.payoutNote) || undefined,
      documents,
      terms: str(values.terms),
    };
  }

  return {
    type,
    feeUnit: str(values.feeUnit) || 'ONE_TIME',
    turnaroundDays: num(values.turnaroundDays),
    govtFeeExtra: bool(values.govtFeeExtra),
    gstExtra: bool(values.gstExtra),
    includes: str(values.includes) || undefined,
    documents,
    terms: str(values.terms) || undefined,
  };
}

// --- The buyer's application ------------------------------------------------------------

export type FinanceApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export const FINANCE_STATUS_LABELS: Record<FinanceApplicationStatus, string> = {
  APPLIED: 'New',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
};

/** The signed-in buyer's own application to a scheme (drives the card's Apply button). */
export type MyFinanceApplication = {
  id: string;
  productId: string;
  listingId: string;
  status: FinanceApplicationStatus;
  requestedAmount: number | null;
  approvedAmount: number | null;
  sellerNote: string | null;
  appliedAt: string;
  product?: { name: string };
  listing?: { id: string; shopName: string | null; title: string };
};

/** An uploaded paper as the agency sees it — the file itself is fetched on demand. */
export type FinanceApplicationDocument = {
  id: string;
  docType: string;
  docNumber: string | null;
  fileName: string;
  uploadedAt: string;
};

/** An applicant as the agency sees them. */
export type FinanceApplicant = {
  id: string;
  productId: string;
  listingId: string;
  applicantId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  address: string;
  city: string | null;
  pincode: string | null;
  occupation: string | null;
  employerName: string | null;
  monthlyIncome: number | null;
  existingEmi: number | null;
  creditScore: number | null;
  requestedAmount: number | null;
  tenureMonths: number | null;
  purpose: string | null;
  nomineeName: string | null;
  nomineeRelation: string | null;
  quote: LoanQuote | null;
  termsSnapshot: FinanceDetails | null;
  acceptedTerms: boolean;
  status: FinanceApplicationStatus;
  sellerNote: string | null;
  approvedAmount: number | null;
  approvedRate: number | null;
  approvedTenure: number | null;
  decidedAt: string | null;
  appliedAt: string;
  product: { id: string; name: string; financeDetails: FinanceDetails | null };
  documents: FinanceApplicationDocument[];
};

export const OCCUPATION_OPTIONS = EMPLOYMENT_TYPES;

/** Whole years between a YYYY-MM-DD date of birth and today. */
export function ageFrom(dateOfBirth: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const before = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  return before ? age - 1 : age;
}

/**
 * The scheme's own rules, checked in the browser so the applicant is told before they
 * upload anything. The backend checks all of this again — this is only for the form.
 */
export function eligibilityProblem(details: FinanceDetails, form: { amount?: number; tenure?: number; occupation?: string; monthlyIncome?: number; creditScore?: number; dateOfBirth?: string }): string | null {
  const { amount, tenure } = form;
  if (details.type === 'LOAN') {
    if (amount != null && amount < details.amountMin) return `This scheme starts at ${formatRupees(details.amountMin)}.`;
    if (amount != null && details.amountMax && amount > details.amountMax) return `This scheme goes up to ${formatRupees(details.amountMax)}.`;
    if (tenure != null && tenure < details.tenureMin) return `The minimum tenure is ${details.tenureMin} months.`;
    if (tenure != null && details.tenureMax && tenure > details.tenureMax) return `The maximum tenure is ${details.tenureMax} months.`;
    if (form.occupation && details.employmentTypes?.length && !details.employmentTypes.includes(form.occupation)) {
      return 'This scheme is not open to your employment type.';
    }
    if (details.minMonthlyIncome && form.monthlyIncome != null && form.monthlyIncome < details.minMonthlyIncome) {
      return `This scheme needs a monthly income of at least ${formatRupees(details.minMonthlyIncome)}.`;
    }
    if (details.minCreditScore && form.creditScore != null && form.creditScore < details.minCreditScore) {
      return `This scheme needs a CIBIL score of at least ${details.minCreditScore}.`;
    }
  }
  if (details.type === 'INSURANCE') {
    if (amount != null && amount < details.coverMin) return `The minimum cover is ${formatRupees(details.coverMin)}.`;
    if (amount != null && details.coverMax && amount > details.coverMax) return `The maximum cover is ${formatRupees(details.coverMax)}.`;
  }
  if (details.type === 'INVESTMENT' && amount != null && amount < details.minInvestment) {
    return `The minimum investment is ${formatRupees(details.minInvestment)}.`;
  }

  const minAge = details.type === 'INSURANCE' ? details.entryAgeMin : details.type === 'LOAN' ? details.minAge : undefined;
  const maxAge = details.type === 'INSURANCE' ? details.entryAgeMax : details.type === 'LOAN' ? details.maxAge : undefined;
  if (form.dateOfBirth && (minAge != null || maxAge != null)) {
    const age = ageFrom(form.dateOfBirth);
    if (age != null && minAge != null && age < minAge) return `You need to be at least ${minAge} to apply.`;
    if (age != null && maxAge != null && age > maxAge) return `This scheme is open up to age ${maxAge}.`;
  }
  return null;
}

/** What the applicant is asked for on the amount line, per kind of scheme. */
export function amountFieldLabel(type: FinanceItemType) {
  return { LOAN: 'How much do you need?', INSURANCE: 'Cover you want (sum assured)', INVESTMENT: 'Amount you want to invest', SERVICE: 'Amount (optional)' }[type];
}

export function formatApplicationDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
