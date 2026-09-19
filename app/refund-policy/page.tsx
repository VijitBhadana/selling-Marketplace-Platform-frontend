import Link from 'next/link';
import {
  CalendarCheck,
  Factory,
  FileText,
  GraduationCap,
  Heart,
  Home,
  KeyRound,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Store,
  Timer,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { COMPANY } from '@/lib/legal';
import { LegalShell, type LegalHighlight, type LegalSection } from '@/components/legal/legal-shell';
import { Bullets, Callout, DataTable, InfoCards, Steps, SubHeading } from '@/components/legal/legal-blocks';

export const metadata = pageMetadata({
  title: 'Refund & Cancellation Policy',
  description:
    'How to cancel an order or booking on DukanCloude, return a product and get your money back — cancellation windows per Cloude, refund timelines by payment method, and failed payments.',
  path: '/refund-policy',
});

const highlights: LegalHighlight[] = [
  { icon: Wallet, title: 'Back to your payment method', text: 'Refunds go to the UPI, card, bank or wallet you paid with.' },
  { icon: Zap, title: 'Initiated within 48 hours', text: 'Once a refund is approved, we initiate it within 2 working days.' },
  { icon: RotateCcw, title: '7-day returns', text: 'Damaged, defective or wrong products can be returned within 7 days of delivery.' },
  { icon: Timer, title: 'Failed payments reversed', text: 'Money debited for an order that did not go through comes back in 5–7 business days.' },
];

const sections: LegalSection[] = [
  {
    id: 'overview',
    title: 'How this policy works',
    body: (
      <>
        <p>
          DukanCloude is a marketplace, so every order or booking is with an independent seller. This policy sets the{' '}
          <strong>minimum protection</strong> every buyer gets. A seller may offer more generous terms, such as a longer return
          window or free cancellation. If a listing shows its own policy, the terms that are better for you apply.
        </p>
        <Callout title="Keep your order ID handy">
          You can find it in your orders or in the order notification. It helps us trace your payment and resolve your request
          faster.
        </Callout>
      </>
    ),
  },
  {
    id: 'cancelling',
    title: 'Cancelling an order',
    body: (
      <>
        <SubHeading>If you cancel</SubHeading>
        <Bullets
          items={[
            <><strong>Before the seller dispatches or prepares the order</strong>: free, with a 100% refund.</>,
            <><strong>After dispatch</strong>: the order usually cannot be cancelled. You can refuse a delivery that looks damaged or tampered with. Otherwise, use the returns process below.</>,
            <><strong>Cash on Delivery or Pay Later orders</strong>: cancel before dispatch at no cost. Not turning up to collect an order, or not being available to accept it, counts as a no-show under our <Link href="/terms#cash-on-delivery">COD rules</Link>.</>,
          ]}
        />
        <SubHeading>If the seller cancels</SubHeading>
        <p>
          If a seller cancels because an item is out of stock, they cannot deliver to your area or the price was wrong, you get a{' '}
          <strong>full refund</strong>, including any delivery charges. A seller who cancels often can have their shop restricted.
        </p>
      </>
    ),
  },
  {
    id: 'by-cloude',
    title: 'Cancellation rules for each Cloude',
    body: (
      <>
        <p>Each type of order has different timing. These default rules apply unless the listing shows better terms:</p>
        <InfoCards
          cards={[
            {
              icon: ShoppingBag,
              title: 'Shopping',
              tag: '7-day returns',
              text: 'Cancel free until the order is dispatched. Damaged, defective or wrong items can be returned within 7 days of delivery.',
            },
            {
              icon: UtensilsCrossed,
              title: 'Food',
              tag: 'Online only',
              text: 'Cancel free until the restaurant accepts your order. You get a refund for missing, wrong or spoilt items if you report them within 2 hours with a photo.',
            },
            {
              icon: Sparkles,
              title: 'Skill & Servicing',
              text: 'Cancel free up to 4 hours before your slot. Later cancellations may be charged a visit fee of up to ₹100. If the provider does not show up, you get a full refund.',
            },
            {
              icon: CalendarCheck,
              title: 'Booking (hotel, cab, tour, event)',
              text: 'The seller’s terms at booking apply. If none are shown: 100% refund 48+ hours before, 50% at 24–48 hours, and no refund within 24 hours or for a no-show.',
            },
            {
              icon: KeyRound,
              title: 'Rent',
              tag: 'Online only',
              text: 'Cancel free before the item is handed over. The security deposit is refunded within 7 days of returning the item undamaged.',
            },
            {
              icon: Heart,
              title: 'Wedding',
              text: 'Unless the vendor states otherwise, you get 75% of your advance back if you cancel 30+ days before the event, 50% at 15–30 days, and nothing within 15 days.',
            },
            {
              icon: GraduationCap,
              title: 'Education',
              text: 'Full refund if you cancel before the batch starts, and 50% within the first 7 days. No refund after that, unless the institute offers one.',
            },
            {
              icon: Stethoscope,
              title: 'Clinic & Doctors',
              text: 'Cancel free up to 2 hours before your appointment. If the doctor cancels or reschedules and the new time does not suit you, you get a full refund.',
            },
            {
              icon: Home,
              title: 'Property',
              text: 'Token and booking amounts follow the written agreement between you and the owner. Pay only after you have visited and checked the documents.',
            },
            {
              icon: Factory,
              title: 'Mini Factory / Manufacturing',
              text: 'Custom and bulk orders cannot be cancelled once production starts. If the seller misses the agreed delivery, your advance is refunded.',
            },
          ]}
        />
      </>
    ),
  },
  {
    id: 'returns',
    title: 'Returns and replacements',
    body: (
      <>
        <SubHeading>You can return a product if it</SubHeading>
        <Bullets
          variant="check"
          items={[
            'Arrived damaged, broken or leaking. Report this within 48 hours of delivery.',
            'Is defective or does not work as described.',
            'Is the wrong item, size, colour or quantity, or has missing parts.',
            'Is past its expiry date when delivered.',
          ]}
        />
        <p>
          The item must be unused and have its original tags, packaging and invoice. Photos help, and an unboxing video helps
          even more. Depending on stock, the seller offers a <strong>replacement</strong> or a <strong>full refund</strong>.
        </p>
        <SubHeading>These cannot be returned unless they arrive damaged or wrong</SubHeading>
        <Bullets
          variant="cross"
          items={[
            'Perishables such as cooked food, fruit, vegetables, dairy and flowers.',
            'Innerwear, cosmetics and personal hygiene products once opened.',
            'Customised, made-to-order or personalised items.',
            'Digital products, gift cards, and services that have already been delivered.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'how-to-request',
    title: 'How to request a refund',
    body: (
      <>
        <Steps
          steps={[
            {
              icon: FileText,
              title: 'Raise a request',
              text: 'Message the seller from your order, or write to support with your order ID, the reason and any photos.',
            },
            {
              icon: Store,
              title: 'Seller reviews it',
              text: 'The seller responds within 48 hours. If they do not, DukanCloude steps in and decides.',
            },
            {
              icon: PackageCheck,
              title: 'Pickup and check',
              text: 'For returns, the item is picked up or dropped back at the shop and checked.',
            },
            {
              icon: Wallet,
              title: 'Money back',
              text: 'Once approved, the refund is initiated within 48 hours to your original payment method.',
            },
          ]}
        />
        <p>
          Email <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> or use the{' '}
          <Link href="/contact">contact form</Link> and choose &ldquo;Refund / cancellation&rdquo;.
        </p>
      </>
    ),
  },
  {
    id: 'timelines',
    title: 'Refund timelines',
    body: (
      <>
        <p>
          We initiate an approved refund within <strong>48 hours</strong>. After that, the time it takes to reach you depends on
          your bank or payment provider:
        </p>
        <DataTable
          columns={['Paid with', 'Refunded to', 'Time to reach you']}
          rows={[
            ['UPI', 'Same UPI account', '1–3 business days'],
            ['Debit / credit card', 'Same card', '5–7 business days'],
            ['Net banking', 'Same bank account', '5–7 business days'],
            ['Wallet', 'Same wallet', '1–3 business days'],
            ['Cash on Delivery / Pay Later', 'Your bank account or UPI ID', '5–7 business days after we verify your details'],
          ]}
        />
        <p>
          If the refund has not reached you after this time, check with your bank using the refund reference we send you, or
          contact us and we will follow up with the payment gateway.
        </p>
      </>
    ),
  },
  {
    id: 'failed-payments',
    title: 'Failed or duplicate payments',
    body: (
      <>
        <p>
          If money was debited but your order was not placed, or you were charged twice, you do not need to do anything. The
          payment gateway reverses the extra amount automatically within <strong>5–7 business days</strong>.
        </p>
        <Callout tone="accent" title="Not reversed after 7 business days?">
          Email <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> with the transaction ID or UTR number, the
          date and the amount. We will trace it with our payment partner.
        </Callout>
      </>
    ),
  },
  {
    id: 'seller-plans',
    title: 'Seller plans and fees',
    body: (
      <Bullets
        items={[
          'A paid shop, ad or job plan can be fully refunded within 24 hours of purchase, as long as it has not been used. A plan counts as used once the listing or job is published or promoted.',
          'Once a plan has been used, it cannot be refunded for the time left.',
          'If a payment for a plan failed but you were charged, the failed-payment rules above apply.',
          'No refund is given when we remove a listing, or suspend an account, for breaking our Terms & Conditions.',
        ]}
      />
    ),
  },
  {
    id: 'disputes',
    title: 'Disputes and escalation',
    body: (
      <>
        <p>
          If you and the seller cannot agree, DukanCloude reviews the order history, chats, photos and delivery records and makes
          a fair decision. We usually do this within 7 working days.
        </p>
        <p>
          Still not satisfied? Write to our Grievance Officer at{' '}
          <a href={`mailto:${COMPANY.grievanceEmail}`}>{COMPANY.grievanceEmail}</a>. Complaints are acknowledged within 24 hours
          and resolved within 15 days. You can also contact the National Consumer Helpline on 1915.
        </p>
      </>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalShell
      current="/refund-policy"
      icon={RotateCcw}
      eyebrow="Fair and quick refunds"
      title="Refund & Cancellation Policy"
      intro="Changed your mind, or something went wrong? Here is how to cancel, return an item and get your money back, step by step."
      readMinutes={6}
      highlights={highlights}
      sections={sections}
    />
  );
}
