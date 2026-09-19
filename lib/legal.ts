// Business details shown on the policy and contact pages.
// TODO before going live: replace the phone, address and grievance officer with the
// registered business details — payment gateways (Razorpay, Cashfree, PayU…) check
// these pages during merchant KYC.

export const LEGAL_LAST_UPDATED = '19 September 2026';

export const COMPANY = {
  name: 'DukanCloude',
  supportEmail: 'support@dukancloude.com',
  grievanceEmail: 'grievance@dukancloude.com',
  sellerEmail: 'sellers@dukancloude.com',
  phone: '+91 00000 00000',
  supportHours: 'Mon – Sat, 10:00 AM – 7:00 PM IST',
  addressLines: ['DukanCloude — Registered Office', 'Your business address', 'City, State – PIN code, India'],
  grievanceOfficer: 'Grievance Officer name',
};

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refund-policy', label: 'Refund & Cancellation' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
  { href: '/contact', label: 'Contact Us' },
] as const;

export type LegalHref = (typeof LEGAL_LINKS)[number]['href'];
