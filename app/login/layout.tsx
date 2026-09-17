import type { Metadata } from 'next';

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
