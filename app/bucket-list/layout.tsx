import type { Metadata } from 'next';

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Your bucket list',
  robots: { index: false, follow: false },
};

export default function BucketListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
