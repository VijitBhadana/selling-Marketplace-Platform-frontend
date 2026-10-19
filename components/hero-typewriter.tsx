'use client';

import { useEffect, useState } from 'react';

const TYPE_MS = 90;
const DELETE_MS = 45;
const HOLD_MS = 1800;
const GAP_MS = 350;

// Types each phrase after a blinking caret, holds it, deletes it, then types the
// next one. The invisible longest phrase underneath reserves the width so the
// headline never reflows while the text changes length.
export function HeroTypewriter({ phrases, startDelay = 0 }: { phrases: string[]; startDelay?: number }) {
  const [text, setText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(phrases[0]);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    let length = 0;
    let deleting = false;

    const tick = () => {
      const phrase = phrases[index];
      if (!deleting) {
        length += 1;
        setText(phrase.slice(0, length));
        if (length === phrase.length) {
          deleting = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        length -= 1;
        setText(phrase.slice(0, length));
        if (length === 0) {
          deleting = false;
          index = (index + 1) % phrases.length;
          timer = setTimeout(tick, GAP_MS);
          return;
        }
        timer = setTimeout(tick, DELETE_MS);
      }
    };

    timer = setTimeout(() => {
      setStarted(true);
      tick();
    }, startDelay);
    return () => clearTimeout(timer);
  }, [phrases, startDelay]);

  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), '');

  return (
    <>
      <span className="sr-only">{phrases[0]}</span>
      <span aria-hidden className="inline-grid whitespace-nowrap align-bottom">
        <span className="invisible col-start-1 row-start-1">
          {longest}
          <span className="ml-1 inline-block w-[3px]" />
        </span>
        <span className="col-start-1 row-start-1">
          {text}
          <span
            className={`ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] rounded-full bg-brand ${
              started ? 'animate-caret-blink' : 'opacity-0'
            }`}
          />
        </span>
      </span>
    </>
  );
}
