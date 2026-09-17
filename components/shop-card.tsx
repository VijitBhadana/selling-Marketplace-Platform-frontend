'use client';

import Link from 'next/link';
import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, MessageCircle, Sparkles, Store } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { withImageParams } from '@/lib/image-utils';
import { SmartImage } from '@/components/smart-image';
import { startTopLoader } from '@/components/top-loader';

export type ShopCardProps = {
  id: string;
  shopName: string;
  categoryName: string;
  description?: string;
  image: string;
  city?: string;
  isNew?: boolean;
};

// Grids render many of these at once — memoized so a grid re-render (e.g.
// merging in locally-posted drafts) doesn't re-render every unaffected card.
export const ShopCard = memo(function ShopCard({ id, shopName, categoryName, description, image, city, isNew }: ShopCardProps) {
  const { requireAuth } = useAuth();
  const { openChat } = useChat();
  const router = useRouter();
  const initial = shopName.trim().charAt(0).toUpperCase() || 'S';

  function visitStore() {
    startTopLoader(`/listing/${id}`);
    router.push(`/listing/${id}`);
  }

  function openChatPanel() {
    requireAuth(() => openChat({ listingId: id, title: shopName, image }), 'purchase');
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-soft">
        <SmartImage
          src={withImageParams(image, 'w=600&q=75&auto=format&fit=crop')}
          alt={shopName}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
        <span
          className={`absolute left-3 top-3 truncate rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm ${
            isNew ? 'max-w-[calc(100%-6rem)]' : 'max-w-[calc(100%-1.5rem)]'
          }`}
        >
          {categoryName}
        </span>
        {isNew && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
            <Sparkles size={11} className="text-brand" /> New
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-3 pb-3 sm:px-4 sm:pb-4">
        <span className="-mt-6 mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-brand text-lg font-bold text-brand-ink shadow-card">
          {initial}
        </span>

        <Link href={`/listing/${id}`} className="break-words font-display text-base font-bold leading-tight text-ink hover:text-brand">
          {shopName}
        </Link>
        <span className="mt-0.5 flex items-start gap-1 text-xs font-medium text-ink-muted">
          <Store size={12} className="mt-0.5 shrink-0" /> {categoryName}
        </span>

        {description && <p className="mt-2 line-clamp-2 break-words text-sm text-ink-muted">{description}</p>}

        {city && (
          <span className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={12} className="shrink-0" /> {city}
          </span>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <button
            type="button"
            onClick={visitStore}
            className="min-w-[7rem] flex-1 whitespace-nowrap rounded-full bg-brand px-3 py-2 text-center text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
          >
            Visit Store
          </button>
          <button
            type="button"
            onClick={openChatPanel}
            className="flex min-w-[7rem] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            <MessageCircle size={15} /> Chat
          </button>
        </div>
      </div>
    </div>
  );
});
