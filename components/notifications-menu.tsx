'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Bell, CalendarCheck, FileText, Megaphone, PackagePlus, ShoppingBag, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { api, ApiError } from '@/lib/api';
import { withImageParams } from '@/lib/image-utils';
import { useVisibleInterval } from '@/lib/use-visible-interval';
import { ListRowsSkeleton } from './skeleton';
import { navBadgeClass, navIconButtonClass } from './nav-icon-button';

// Persisted alerts: order placed (seller), job application (recruiter), interview
// scheduled (candidate, from the Jobs & Freelancing Cloude), plus the Financing Cloude's
// scheme application (agency) and its decision (applicant).
type AlertNotification = {
  id: string;
  type: 'ORDER_PLACED' | 'JOB_APPLICATION' | 'INTERVIEW_SCHEDULED' | 'FINANCE_APPLICATION' | 'FINANCE_DECISION' | 'ANNOUNCEMENT';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  jobId: string | null;
  job: { id: string; title: string; companyName: string } | null;
  listingId: string | null;
  listing: { id: string; shopName: string | null; title: string } | null;
};

type BuyerNotification = {
  id: string;
  type: 'NEW_PRODUCT';
  title: string;
  body: string;
  image: string | null;
  listingId: string;
  createdAt: string;
  isNew: boolean;
};

type NotificationItem = AlertNotification | BuyerNotification;

const ALERT_ICONS = {
  ORDER_PLACED: ShoppingBag,
  JOB_APPLICATION: UserPlus,
  INTERVIEW_SCHEDULED: CalendarCheck,
  FINANCE_APPLICATION: FileText,
  FINANCE_DECISION: BadgeCheck,
  ANNOUNCEMENT: Megaphone,
} as const;

const UNREAD_POLL_MS = 10000;

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function AlertContent({ item }: { item: AlertNotification }) {
  const AlertIcon = ALERT_ICONS[item.type] ?? Bell;
  return (
    <>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <AlertIcon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
          <span className="shrink-0 text-[11px] text-ink-muted">{timeAgo(item.createdAt)}</span>
        </div>
        <p className="line-clamp-2 text-xs text-ink-muted">{item.body}</p>
      </div>
      {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
    </>
  );
}

// Takes no props — memoized so it doesn't re-render whenever Navbar re-renders
// for unrelated reasons (search input typing, scroll state, profile toggle).
export const NotificationsMenu = memo(function NotificationsMenu() {
  const { user, token } = useAuth();
  const { openChat } = useChat();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useVisibleInterval(
    (isStale) => {
      api.notifications
        .unreadCount(token!)
        .then((data) => !isStale() && setUnreadCount(data.count ?? 0))
        .catch(() => {
          // transient — next poll retries
        });
    },
    UNREAD_POLL_MS,
    token,
  );

  useEffect(() => {
    if (!open || !token) return;
    api.notifications
      .list(token)
      .then((data) => {
        setItems(data);
        setUnreadCount(0);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load notifications.'));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Notifications"
        className={`${navIconButtonClass()} hidden lg:flex`}
      >
        <Bell size={17} />
      </Link>
    );
  }

  const alertRowClass = 'flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left';

  function renderAlert(item: AlertNotification) {
    // Recruiter: "X applied for <job>" → the job's responses.
    if (item.type === 'JOB_APPLICATION' && item.jobId) {
      return (
        <Link
          key={item.id}
          href={`/jobs/${item.jobId}#responses`}
          onClick={() => setOpen(false)}
          className={`${alertRowClass} transition-colors hover:bg-surface-hover`}
        >
          <AlertContent item={item} />
        </Link>
      );
    }
    // Agency: "X applied for <scheme>" → the shop's applications, where the papers are.
    if (item.type === 'FINANCE_APPLICATION' && item.listingId) {
      return (
        <Link
          key={item.id}
          href={`/listing/${item.listingId}#applications`}
          onClick={() => setOpen(false)}
          className={`${alertRowClass} transition-colors hover:bg-surface-hover`}
        >
          <AlertContent item={item} />
        </Link>
      );
    }
    // Applicant: the agency's decision → the chat with them, where the sanctioned figures are.
    if (item.type === 'FINANCE_DECISION' && item.listing) {
      const listing = item.listing;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setOpen(false);
            openChat({ listingId: listing.id, title: listing.shopName || listing.title });
          }}
          className={`${alertRowClass} transition-colors hover:bg-surface-hover`}
        >
          <AlertContent item={item} />
        </button>
      );
    }
    // Candidate: "Interview scheduled" → the chat with the recruiter, where the details are.
    if (item.type === 'INTERVIEW_SCHEDULED' && item.job) {
      const job = item.job;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setOpen(false);
            openChat({ jobId: job.id, title: job.companyName, subtitle: `About: ${job.title}` });
          }}
          className={`${alertRowClass} transition-colors hover:bg-surface-hover`}
        >
          <AlertContent item={item} />
        </button>
      );
    }
    return (
      <div key={item.id} className={alertRowClass}>
        <AlertContent item={item} />
      </div>
    );
  }

  return (
    <div className="sm:relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={navIconButtonClass(open)}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className={`${navBadgeClass} bg-accent text-white`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-4 top-full z-50 mt-1 rounded-2xl sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:mt-0 sm:w-80 border border-border bg-surface p-2 shadow-[0_16px_40px_-14px_rgb(0_0_0_/_0.3)]">
          <div className="flex items-center justify-between px-2.5 py-2">
            <p className="text-sm font-semibold text-ink">
              {user.role === 'SELLER' ? 'Orders, jobs & applications' : 'Notifications'}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />

          <div className="max-h-80 overflow-y-auto">
            {items === null && !error && <ListRowsSkeleton label="Loading notifications…" />}
            {error && <p className="px-2.5 py-4 text-center text-xs text-accent">{error}</p>}
            {items?.length === 0 && (
              <p className="px-2.5 py-4 text-center text-xs text-ink-muted">
                {user.role === 'SELLER' ? 'No orders or applications yet.' : 'No notifications yet.'}
              </p>
            )}

            {items?.map((item) =>
              item.type !== 'NEW_PRODUCT' ? (
                renderAlert(item)
              ) : (
                <Link
                  key={item.id}
                  href={`/listing/${item.listingId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-hover"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-brand-soft text-brand">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={withImageParams(item.image, 'w=80&q=70&auto=format&fit=crop')}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <PackagePlus size={15} />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                      <span className="shrink-0 text-[11px] text-ink-muted">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-ink-muted">{item.body}</p>
                  </div>
                  {item.isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
});
