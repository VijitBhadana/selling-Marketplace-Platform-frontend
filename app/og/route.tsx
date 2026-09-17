import { ImageResponse } from 'next/og';
import { SITE_DOMAIN, SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const runtime = 'edge';

function clamp(value: string | null, max: number) {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Branded 1200×630 social-preview card: /og?title=...&subtitle=...
// Every page's og:image / twitter:image points here (see ogImageUrl in lib/seo.ts),
// so links shared on WhatsApp, Facebook, X or LinkedIn get a proper preview.
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clamp(searchParams.get('title'), 80) || SITE_TAGLINE;
  const subtitle = clamp(searchParams.get('subtitle'), 130);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #007AFF 0%, #0050B3 100%)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.18)',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <div style={{ fontSize: 38, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: title.length > 48 ? 56 : 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 30, lineHeight: 1.35, color: 'rgba(255,255,255,0.85)' }}>{subtitle}</div> : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: 'rgba(255,255,255,0.8)' }}>
          <div>{SITE_DOMAIN}</div>
          <div>Free to post · OTP-verified sellers</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
    },
  );
}
