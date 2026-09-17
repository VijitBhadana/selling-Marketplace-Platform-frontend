'use client';

import { useEffect, useState } from 'react';

// A handful of example searches spanning different Cloudes, so the rotation
// itself hints at how broad the marketplace is. Rendered after a fixed "Search"
// lead-in, so only these fragments animate.
const PHRASES = [
  'products, services, jobs…',
  'AC repair near me',
  '2BHK flat for rent',
  'home tutor for Class 10',
  'wedding banquet hall',
  'fresh vegetables wholesale',
  'web developer freelancer',
  'gym near me',
];

const ROTATE_MS = 2600;

// Native <input placeholder> can't be animated, so this renders the rotating
// text as an absolutely-positioned overlay (pointer-events disabled so clicks
// still reach the input underneath) and hides itself once the field has a value.
export function AnimatedSearchPlaceholder({ hidden, className }: { hidden: boolean; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (hidden) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [hidden]);

  if (hidden) return null;

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 flex items-center overflow-hidden text-sm text-ink-muted ${className ?? ''}`}
    >
      <span className="shrink-0">Search&nbsp;</span>
      <span key={index} className="animate-fade-in-up truncate">
        {PHRASES[index]}
      </span>
    </span>
  );
}
