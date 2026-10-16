import type { Metadata } from 'next';

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Delivery panel',
  robots: { index: false, follow: false },
};

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
