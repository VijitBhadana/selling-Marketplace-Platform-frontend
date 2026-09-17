'use client';

import { useEffect, useRef, useState } from 'react';
import { Briefcase, Send, Store, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { api, ApiError } from '@/lib/api';
import { Skeleton, SkeletonGroup } from './skeleton';

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

const POLL_INTERVAL_MS = 3000;

function ChatMessagesSkeleton() {
  return (
    <SkeletonGroup label="Loading conversation…" className="flex flex-col gap-3">
      {['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5'].map((w, i) => (
        <div key={w} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-9 rounded-2xl ${w}`} />
        </div>
      ))}
    </SkeletonGroup>
  );
}

export function ChatPanel() {
  const { isOpen, target, closeChat } = useChat();
  const { user, token } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  // null until the first poll returns, so the skeleton shows instead of the "Say hello" empty state.
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Start (or resume) the conversation whenever the panel opens for a new shop.
  // If a conversationId is already known (seller opening from their inbox), skip straight to it.
  useEffect(() => {
    if (!isOpen || !target || !token) return;
    let cancelled = false;
    setError(null);
    setMessages(null);

    if (target.conversationId) {
      setConversationId(target.conversationId);
      setLoading(false);
      return;
    }

    setLoading(true);
    setConversationId(null);

    const start = target.jobId
      ? api.messages.startForJob(target.jobId, token, target.candidateId)
      : api.messages.start(target.listingId ?? '', token);

    start
      .then((conversation) => {
        if (cancelled) return;
        setConversationId(conversation.id);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not start the chat.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, target, token]);

  // Poll for new messages while the panel is open.
  useEffect(() => {
    if (!isOpen || !conversationId || !token) return;
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.messages.list(conversationId!, token!);
        if (!cancelled) setMessages(data);
      } catch {
        // transient network hiccup — the next poll will retry
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, conversationId, token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeChat();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeChat]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !conversationId || !token || sending) return;

    setSending(true);
    setDraft('');
    try {
      const message = await api.messages.send(conversationId, content, token);
      setMessages((prev) => [...(prev ?? []), message]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Message could not be sent.');
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onMouseDown={closeChat} />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-fade-in-up flex-col border-l border-border bg-surface shadow-2xl sm:max-w-md" style={{ animationDuration: '0.22s' }}>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {target.jobId ? <Briefcase size={18} /> : <Store size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{target.title}</p>
            <p className="truncate text-xs text-ink-muted">
              {loading ? 'Connecting…' : target.subtitle ?? (target.jobId ? 'Chat with the recruiter' : 'Chat with the shop owner')}
            </p>
          </div>
          <button
            type="button"
            onClick={closeChat}
            aria-label="Close chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {(loading || (messages === null && !error)) && <ChatMessagesSkeleton />}

          {!loading && messages?.length === 0 && !error && (
            <p className="text-center text-xs text-ink-muted">
              Say hello — your message goes straight to {target.title}.
            </p>
          )}

          {messages?.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine ? 'bg-brand text-brand-ink' : 'bg-surface-hover text-ink'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="border-t border-border px-4 py-2 text-xs text-accent">{error}</p>}

        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            disabled={!conversationId || sending}
            className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || !conversationId || sending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
