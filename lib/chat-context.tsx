'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ChatTarget = {
  /** Shop chat: the listing/shop the conversation is about. */
  listingId?: string;
  /** Jobs & Freelancing chat: the job the conversation is about (candidate ↔ recruiter). */
  jobId?: string;
  /** Recruiter opening a job chat with one specific applicant. */
  candidateId?: string;
  /** Name shown in the panel header — the shop's name for a buyer, the buyer's name for a seller. */
  title: string;
  /** Small text under the title, e.g. which shop this conversation is about (seller view). */
  subtitle?: string;
  image?: string;
  /** Set when resuming an existing conversation (seller inbox) — skips the buyer-side "start" call. */
  conversationId?: string;
};

type ChatContextValue = {
  isOpen: boolean;
  target: ChatTarget | null;
  openChat: (target: ChatTarget) => void;
  closeChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<ChatTarget | null>(null);

  const openChat = useCallback((next: ChatTarget) => {
    setTarget(next);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Memoized so components like ShopCard (rendered many times per page)
  // don't re-render whenever ChatProvider re-renders for unrelated reasons.
  const value = useMemo(() => ({ isOpen, target, openChat, closeChat }), [isOpen, target, openChat, closeChat]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
