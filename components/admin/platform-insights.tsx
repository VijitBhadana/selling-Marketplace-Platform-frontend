'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, Flag, IndianRupee, LayoutGrid, MailWarning, PackageCheck, PencilLine } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cardClass, formatAmount } from './shared';

type Insights = {
  days: number;
  orders: { total: number; pending: number; completed: number; noShow: number; revenue: number };
  topCloudes: { name: string; slug: string; listings: number }[];
  attention: { unverified: number; codStrikes: number; reports: number; drafts: number };
};

const BAR_COLORS = ['bg-brand', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-pink-500'];

function CardHead({ icon, title, sub, pill, pillClass }: { icon: React.ReactNode; title: string; sub: string; pill?: string; pillClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-brand">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>
      </div>
      {pill && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${pillClass}`}>{pill}</span>}
    </div>
  );
}

/** Orders, busiest Cloudes and things needing review — refreshed with the date range. */
export function PlatformInsights({ days, refreshKey, onNavigate }: { days: number; refreshKey: number; onNavigate: (tab: string) => void }) {
  const { token } = useAuth();
  const [data, setData] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setFailed(false);
    api.admin
      .insights(token, days)
      .then((res: Insights) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [token, days, refreshKey]);

  if (failed && !data) return null;

  const card = `${cardClass} flex flex-col p-5 sm:p-6`;
  const o = data?.orders;
  const statusParts = o
    ? [
        { label: 'Completed', value: o.completed, color: 'bg-emerald-500' },
        { label: 'Pending', value: o.pending, color: 'bg-amber-500' },
        { label: 'No-show', value: o.noShow, color: 'bg-red-500' },
      ]
    : [];
  const maxListings = Math.max(1, ...(data?.topCloudes.map((c) => c.listings) ?? [1]));
  const a = data?.attention;
  const attentionRows = a
    ? [
        { label: 'Unverified accounts', value: a.unverified, icon: MailWarning, tab: 'users' },
        { label: 'Buyers with COD strikes', value: a.codStrikes, icon: AlertTriangle, tab: 'users' },
        { label: `Seller reports (${data!.days}d)`, value: a.reports, icon: Flag },
        { label: 'Draft listings', value: a.drafts, icon: PencilLine },
      ]
    : [];
  const openItems = attentionRows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {/* Orders */}
      <div className={card}>
        <CardHead
          icon={<PackageCheck size={18} />}
          title="Orders"
          sub={`Placed in the last ${days} days`}
          pill={o ? `${o.total} total` : undefined}
          pillClass="bg-brand-soft text-brand"
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface-hover/60 px-3 py-2.5">
            <p className="text-[11px] text-ink-muted">Avg. order</p>
            <p className="mt-0.5 font-display text-base font-bold tabular-nums text-ink">
              {o ? (o.total - o.noShow > 0 ? formatAmount(Math.round(o.revenue / (o.total - o.noShow))) : '—') : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-surface-hover/60 px-3 py-2.5">
            <p className="text-[11px] text-ink-muted">Completion rate</p>
            <p className="mt-0.5 font-display text-base font-bold tabular-nums text-ink">
              {o && o.total > 0 ? `${Math.round((o.completed / o.total) * 100)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-2">
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <IndianRupee size={12} /> Order value
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-ink">{o ? formatAmount(o.revenue) : '—'}</span>
          </div>
          <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-hover">
            {o &&
              o.total > 0 &&
              statusParts.map((s) =>
                s.value ? <span key={s.label} className={s.color} style={{ width: `${(s.value / o.total) * 100}%` }} /> : null,
              )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-ink-muted">
            {statusParts.map((s) => (
              <span key={s.label} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                {s.label} {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Cloudes */}
      <div className={card}>
        <CardHead icon={<LayoutGrid size={18} />} title="Top Cloudes" sub="Most shops & ads, all time" />
        <ul className="mt-5 space-y-3">
          {!data && <li className="text-xs text-ink-muted">Loading…</li>}
          {data?.topCloudes.length === 0 && <li className="text-xs text-ink-muted">No listings yet.</li>}
          {data?.topCloudes.map((c, i) => (
            <li key={c.slug || c.name}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-ink">{c.name.replace(/\s*Cloude$/, '')}</span>
                <span className="shrink-0 font-semibold tabular-nums text-ink-muted">{c.listings}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${(c.listings / maxListings) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Needs attention */}
      <div className={card}>
        <CardHead
          icon={<AlertTriangle size={18} />}
          title="Needs Attention"
          sub="Accounts and posts to review"
          pill={a ? (openItems ? `${openItems} open` : 'All clear') : undefined}
          pillClass={
            openItems
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }
        />
        <ul className="mt-4 space-y-1">
          {!data && <li className="text-xs text-ink-muted">Loading…</li>}
          {attentionRows.map((r) => {
            const body = (
              <>
                <r.icon size={15} className={r.value ? 'text-amber-500' : 'text-ink-muted'} />
                <span className="min-w-0 flex-1 truncate text-left">{r.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    r.value ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-surface-hover text-ink-muted'
                  }`}
                >
                  {r.value}
                </span>
              </>
            );
            return (
              <li key={r.label}>
                {r.tab ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(r.tab!)}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-hover"
                  >
                    {body}
                    <ChevronRight size={14} className="text-ink-muted transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 px-2 py-2 pr-[30px] text-xs font-medium text-ink">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
