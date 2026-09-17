'use client';

import Image from 'next/image';

// next/image's built-in loader can only proxy remote URLs matching next.config's
// remotePatterns — it can't handle a data:/blob: URL (an uploaded photo's local
// preview or resized cover image), so those render as a plain <img> instead.
export function SmartImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className ?? ''}`} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
}
