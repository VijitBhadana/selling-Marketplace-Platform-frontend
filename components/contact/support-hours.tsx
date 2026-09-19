'use client';

import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

// Keep in sync with COMPANY.supportHours in lib/legal.ts (Mon – Sat, 10 AM – 7 PM IST).
const OPEN_HOUR = 10;
const CLOSE_HOUR = 19;

const rows = [
  { label: 'Monday – Friday', days: [1, 2, 3, 4, 5], hours: '10:00 AM – 7:00 PM' },
  { label: 'Saturday', days: [6], hours: '10:00 AM – 7:00 PM' },
  { label: 'Sunday', days: [0], hours: 'Email only' },
];

/** Current wall-clock time in India, whatever the visitor's own time zone. */
function nowInIndia() {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60_000);
}

function status(ist: Date) {
  const day = ist.getDay();
  const hour = ist.getHours() + ist.getMinutes() / 60;
  const workingDay = day !== 0;
  if (workingDay && hour >= OPEN_HOUR && hour < CLOSE_HOUR) return { open: true, note: 'Our team is online now' };
  if (workingDay && hour < OPEN_HOUR) return { open: false, note: 'Back today at 10 AM' };
  if (day === 6 || day === 0) return { open: false, note: 'Back Monday at 10 AM' };
  return { open: false, note: 'Back tomorrow at 10 AM' };
}

export function SupportHours() {
  // Computed after mount so the server render (UTC) never disagrees with the browser.
  const [ist, setIst] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setIst(nowInIndia());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  const current = ist ? status(ist) : null;
  const today = ist?.getDay();

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Clock3 size={18} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-ink">Support hours</p>
            <p className="text-xs text-ink-muted">Indian Standard Time</p>
          </div>
        </div>
        <span
          className={`inline-flex min-h-[26px] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity ${
            current ? 'opacity-100' : 'opacity-0'
          } ${current?.open ? 'bg-brand-soft text-brand' : 'bg-surface-hover text-ink-muted'}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${current?.open ? 'animate-pulse-dot bg-brand' : 'bg-ink-muted/60'}`}
          />
          {current?.open ? 'Online' : 'Offline'}
        </span>
      </div>

      <ul className="mt-4 space-y-1">
        {rows.map((row) => {
          const isToday = today !== undefined && row.days.includes(today);
          return (
            <li
              key={row.label}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                isToday ? 'bg-brand-soft/60 font-semibold text-ink' : 'text-ink-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                {row.label}
                {isToday && <span className="rounded bg-brand px-1.5 py-px text-[10px] font-bold uppercase text-brand-ink">Today</span>}
              </span>
              <span className="tabular-nums">{row.hours}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 min-h-[1rem] text-xs leading-relaxed text-ink-muted">
        {current?.open
          ? `${current.note}. Calls and emails get the quickest reply right now.`
          : `${current ? `${current.note} · ` : ''}Emails sent after hours are answered first thing the next working day.`}
      </p>
    </div>
  );
}
