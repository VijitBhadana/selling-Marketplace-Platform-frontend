import type { Metadata, Viewport } from 'next';
import { Manrope, Inter, Space_Grotesk, Open_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/lib/auth-context';
import { AuthModal } from '@/components/auth-modal';
import { ChatProvider } from '@/lib/chat-context';
import { ChatPanel } from '@/components/chat-panel';
import { CartProvider } from '@/lib/cart-context';
import { BucketWarningModal } from '@/components/bucket-warning-modal';
import { AdvertisementPopup } from '@/components/advertisement-popup';
import { JsonLd } from '@/components/json-ld';
import { TopLoader } from '@/components/top-loader';
import { BrandThemeStyle } from '@/components/brand-theme-style';
import { SiteChrome } from '@/components/site-chrome';
import { ogImageUrl } from '@/lib/seo';
import { SITE_DESCRIPTION, SITE_DOMAIN, SITE_KEYWORDS, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';

const display = Manrope({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const hero = Space_Grotesk({ subsets: ['latin'], variable: '--font-hero', weight: ['500', '600', '700'] });
// Only the shop and bucket-list pages use Open Sans — not preloaded on every other page.
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', preload: false });

const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;
const defaultOgImage = ogImageUrl(SITE_TAGLINE, 'Buy, sell, hire & book — every local business, one place.');
const bingVerification = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  category: 'marketplace',
  // No canonical / og:url here — children would inherit them. Each indexable
  // page sets its own through pageMetadata() in lib/seo.ts.
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE_NAME,
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: defaultTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  // Codes from Google Search Console / Bing Webmaster Tools (HTML-tag method).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: bingVerification ? { 'msvalidate.01': bingVerification } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7F9' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1218' },
  ],
};

// Organization + WebSite entities: feed Google's site name and logo in results.
const siteJsonLd = [
  {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/apple-icon`,
    description: SITE_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'India' },
  },
  {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ['Dukan Cloude', SITE_DOMAIN],
    url: `${SITE_URL}/`,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${hero.variable} ${openSans.variable} font-body`}>
        <BrandThemeStyle />
        <TopLoader />
        <JsonLd data={siteJsonLd} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <ChatProvider>
                <div className="flex min-h-screen flex-col overflow-x-clip">
                  <SiteChrome>
                    <Navbar />
                  </SiteChrome>
                  <main className="flex-1">{children}</main>
                  <SiteChrome>
                    <Footer />
                  </SiteChrome>
                </div>
                <AuthModal />
                <ChatPanel />
                <BucketWarningModal />
                <AdvertisementPopup />
              </ChatProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
