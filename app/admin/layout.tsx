import type { Metadata } from 'next';

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Admin panel',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
