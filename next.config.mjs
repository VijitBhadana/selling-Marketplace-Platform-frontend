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
};

export default nextConfig;
