'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function ScrollReveal({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        visible
          ? 'translate-x-0 translate-y-0 opacity-100'
          : direction === 'left'
            ? '-translate-x-16 opacity-0'
            : direction === 'right'
              ? 'translate-x-16 opacity-0'
              : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
