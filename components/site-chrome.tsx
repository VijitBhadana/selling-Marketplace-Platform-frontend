'use client';

import { usePathname } from 'next/navigation';

/** Renders the storefront's navbar / footer everywhere except the admin panel, which has its own. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
