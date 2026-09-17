import { ImageResponse } from 'next/og';

// Edge, like /og: next/og under the Node runtime fails on Windows in Next 14.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS home-screen icon; also the PNG logo referenced by the Organization JSON-LD.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#007AFF' }}>
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      </div>
    ),
    size,
  );
}
