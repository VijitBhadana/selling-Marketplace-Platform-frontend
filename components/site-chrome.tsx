'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Pages a delivery partner may still open from the storefront (help and policies).
const DELIVERY_ALLOWED = ['/contact', '/about', '/terms', '/privacy-policy', '/refund-policy', '/shipping-policy'];

/**
 * Renders the storefront's navbar / footer everywhere except the admin and delivery
 * panels, which have their own. Delivery partners never browse the Cloudes — any other
 * page sends them back to their panel.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const inPanel = !!pathname?.startsWith('/admin') || !!pathname?.startsWith('/delivery');

  useEffect(() => {
    if (user?.role === 'DELIVERY' && !inPanel && !DELIVERY_ALLOWED.includes(pathname ?? '')) router.replace('/delivery');
  }, [user?.role, inPanel, pathname, router]);

  if (inPanel) return null;
  return <>{children}</>;
}
