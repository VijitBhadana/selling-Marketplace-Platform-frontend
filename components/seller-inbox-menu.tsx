'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Briefcase, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { api, ApiError } from '@/lib/api';
import { withImageParams } from '@/lib/image-utils';
import { ListRowsSkeleton } from './skeleton';

// A conversation is about either a shop (listing) or, in Jobs & Freelancing, a job.
type Conversation = {
  id: string;
  listing: { id: string; shopName: string | null; title: string; coverImageUrl: string | null } | null;
  job: { id: string; title: string; companyName: string } | null;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  messages: { content: string; createdAt: string }[];
  unreadCount: number;
};

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

function aboutLabel(c: Conversation) {
  if (c.job) return c.job.title;
  return c.listing ? c.listing.shopName || c.listing.title : '';
}

// Takes no props — memoized so it doesn't re-render whenever Navbar re-renders
// for unrelated reasons (search input typing, scroll state, profile toggle).
export const SellerInboxMenu = memo(function SellerInboxMenu() {
  const { user, token } = useAuth();
  const { openChat } = useChat();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const isSeller = user?.role === 'SELLER';

  useEffect(() => {
    if (!isSeller || !token) return;
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.messages.unreadCount(token!);
        if (!cancelled) setUnreadCount(data.count ?? 0);
      } catch {
        // transient — next poll retries
      }
    }

    poll();
    const interval = setInterval(poll, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSeller, token]);

  useEffect(() => {
    if (!open || !token) return;
    api.messages
      .myConversations(token)
      .then((data) => setConversations(data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your chats.'));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!isSeller) return null;

  function openConversation(c: Conversation) {
    setOpen(false);
    openChat({
      listingId: c.listing?.id,
      jobId: c.job?.id,
      conversationId: c.id,
      title: c.buyer.name,
      subtitle: `About: ${aboutLabel(c)}`,
      image: c.listing?.coverImageUrl ?? undefined,
    });
    // Reflect the read state locally right away rather than waiting for the next poll.
    setUnreadCount((n) => Math.max(0, n - c.unreadCount));
  }

  return (
    <div className="sm:relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buyer messages"
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          open ? 'border-brand bg-brand-soft text-brand' : 'border-border text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand'
        }`}
      >
        <MessageCircle size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-4 top-full z-50 mt-1 rounded-2xl sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:mt-0 sm:w-80 border border-border bg-surface p-2 shadow-[0_16px_40px_-14px_rgb(0_0_0_/_0.3)]">
          <div className="flex items-center justify-between px-2.5 py-2">
            <p className="text-sm font-semibold text-ink">Buyer messages</p>
          </div>
          <div className="my-1 h-px bg-border" />

          <div className="max-h-80 overflow-y-auto">
            {conversations === null && !error && <ListRowsSkeleton label="Loading your chats…" />}
            {error && <p className="px-2.5 py-4 text-center text-xs text-accent">{error}</p>}
            {conversations?.length === 0 && (
              <p className="px-2.5 py-4 text-center text-xs text-ink-muted">
                No buyer has messaged you yet.
              </p>
            )}
            {conversations?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openConversation(c)}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft text-brand">
                  {c.job ? (
                    <Briefcase size={16} />
                  ) : (
                    c.listing?.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={withImageParams(c.listing.coverImageUrl, 'w=80&q=70&auto=format&fit=crop')}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{c.buyer.name}</p>
                    {c.messages[0] && (
                      <span className="shrink-0 text-[11px] text-ink-muted">{timeAgo(c.messages[0].createdAt)}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-muted">
                    {c.messages[0]?.content ?? `About ${aboutLabel(c)}`}
                  </p>
                </div>
                {c.unreadCount > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
