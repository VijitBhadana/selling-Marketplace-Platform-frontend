'use client';

import { memo, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { navIconButtonClass } from './nav-icon-button';

// `bare` drops the border for use inside the navbar's grouped toolbar pill.
export const ThemeToggle = memo(function ThemeToggle({ bare = false }: { bare?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={`rounded-full ${bare ? 'h-8 w-8 md:h-9 md:w-9' : 'h-9 w-9 border border-border'}`} aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      // Outside the navbar (admin) it keeps its full size on phones too.
      className={`${navIconButtonClass()} ${bare ? '' : 'border border-border bg-surface max-md:h-9 max-md:w-9'}`}
    >
      <span key={isDark ? 'sun' : 'moon'} className="animate-fade-in-up">
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </span>
    </button>
  );
});
