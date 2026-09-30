/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // One canonical host for SEO: www.dukancloude.com → dukancloude.com (301).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dukancloude.com' }],
        destination: 'https://dukancloude.com/:path*',
        permanent: true,
      },
    ];
  },
  // The backend is plain http. A page served over https (Vercel) can't call it
  // from the browser (mixed content), so browser requests go to /backend/* on
  // our own origin and are proxied to the API server-side (see lib/api.ts).
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
