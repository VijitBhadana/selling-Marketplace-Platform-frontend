import type { Metadata } from 'next';

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
