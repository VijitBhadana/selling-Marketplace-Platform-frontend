import Link from 'next/link';
import { Ban, CreditCard, KeyRound, Lock, UserCheck } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { COMPANY } from '@/lib/legal';
import { LegalShell, type LegalHighlight, type LegalSection } from '@/components/legal/legal-shell';
import { Bullets, Callout, DataTable, SubHeading } from '@/components/legal/legal-blocks';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'How DukanCloude collects, uses, shares and protects your personal data — accounts, orders, payments, job and finance applications — and the rights you have under Indian law.',
  path: '/privacy-policy',
});

const highlights: LegalHighlight[] = [
  { icon: Ban, title: 'We never sell your data', text: 'Your details are shared only when it is needed to complete what you asked for.' },
  { icon: CreditCard, title: 'Secure payments', text: 'Card numbers, CVV and UPI PIN go to RBI-authorised gateways. We never see or store them.' },
  { icon: KeyRound, title: 'Hashed passwords & OTPs', text: 'Passwords and one-time codes are stored only as one-way hashes, never as plain text.' },
  { icon: UserCheck, title: 'You stay in control', text: 'See, correct or delete your data at any time, and withdraw consent whenever you like.' },
];

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Who we are and what this policy covers',
    body: (
      <>
        <p>
          DukanCloude (&ldquo;<strong>DukanCloude</strong>&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) runs an online marketplace
          at dukancloude.com. Buyers use it to find local shops, services, jobs and bookings, and sellers use it to list them. The
          marketplace is organised into sector-wise &ldquo;Cloudes&rdquo; such as Shopping, Food, Booking, Property, Education and
          Clinic &amp; Doctors.
        </p>
        <p>
          This policy explains what personal data we collect when you use our website and services, why we collect it, who we
          share it with and the choices you have. It is written to meet the Digital Personal Data Protection Act, 2023, the
          Information Technology Act, 2000 and the rules made under them.
        </p>
        <Callout title="Sellers are independent businesses">
          When you order from or share details with a seller, recruiter, lender or doctor on DukanCloude, they also receive your
          data to serve you. They are responsible for how they use it under their own privacy practices.
        </Callout>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <SubHeading>Information you give us</SubHeading>
        <Bullets
          items={[
            <><strong>Account details</strong>: your name, email address, mobile number, city, pincode, profile photo and password. The password is stored only as a hash.</>,
            <><strong>Verification</strong>: the one-time passwords (OTPs) we send to your email or phone. We keep them as hashes and they expire within minutes.</>,
            <><strong>Shops and listings</strong>: shop name, photos, products, services, prices, business hours and the shop location you choose to publish.</>,
            <><strong>Orders and bookings</strong>: the items you buy, delivery address, pickup or arrival time, and booking details such as dates, guests, rooms, trips or rental periods.</>,
            <><strong>Job applications</strong>: your resume, contact details, experience and anything else you send to a recruiter.</>,
            <><strong>Finance applications</strong>: the KYC and income documents a lender or advisor asks for, such as PAN, Aadhaar, bank statements, salary slips and ITR.</>,
            <><strong>Health information</strong>: appointment details and any health information you choose to share with a clinic or doctor.</>,
            <><strong>Communications</strong>: chats with sellers or buyers, reviews, ratings, reports and messages you send to our support team.</>,
          ]}
        />
        <SubHeading>Information collected automatically</SubHeading>
        <Bullets
          items={[
            <><strong>Device and usage data</strong>: IP address, browser type, device, pages viewed and actions taken. We use it to keep the service secure and working well.</>,
            <><strong>Location</strong>: the city or area you pick in the location picker, so we can show nearby results. We only use your precise device location if you allow it in your browser.</>,
            <><strong>Cookies and local storage</strong>: used to keep you signed in and to remember your bucket list, theme and location. See section 6.</>,
          ]}
        />
        <SubHeading>Payment information</SubHeading>
        <p>
          Online payments are handled by RBI-authorised payment gateway partners. We receive the transaction reference, amount,
          payment method and status. <strong>We never receive or store your full card number, CVV, net-banking password or UPI PIN.</strong>
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    body: (
      <Bullets
        variant="check"
        items={[
          'To create your account, verify your email or phone with an OTP, and keep you signed in.',
          'To publish your shop, products, services and jobs, and show them to buyers nearby.',
          'To process orders, bookings, payments, refunds and cancellations, and to send you updates about them.',
          'To pass your job or finance application to the recruiter or agency you applied to.',
          'To power chat between buyers and sellers, reviews, ratings and notifications.',
          'To prevent fraud, spam and abuse. This includes enforcing our Cash on Delivery no-show rules and acting on reports against sellers.',
          'To answer your support requests and handle complaints.',
          'To understand how DukanCloude is used, so we can fix problems and improve features.',
          'To send offers or updates, but only if you have agreed to receive them. You can opt out at any time.',
          'To meet our legal, tax and regulatory obligations.',
        ]}
      />
    ),
  },
  {
    id: 'sharing',
    title: 'When we share your information',
    body: (
      <>
        <p>We share only the data each party needs to do its part:</p>
        <DataTable
          columns={['Shared with', 'What they receive', 'Why']}
          rows={[
            ['Sellers & service providers', 'Name, phone, delivery address, order or booking details', 'To fulfil your order or booking'],
            ['Buyers', "Shop name, public profile, contact options you've enabled", 'So buyers can reach you'],
            ['Recruiters', 'Your application and resume', 'For the job you applied to'],
            ['Lenders, insurers & advisors', 'Your finance application and documents', 'To assess the scheme you applied for'],
            ['Payment gateways', 'Order amount and contact details', 'To process payments and refunds'],
            ['Technology providers', 'Only the data needed for their service', 'Hosting, email and SMS OTP delivery'],
            ['Government & law enforcement', 'Only the data the law requires', 'To comply with a valid legal request'],
          ]}
        />
        <p>
          If DukanCloude is merged with or acquired by another company, your data may move to the new owner. It will stay
          protected by this policy.
        </p>
        <Callout title="We do not sell your personal data">
          We never sell or rent your personal data to advertisers or data brokers.
        </Callout>
      </>
    ),
  },
  {
    id: 'sensitive-data',
    title: 'KYC, financial and health documents',
    body: (
      <>
        <p>
          Documents uploaded for a Financing Cloude application (PAN, Aadhaar, bank statements and similar) and health
          information shared through the Clinic &amp; Doctors Cloude are treated as sensitive. For this data:
        </p>
        <Bullets
          items={[
            'It is shown only to the agency or clinic you chose, and to authorised DukanCloude staff when needed for support or fraud checks.',
            'It is never used for advertising or profiling.',
            'We check the file type and size when you upload it. We store it only for as long as your application needs it or the law requires.',
          ]}
        />
        <Callout tone="accent" title="DukanCloude does not lend money or give medical advice">
          Loan, insurance and investment decisions are made by the agency you apply to. Medical advice comes only from the
          doctor you consult.
        </Callout>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <>
        <DataTable
          columns={['Type', 'Used for', 'Can you turn it off?']}
          rows={[
            ['Essential', 'Keeping you signed in, security, your bucket list', 'No, the site needs these to work'],
            ['Preferences', 'Light or dark theme, your chosen location', 'Yes, by clearing site data'],
            ['Analytics', 'Anonymous page views and performance', 'Yes, in your browser settings'],
          ]}
        />
        <p>
          Most browsers let you block or delete cookies. If you block essential cookies, you may not be able to sign in or place
          orders.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep your data',
    body: (
      <Bullets
        items={[
          <><strong>Account data</strong>: kept while your account is active. It is deleted within 30 days of an account deletion request, unless we need to keep it for a reason listed below.</>,
          <><strong>Orders, payments and invoices</strong>: kept for up to 8 years, as Indian tax and accounting laws require.</>,
          <><strong>Job and finance applications</strong>: kept while the application is open. After that, we keep them only as long as the law or an ongoing dispute requires.</>,
          <><strong>Chats and support tickets</strong>: kept for up to 2 years, so we can resolve disputes and prevent fraud.</>,
          <><strong>Security logs</strong>: kept for up to 180 days, as required by CERT-In directions.</>,
        ]}
      />
    ),
  },
  {
    id: 'security',
    title: 'How we protect your data',
    body: (
      <>
        <Bullets
          variant="check"
          items={[
            'All traffic between your device and DukanCloude is encrypted with HTTPS (TLS).',
            'Passwords and OTPs are stored as salted one-way hashes, never as plain text.',
            'Only authorised staff can access personal data, and only when their work needs it.',
            'Payments go through PCI-DSS compliant, RBI-authorised gateways.',
            'We check uploads and limit their size and file type.',
          ]}
        />
        <p>
          No system is 100% secure. If a data breach affects you, we will inform you and the Data Protection Board of India as the
          law requires.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
        <Bullets
          variant="check"
          items={[
            <><strong>Access</strong>: get a summary of the personal data we hold about you and how we use it.</>,
            <><strong>Correction</strong>: fix details that are wrong or incomplete.</>,
            <><strong>Erasure</strong>: ask us to delete your account and personal data.</>,
            <><strong>Withdraw consent</strong>: stop optional uses such as marketing at any time.</>,
            <><strong>Grievance redressal</strong>: complain to our Grievance Officer. If you are not satisfied, you can go to the Data Protection Board of India.</>,
            <><strong>Nominate</strong>: name someone to exercise these rights for you if you die or become incapacitated.</>,
          ]}
        />
        <p>
          To use any of these rights, email <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> from your
          registered email address. We reply within 30 days.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: "Children's privacy",
    body: (
      <p>
        You must be 18 or older to create an account. We do not knowingly collect personal data from children without verifiable
        consent from a parent or guardian. If you think a child has given us personal data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy when our services or the law change. The &ldquo;Last updated&rdquo; date at the top shows the
        latest version. If a change is significant, we will tell you by email or with a notice on the site before it takes effect.
        Please also read our <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    ),
  },
  {
    id: 'grievance-officer',
    title: 'Contact and Grievance Officer',
    body: (
      <>
        <p>
          For privacy questions or complaints, contact our Grievance Officer, appointed under the IT Rules, 2021 and the DPDP Act,
          2023:
        </p>
        <div className="grid gap-3 rounded-xl border border-border bg-bg/60 p-4 text-sm leading-relaxed sm:grid-cols-2 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted/80">Grievance Officer</p>
            <p className="mt-1 font-semibold text-ink">{COMPANY.grievanceOfficer}</p>
            <a href={`mailto:${COMPANY.grievanceEmail}`} className="break-all">{COMPANY.grievanceEmail}</a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted/80">Address</p>
            {COMPANY.addressLines.map((line) => (
              <p key={line} className="mt-1 text-ink">{line}</p>
            ))}
          </div>
        </div>
        <p>We acknowledge complaints within 24 hours and resolve them within 15 days.</p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      current="/privacy-policy"
      icon={Lock}
      eyebrow="Your data, your control"
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the choices you have. Written in plain language, with no fine print hidden away."
      readMinutes={7}
      highlights={highlights}
      sections={sections}
    />
  );
}
