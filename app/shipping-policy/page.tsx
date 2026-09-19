import Link from 'next/link';
import { BadgeIndianRupee, Bell, CalendarCheck, MapPin, PackageSearch, Store, Truck, Utensils, Wrench } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { COMPANY } from '@/lib/legal';
import { LegalShell, type LegalHighlight, type LegalSection } from '@/components/legal/legal-shell';
import { Bullets, Callout, DataTable, InfoCards } from '@/components/legal/legal-blocks';

export const metadata = pageMetadata({
  title: 'Shipping & Delivery Policy',
  description:
    'How orders on DukanCloude reach you — home delivery, takeaway, dine-in and bookings, delivery areas and timelines, shipping charges, failed deliveries and damaged parcels.',
  path: '/shipping-policy',
});

const highlights: LegalHighlight[] = [
  { icon: MapPin, title: 'Delivered by local sellers', text: 'Most orders come from shops near you, so they arrive quickly.' },
  { icon: BadgeIndianRupee, title: 'Charges shown up front', text: 'Delivery charges are shown before you pay. There are no hidden fees.' },
  { icon: Store, title: 'Pick up if you prefer', text: 'Choose takeaway and the shop holds your order until the time you give.' },
  { icon: PackageSearch, title: 'Check it at the door', text: 'Refuse parcels that look tampered with, and report damage within 48 hours.' },
];

const sections: LegalSection[] = [
  {
    id: 'who-delivers',
    title: 'Who delivers your order',
    body: (
      <>
        <p>
          DukanCloude is a marketplace of local shops and service providers. Physical orders are packed and shipped by the{' '}
          <strong>seller</strong>, either with their own delivery staff or through a courier partner. We set the standards every
          seller must meet, show you the charges and delivery estimate before you pay, and help you if something goes wrong.
        </p>
        <p>
          This policy covers physical products. Services, bookings and rentals are delivered in person or on the date you book.
          The next section explains how.
        </p>
      </>
    ),
  },
  {
    id: 'ways-to-receive',
    title: 'Ways to get your order',
    body: (
      <>
        <p>At checkout, you choose how you want to receive your order from each shop:</p>
        <InfoCards
          cards={[
            {
              icon: Truck,
              title: 'Home delivery',
              text: 'The seller delivers to the address you enter at checkout. Include your house number, landmark and pincode so the delivery goes smoothly.',
            },
            {
              icon: Store,
              title: 'Takeaway / pickup',
              tag: 'Free',
              text: 'You tell the shop how many minutes until you arrive. They keep your order ready and hold it until then.',
            },
            {
              icon: Utensils,
              title: 'Dine-in',
              tag: 'Food',
              text: 'For restaurants and cafés. Your table and order are ready when you arrive at the time you gave.',
            },
            {
              icon: Wrench,
              title: 'At-location service',
              tag: 'Services',
              text: 'For salons, repairs and similar services. You visit the provider, or they come to you, at the agreed time.',
            },
            {
              icon: CalendarCheck,
              title: 'Bookings & rentals',
              text: 'Hotels, cabs, tours, events and rentals are confirmed digitally. Nothing is shipped. The service starts on your booked date.',
            },
          ]}
        />
      </>
    ),
  },
  {
    id: 'delivery-areas',
    title: 'Where we deliver',
    body: (
      <Bullets
        items={[
          'Each seller sets their own delivery area. Many local shops deliver within their city or within a few kilometres.',
          'Pick your location in the search bar to see shops that serve your area. Sellers that do not deliver to you may still offer takeaway.',
          'Some sellers ship across India through courier partners. The listing says so when this is available.',
          'We do not ship outside India at the moment.',
        ]}
      />
    ),
  },
  {
    id: 'timelines',
    title: 'Delivery timelines',
    body: (
      <>
        <p>These are typical times after the seller confirms your order. The exact estimate is shown when you order.</p>
        <DataTable
          columns={['Order type', 'Typical delivery time', 'Notes']}
          rows={[
            ['Food', '30–60 minutes', 'Depends on the restaurant and distance'],
            ['Groceries & daily needs', 'Same day', 'Orders after 7 PM may arrive next morning'],
            ['Local shopping (same city)', '1–3 days', 'Many shops offer same-day delivery'],
            ['Other cities in India', '3–7 business days', 'Shipped through courier partners'],
            ['Remote areas (North-East, J&K, islands)', 'Up to 10 business days', 'Depends on courier coverage'],
            ['Manufacturing / bulk orders', 'As quoted by the seller', 'Confirmed in writing before production'],
          ]}
        />
        <Callout>
          Business days are Monday to Saturday, excluding national and public holidays.
        </Callout>
      </>
    ),
  },
  {
    id: 'charges',
    title: 'Shipping charges',
    body: (
      <Bullets
        items={[
          'Each seller sets its own delivery charges. They are always shown in your order total before you pay.',
          'Many sellers offer free delivery above a minimum order value. Takeaway and dine-in never have a delivery charge.',
          'DukanCloude never adds hidden shipping fees. If you are asked to pay extra at the door, refuse and report it to us.',
          <>If an order is cancelled or returned because of a seller error, any delivery charge is refunded in full under our <Link href="/refund-policy">Refund Policy</Link>.</>,
        ]}
      />
    ),
  },
  {
    id: 'processing',
    title: 'Order processing and dispatch',
    body: (
      <>
        <p>
          The seller is notified as soon as you place an order. Most orders are prepared on the same day. Packed goods are
          usually dispatched within <strong>1–2 business days</strong>. If a seller cannot meet the estimate, they should tell
          you straight away. You can then wait or cancel for a full refund.
        </p>
        <p>
          We may hold an order for a short check if it looks unusual, for example a very large Cash on Delivery order. This
          protects buyers and sellers from fraud.
        </p>
      </>
    ),
  },
  {
    id: 'order-updates',
    title: 'Order updates',
    body: (
      <>
        <Bullets
          variant="check"
          items={[
            'You get notifications on DukanCloude when your order is placed and when its status changes.',
            'You can chat with the seller from the shop page to check on your order or change delivery instructions.',
            'Courier shipments include a tracking number from the seller, where one is available.',
          ]}
        />
        <p className="flex items-start gap-2">
          <Bell size={16} className="mt-1.5 shrink-0 text-brand" />
          <span>
            Not receiving updates? Check that your email address is verified and that notifications are allowed in your browser.
          </span>
        </p>
      </>
    ),
  },
  {
    id: 'failed-delivery',
    title: 'If a delivery cannot be completed',
    body: (
      <Bullets
        items={[
          'The seller or courier tries to contact you on your registered phone number before giving up on a delivery.',
          <><strong>Prepaid orders</strong>: if delivery fails twice because you were unavailable or the address was wrong, the order goes back to the seller. You get a refund minus the delivery charges already incurred.</>,
          <><strong>Cash on Delivery orders</strong>: not being available to accept the order counts as a no-show. Two no-shows suspend your account under our <Link href="/terms#cash-on-delivery">COD rules</Link>.</>,
          <><strong>Takeaway</strong>: the shop holds your order until the time you promised. After that, the seller may release it.</>,
        ]}
      />
    ),
  },
  {
    id: 'damaged-parcels',
    title: 'Damaged, missing or tampered parcels',
    body: (
      <>
        <Bullets
          items={[
            'Check the package before you accept it. If it is torn, open, wet or tampered with, you can refuse it.',
            'If the parcel looked fine but the item is damaged or missing, report it within 48 hours. Include photos, and an unboxing video if you have one.',
            <>You will get a replacement or a full refund, as described in our <Link href="/refund-policy#returns">Returns section</Link>.</>,
          ]}
        />
        <Callout tone="accent" title="Marked as delivered but nothing arrived?">
          Contact us within 48 hours at <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>. We will
          investigate with the seller and the courier.
        </Callout>
      </>
    ),
  },
  {
    id: 'delays',
    title: 'Delays beyond our control',
    body: (
      <p>
        Deliveries can be delayed by heavy rain, floods, strikes, curfews, festivals, courier disruptions or government
        restrictions. We and the seller will keep you informed. If a prepaid order is badly delayed, you can cancel it for a full
        refund before it is dispatched.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <LegalShell
      current="/shipping-policy"
      icon={Truck}
      eyebrow="From local shops to your door"
      title="Shipping & Delivery Policy"
      intro="How your order reaches you, how long it takes, what it costs, and what happens if a delivery goes wrong."
      readMinutes={5}
      highlights={highlights}
      sections={sections}
    />
  );
}
