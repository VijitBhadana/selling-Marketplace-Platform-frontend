import { pageMetadata } from '@/lib/seo';

// page.tsx is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: 'Post a Free Ad — List Your Shop, Service or Job',
  description:
    'List your shop, product, service or job on DukanCloude for free. Pick a Cloude, add details and photos, and go live in 2 minutes after OTP verification.',
  path: '/post-ad',
});

export default function PostAdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
