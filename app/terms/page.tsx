import Link from 'next/link';
import {
  BadgeIndianRupee,
  FileText,
  GraduationCap,
  Handshake,
  Home,
  KeyRound,
  Landmark,
  Scale,
  ShieldAlert,
  Stethoscope,
  Briefcase,
} from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { COMPANY } from '@/lib/legal';
import { LegalShell, type LegalHighlight, type LegalSection } from '@/components/legal/legal-shell';
import { Bullets, Callout, InfoCards, SubHeading } from '@/components/legal/legal-blocks';

export const metadata = pageMetadata({
  title: 'Terms & Conditions',
  description:
    'The rules for buying, selling, booking and posting on DukanCloude — accounts, orders, Cash on Delivery, seller duties, prohibited items, fees and dispute resolution.',
  path: '/terms',
});

const highlights: LegalHighlight[] = [
  { icon: BadgeIndianRupee, title: 'Free to post', text: 'Listing on DukanCloude is free. Any paid plan shows its full price before you pay.' },
  { icon: Handshake, title: 'Buyer–seller deals', text: 'You buy directly from independent sellers. We help if something goes wrong.' },
  { icon: ShieldAlert, title: 'Two-strike COD rule', text: 'Missing Cash on Delivery orders twice suspends the buyer account.' },
  { icon: Scale, title: 'Indian law applies', text: 'These terms are governed by the laws of India.' },
];

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'About these terms',
    body: (
      <>
        <p>
          These Terms &amp; Conditions (&ldquo;<strong>Terms</strong>&rdquo;) are a legal agreement between you and DukanCloude.
          They cover your use of dukancloude.com and every service on it. By creating an account, placing an order, posting a
          listing or browsing the site, you agree to these Terms, our <Link href="/privacy-policy">Privacy Policy</Link>, our{' '}
          <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> and our{' '}
          <Link href="/shipping-policy">Shipping Policy</Link>.
        </p>
        <p>If you do not agree, please do not use DukanCloude.</p>
      </>
    ),
  },
  {
    id: 'our-role',
    title: 'Our role as a marketplace',
    body: (
      <>
        <p>
          DukanCloude is an online marketplace and an &ldquo;intermediary&rdquo; under the Information Technology Act, 2000. We
          provide the platform that connects buyers with independent sellers, service providers, recruiters, agencies and clinics
          (together, &ldquo;<strong>sellers</strong>&rdquo;).
        </p>
        <Bullets
          items={[
            'Unless a listing clearly says it is sold by DukanCloude, we are not the seller. We do not own, stock, make or inspect the products and services listed.',
            'A purchase or booking is a contract between you and the seller. The seller sets the price, description, availability, warranty and delivery.',
            'We check sellers with OTP verification and moderation, but we cannot guarantee that every listing is accurate, lawful or of good quality.',
            'We step in to help resolve disputes and act on complaints, as described in our policies and under the Consumer Protection (E-Commerce) Rules, 2020.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Eligibility and your account',
    body: (
      <Bullets
        items={[
          'You must be at least 18 years old and able to enter a binding contract under Indian law.',
          'Give accurate details and keep them up to date. We verify your email or mobile number with an OTP.',
          'Each person may have only one account. Do not create an account for someone else without their permission.',
          'Keep your password and OTPs secret. You are responsible for everything done through your account.',
          <>If you think someone else has used your account, tell us at once at <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.</>,
        ]}
      />
    ),
  },
  {
    id: 'buying',
    title: 'Buying and booking',
    body: (
      <>
        <Bullets
          items={[
            'Items in your bucket list are grouped by shop. Each shop becomes a separate order when you check out.',
            <>Depending on the seller, you can choose <strong>delivery</strong>, <strong>takeaway</strong>, <strong>dine-in</strong>, <strong>at-location service</strong> or a <strong>booking</strong>. Bookings need details such as dates, guests or trip information.</>,
            'Prices are set by sellers and include applicable taxes unless stated otherwise. Delivery or convenience charges are shown before you pay.',
            'The seller may reject or cancel an order if the item is out of stock, the price was clearly wrong, or they cannot deliver to your address. If you already paid, you get a full refund.',
            <>Food orders, service bookings and rentals must be paid online. Other orders can be paid online or with Cash on Delivery or Pay Later, where the seller offers it.</>,
          ]}
        />
        <Callout>
          If the seller changes the terms of a booking after you fill in your details (for example, rent to sale or per-km to
          per-trip), we ask you to review them again before you check out.
        </Callout>
      </>
    ),
  },
  {
    id: 'cash-on-delivery',
    title: 'Cash on Delivery and no-shows',
    body: (
      <>
        <p>
          Cash on Delivery (COD) and Pay Later rely on trust. When a buyer does not turn up, the seller loses time, stock and
          money. That is why these rules apply:
        </p>
        <Bullets
          items={[
            'For takeaway, dine-in and service orders, you promise an arrival time. For bookings, you choose a date. Please keep to it.',
            'If you do not collect a takeaway order, are not available to accept a delivery, or miss a booking, the seller can report a no-show once the promised time has passed.',
            <><strong>First no-show</strong>: you receive a warning.</>,
            <><strong>Second no-show</strong>: your account is suspended and you can no longer place orders.</>,
          ]}
        />
        <Callout tone="accent" title="Think you were reported unfairly?">
          Write to <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> with your order details. We review every
          appeal.
        </Callout>
      </>
    ),
  },
  {
    id: 'selling',
    title: 'Selling and posting on DukanCloude',
    body: (
      <>
        <p>By opening a shop, posting an ad or listing a job, you agree to:</p>
        <Bullets
          variant="check"
          items={[
            'Describe products, services, prices, photos and stock honestly and accurately. Update or remove listings that are no longer available.',
            'Hold every licence and registration your business needs, for example FSSAI for food, GST where applicable, medical registration for doctors, and RERA for property agents.',
            'Accept and fulfil orders on the terms shown, on time. Respect the buyer’s chosen channel, time and address.',
            'Handle cancellations, returns and refunds at least as well as our Refund & Cancellation Policy requires.',
            'Issue proper invoices and pay your own taxes. You are responsible for GST and income tax on your sales.',
            'Use buyer contact details only to fulfil their order. Never use them for spam or unrelated marketing.',
            'Report a no-show only when it really happened.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'cloude-rules',
    title: 'Rules for specific Cloudes',
    body: (
      <>
        <p>Some Cloudes carry extra risk, so these additional terms apply:</p>
        <InfoCards
          cards={[
            {
              icon: Landmark,
              title: 'Financing',
              text: 'DukanCloude is not a bank, NBFC, insurer or investment advisor. The agency makes every approval, rate and payout decision. Never pay an “approval fee” to anyone.',
            },
            {
              icon: Stethoscope,
              title: 'Clinic & Doctors',
              text: 'Use this Cloude for discovery and appointments only. It does not replace medical advice. In an emergency, call 112 or 108 straight away.',
            },
            {
              icon: Briefcase,
              title: 'Jobs & Freelancing',
              text: 'Genuine employers never charge candidates for a job. Recruiters must post real vacancies. Report anyone who asks for money.',
            },
            {
              icon: Home,
              title: 'Property',
              text: 'Check the ownership documents and visit the property before paying a token amount. Agents must show their RERA number where the law requires it.',
            },
            {
              icon: KeyRound,
              title: 'Rent',
              text: 'Rentals are paid online in advance. Return the item on time and in the same condition. Deposits follow the owner’s written terms.',
            },
            {
              icon: GraduationCap,
              title: 'Education',
              text: 'Institutes are responsible for their course content, schedules and certificates. Results depend on the student and are never guaranteed.',
            },
          ]}
        />
      </>
    ),
  },
  {
    id: 'prohibited',
    title: 'Prohibited items and conduct',
    body: (
      <>
        <SubHeading>You may not list or sell</SubHeading>
        <Bullets
          variant="cross"
          items={[
            'Weapons, ammunition, explosives, drugs, narcotics, or prescription medicines without a valid licence.',
            'Counterfeit or pirated goods, stolen property, or anything that infringes someone else’s rights.',
            'Wildlife products, human organs, adult content, or gambling and lottery services.',
            'Fake job offers, pyramid or MLM schemes, or loans from unregistered lenders.',
            'Any other item or service that is illegal in India or in the buyer’s state.',
          ]}
        />
        <SubHeading>You may not</SubHeading>
        <Bullets
          variant="cross"
          items={[
            'Post fake reviews, create duplicate shops or manipulate ratings.',
            'Harass, threaten or discriminate against other users in chat or anywhere else.',
            'Take buyers off DukanCloude to avoid our fees or dispute process, or to commit fraud.',
            'Scrape, hack, overload or reverse-engineer the platform, or upload malware.',
            'Pretend to be another person, business or DukanCloude staff.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'fees',
    title: 'Fees, paid plans and payments',
    body: (
      <Bullets
        items={[
          'Creating an account and posting a basic listing is free.',
          'Optional paid plans, such as shop, ad promotion and job-posting plans, show their price, duration and benefits before you pay. GST is added where it applies.',
          'Online payments are processed by RBI-authorised payment gateway partners. Their terms also apply to your payment.',
          'If we introduce or change a seller commission or fee, we will tell sellers at least 15 days before it starts.',
          <>Refunds of plan fees follow our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>.</>,
        ]}
      />
    ),
  },
  {
    id: 'content',
    title: 'Reviews, content and intellectual property',
    body: (
      <>
        <p>
          You keep ownership of the photos, text and other content you post. By posting, you give DukanCloude a non-exclusive,
          royalty-free licence to host and display it, resize it and use it to promote your listing on the platform.
        </p>
        <p>
          Reviews must reflect a real experience. We may remove content that is false, abusive or illegal, or that breaks these
          Terms. The DukanCloude name, logo, design and software belong to us. Please do not copy them without written permission.
        </p>
        <Callout title="Found your content copied?">
          Send the listing link and proof of ownership to <a href={`mailto:${COMPANY.grievanceEmail}`}>{COMPANY.grievanceEmail}</a>.
          We act on valid notices within 36 hours.
        </Callout>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    body: (
      <>
        <p>
          We may remove listings, limit features, or suspend or close an account if it breaks these Terms or the law, harms other
          users, or is under investigation for fraud. Where it is safe to do so, we tell you why and give you a chance to respond.
        </p>
        <p>
          You can stop using DukanCloude and ask us to delete your account at any time. Orders already placed, open disputes and
          our legal record-keeping duties continue after an account is closed.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Disclaimers and limitation of liability',
    body: (
      <>
        <p>
          DukanCloude is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We work to keep it accurate and running, but
          we do not guarantee that it will be uninterrupted or error-free.
        </p>
        <p>
          As far as the law allows, DukanCloude is not liable for indirect or consequential losses, or for the acts of sellers or
          buyers. Our total liability to you for any claim is limited to the fees you paid to DukanCloude in the 6 months before
          the claim. Nothing in these Terms limits your rights under the Consumer Protection Act, 2019.
        </p>
        <p>
          You agree to compensate DukanCloude for any loss caused by your breach of these Terms, your listings, or your violation
          of the law or of someone else’s rights.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law and disputes',
    body: (
      <>
        <p>
          These Terms are governed by the laws of India. If you have a problem, please contact our support team first. Most
          issues are settled quickly that way. If a dispute is not resolved within 30 days, it will go to the courts at the place
          of DukanCloude’s registered office, which will have exclusive jurisdiction. Your right to approach a Consumer Commission
          is not affected.
        </p>
      </>
    ),
  },
  {
    id: 'changes-contact',
    title: 'Changes and contact',
    body: (
      <>
        <p>
          We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date shows the current version. If you
          continue to use DukanCloude after a change takes effect, you accept the new Terms. We will announce significant changes in
          advance.
        </p>
        <p>
          Questions? Visit our <Link href="/contact">Contact page</Link> or email{' '}
          <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>. You can reach the Grievance Officer,{' '}
          {COMPANY.grievanceOfficer}, at <a href={`mailto:${COMPANY.grievanceEmail}`}>{COMPANY.grievanceEmail}</a>. Complaints
          are acknowledged within 24 hours and resolved within 15 days.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalShell
      current="/terms"
      icon={FileText}
      eyebrow="Rules of the marketplace"
      title="Terms & Conditions"
      intro="The ground rules that keep DukanCloude fair and safe for buyers and sellers. Please read them before you buy, sell or book."
      readMinutes={9}
      highlights={highlights}
      sections={sections}
    />
  );
}
