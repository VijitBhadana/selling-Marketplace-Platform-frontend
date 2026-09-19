'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';

const CIRCLE = 36; // px — h-9/w-9

type StepperProps = {
  steps: readonly string[];
  current: number;
  onStepClick?: (index: number) => void;
  /** `vertical` renders a rail (used in the post-ad sidebar); `horizontal` is the classic top stepper. */
  orientation?: 'horizontal' | 'vertical';
};

function circleClass(done: boolean, active: boolean, clickable: boolean) {
  return `relative z-10 flex shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-all duration-300 ${
    done
      ? 'bg-brand text-brand-ink shadow-[0_6px_16px_-6px_rgb(var(--brand)/calc(0.7*var(--glow)))]'
      : active
      ? 'bg-surface text-brand ring-2 ring-brand ring-offset-2 ring-offset-surface shadow-[0_0_0_6px_rgb(var(--brand)/calc(0.12*var(--glow)))]'
      : 'bg-surface text-ink-muted ring-1 ring-border'
  } ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`;
}

// Memoized: the post-ad form renders two of these and re-renders on every keystroke,
// while a stepper's props (constant step list, current step, setStep) rarely change.
export const Stepper = memo(function Stepper({ steps, current, onStepClick, orientation = 'horizontal' }: StepperProps) {
  const n = steps.length;

  if (orientation === 'vertical') {
    return (
      <ol className="relative">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = !!onStepClick && i <= current;
          const last = i === n - 1;

          return (
            <li key={label} className="relative flex gap-3.5 pb-6 last:pb-0">
              {!last && (
                <span className="absolute left-[17px] top-10 bottom-1 w-0.5 overflow-hidden rounded-full bg-border">
                  <span
                    className="block w-full bg-brand transition-all duration-500 ease-out"
                    style={{ height: done ? '100%' : '0%' }}
                  />
                </span>
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                aria-label={label}
                aria-current={active ? 'step' : undefined}
                style={{ height: CIRCLE, width: CIRCLE }}
                className={circleClass(done, active, clickable)}
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </button>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                className={`min-w-0 pt-0.5 text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                tabIndex={-1}
              >
                <span className={`block text-sm font-semibold ${active ? 'text-ink' : done ? 'text-ink' : 'text-ink-muted'}`}>
                  {label}
                </span>
                <span className={`block text-xs ${active ? 'text-brand' : 'text-ink-muted'}`}>
                  {done ? 'Completed' : active ? 'In progress' : 'Up next'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  const halfSlot = 100 / n / 2; // % — distance from a column edge to its circle's center
  const progressFraction = n > 1 ? Math.min(current, n - 1) / (n - 1) : 0;
  const spanPercent = 100 - halfSlot * 2;

  return (
    <div>
      {/* Phones: compact "Step x of n" with segmented progress */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            Step {Math.min(current, n - 1) + 1} of {n}
          </span>
          <span className="truncate text-sm font-semibold text-ink">{steps[Math.min(current, n - 1)]}</span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {steps.map((label, i) => {
            const clickable = !!onStepClick && i <= current;
            return (
              <button
                key={label}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                aria-label={label}
                aria-current={i === current ? 'step' : undefined}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < current ? 'bg-brand' : i === current ? 'bg-brand/50' : 'bg-border'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Tablet and up: circles + connecting line at exact circle-center height */}
      <div className="hidden px-1 py-1 sm:block">
        <div className="relative flex items-center" style={{ height: CIRCLE }}>
          <div
            className="absolute h-0.5 rounded-full bg-border"
            style={{ left: `${halfSlot}%`, right: `${halfSlot}%` }}
          />
          <div
            className="absolute h-0.5 rounded-full bg-brand transition-all duration-500 ease-out"
            style={{ left: `${halfSlot}%`, width: `${progressFraction * spanPercent}%` }}
          />
          <div className="relative flex w-full">
            {steps.map((label, i) => {
              const done = i < current;
              const active = i === current;
              const clickable = !!onStepClick && i <= current;

              return (
                <div key={label} className="flex flex-1 justify-center">
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && onStepClick?.(i)}
                    aria-label={label}
                    aria-current={active ? 'step' : undefined}
                    style={{ height: CIRCLE, width: CIRCLE }}
                    className={circleClass(done, active, clickable)}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2.5 flex">
          {steps.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div key={label} className="flex-1 px-0.5 text-center">
                <span
                  className={`text-xs leading-tight ${
                    active ? 'font-semibold text-brand' : done ? 'font-medium text-ink' : 'font-medium text-ink-muted'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
