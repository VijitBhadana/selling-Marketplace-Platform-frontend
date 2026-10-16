'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Bike,
  CheckCircle2,
  Circle,
  Crosshair,
  History,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  Store,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { useVisibleInterval } from '@/lib/use-visible-interval';
import { detectLocation, locateTypedCity } from '@/lib/user-location';
import {
  addressMapUrl,
  shopMapUrl,
  vehicleLabel,
  type DeliveryOrder,
  type DeliveryProfile,
} from '@/lib/delivery';
import { NotificationsMenu } from '@/components/notifications-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton, SkeletonGroup } from '@/components/skeleton';
import { startTopLoader } from '@/components/top-loader';

const POLL_MS = 10000;

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} h ago` : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const isToday = (iso: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

function CallLink({ phone, label }: { phone: string | null | undefined; label: string }) {
  if (!phone) return null;
  return (
    <a
      href={`tel:+91${phone}`}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
    >
      <Phone size={11} /> {label}
    </a>
  );
}

function MapLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
    >
      <Navigation size={11} /> Directions
    </a>
  );
}

/** Pickup (shop) and drop (buyer) — the two stops of every delivery. */
function Route({ order }: { order: DeliveryOrder }) {
  const shop = order.listing;
  return (
    <ol className="relative mt-3 space-y-3 before:absolute before:bottom-6 before:left-[15px] before:top-8 before:w-px before:bg-border">
      <li className="relative flex gap-3">
        <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Store size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Pick up from</p>
          <p className="truncate text-sm font-semibold text-ink">{order.shopName || shop?.shopName || shop?.title || 'Shop'}</p>
          {shop && (
            <>
              <p className="text-xs text-ink-muted">{[shop.city, shop.pincode].filter(Boolean).join(' · ') || 'Location not shared'}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <MapLink href={shopMapUrl(shop)} />
                <CallLink phone={shop.seller.phone} label={`Call ${shop.seller.name.split(' ')[0]}`} />
              </div>
            </>
          )}
        </div>
      </li>
      <li className="relative flex gap-3">
        <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MapPin size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Deliver to</p>
          <p className="text-sm font-semibold text-ink">{order.buyer.name}</p>
          <p className="break-words text-xs text-ink-muted">{order.address}</p>
          {order.address && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <MapLink href={addressMapUrl(order.address)} />
              <CallLink phone={order.buyer.phone} label="Call buyer" />
            </div>
          )}
        </div>
      </li>
    </ol>
  );
}

function OrderSummary({ order, highlight = false }: { order: DeliveryOrder; highlight?: boolean }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          {highlight && <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />}
          Order placed {timeAgo(order.createdAt)}
        </p>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          ₹{Number(order.totalAmount).toFixed(0)} · Paid online
        </span>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-ink">
        <Package size={13} className="mt-0.5 shrink-0 text-ink-muted" />
        {order.items.map((it) => `${it.quantity} × ${it.productName}`).join(', ')}
      </p>
      <Route order={order} />
    </>
  );
}

/** Accepted → Picked up → Delivered. */
function Progress({ status }: { status: DeliveryOrder['deliveryStatus'] }) {
  const steps = ['Accepted', 'Picked up', 'Delivered'];
  const reached = status === 'DELIVERED' ? 3 : status === 'PICKED_UP' ? 2 : 1;
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label, i) => (
        <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
          {i < reached ? (
            <CheckCircle2 size={15} className="shrink-0 text-brand" />
          ) : (
            <Circle size={15} className="shrink-0 text-ink-muted/50" />
          )}
          <span className={`truncate text-[11px] font-semibold ${i < reached ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
          {i < steps.length - 1 && <span className={`h-px flex-1 ${i + 1 < reached ? 'bg-brand' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, count }: { icon: typeof Bell; title: string; count?: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      <Icon size={14} className="text-brand" /> {title}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-ink">{count}</span>
      )}
    </h2>
  );
}

function ListSkeleton() {
  return (
    <SkeletonGroup label="Loading deliveries…" className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** The area requests come from: detect it, type it, or change it. */
function LocationCard({
  profile,
  token,
  onSaved,
}: {
  profile: DeliveryProfile;
  token: string;
  onSaved: (p: DeliveryProfile) => void;
}) {
  const [editing, setEditing] = useState(!profile.city);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState<'detect' | 'type' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(find: () => Promise<{ city: string; pincode?: string; lat?: number; lng?: number }>, kind: 'detect' | 'type') {
    setBusy(kind);
    setError(null);
    try {
      const loc = await find();
      // Nominatim sometimes returns "110001;110002" or a non-Indian code — keep only a clean 6-digit pincode.
      const pincode = loc.pincode && /^\d{6}$/.test(loc.pincode) ? loc.pincode : undefined;
      onSaved(await api.delivery.setLocation({ city: loc.city, pincode, lat: loc.lat, lng: loc.lng }, token));
      setEditing(false);
      setTyped('');
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not set your location.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <MapPin size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Your delivery area</p>
            {profile.city ? (
              <p className="truncate text-base font-bold text-ink">
                {profile.city}
                {profile.pincode ? <span className="font-medium text-ink-muted"> · {profile.pincode}</span> : null}
              </p>
            ) : (
              <p className="text-sm font-semibold text-accent">Not set — you won&apos;t get delivery requests yet</p>
            )}
            <p className="mt-0.5 text-xs text-ink-muted">You get orders from shops in and around this area (about 25 km).</p>
          </div>
        </div>
        {profile.city && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
          >
            Change
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => save(detectLocation, 'detect')}
            disabled={!!busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy === 'detect' ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            {busy === 'detect' ? 'Detecting…' : 'Use my current location'}
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) save(() => locateTypedCity(typed), 'type');
            }}
            className="flex gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Or type your city / area, e.g. Meerut"
              aria-label="City or area"
              className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typed.trim() || !!busy}
              className="flex h-10 shrink-0 items-center rounded-xl border border-border px-4 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {busy === 'type' ? <Loader2 size={15} className="animate-spin" /> : 'Set'}
            </button>
          </form>
          {profile.city && (
            <button type="button" onClick={() => setEditing(false)} className="text-xs font-medium text-ink-muted hover:text-ink">
              Cancel
            </button>
          )}
          {error && <p className="text-xs text-accent">{error}</p>}
        </div>
      )}
    </section>
  );
}

function DeliveryPanel() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [requests, setRequests] = useState<DeliveryOrder[] | null>(null);
  const [mine, setMine] = useState<DeliveryOrder[] | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const seenIds = useRef<Set<string> | null>(null);

  const isDelivery = user?.role === 'DELIVERY';

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?next=/delivery');
    else if (!isDelivery) router.replace('/');
  }, [loading, user, isDelivery, router]);

  useEffect(() => {
    if (!token || !isDelivery) return;
    api.delivery
      .profile(token)
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your profile.'));
  }, [token, isDelivery]);

  const loadMine = useCallback(async () => {
    if (!token) return;
    try {
      setMine(await api.delivery.mine(token));
    } catch {
      setMine((prev) => prev ?? []);
    }
  }, [token]);

  // New requests near the partner — polled, with a banner + vibration when one comes in.
  useVisibleInterval(
    (isStale) => {
      if (!token) return;
      api.delivery
        .requests(token)
        .then((list) => {
          if (isStale()) return;
          const ids = new Set(list.map((o) => o.id));
          if (seenIds.current) {
            const added = list.filter((o) => !seenIds.current!.has(o.id));
            if (added.length) {
              setFreshIds((prev) => new Set([...prev, ...added.map((o) => o.id)]));
              setAlert(added.length === 1 ? `New delivery request from ${added[0].shopName ?? 'a shop'}` : `${added.length} new delivery requests`);
              try {
                navigator.vibrate?.([200, 100, 200]);
              } catch {
                // not supported — the banner is enough
              }
            }
          }
          seenIds.current = ids;
          setRequests(list);
        })
        .catch(() => setRequests((prev) => prev ?? []));
      loadMine();
    },
    POLL_MS,
    token && isDelivery && profile?.city ? `${token} ${profile.city} ${profile.pincode ?? ''}` : null,
  );

  // No location yet: nothing to poll, but the accepted orders still load.
  useEffect(() => {
    if (token && isDelivery && profile && !profile.city) {
      setRequests([]);
      loadMine();
    }
  }, [token, isDelivery, profile, loadMine]);

  async function act(orderId: string, action: 'accept' | 'reject' | 'pickedUp' | 'delivered') {
    if (!token) return;
    setActingId(orderId);
    setError(null);
    try {
      await api.delivery[action](orderId, token);
      if (action === 'accept' || action === 'reject') setRequests((prev) => prev?.filter((o) => o.id !== orderId) ?? prev);
      await loadMine();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong — please try again.');
      // Taken by someone else / no longer available: drop it from the list.
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
        setRequests((prev) => prev?.filter((o) => o.id !== orderId) ?? prev);
      }
    } finally {
      setActingId(null);
    }
  }

  function handleLogout() {
    logout();
    startTopLoader('/');
    router.push('/');
  }

  if (loading || !user || !isDelivery) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={22} className="animate-spin text-brand" />
      </div>
    );
  }

  const active = mine?.filter((o) => o.deliveryStatus === 'ASSIGNED' || o.deliveryStatus === 'PICKED_UP') ?? [];
  const done = mine?.filter((o) => o.deliveryStatus === 'DELIVERED') ?? [];
  const deliveredToday = done.filter((o) => isToday(o.deliveredAt)).length;

  return (
    <div className="min-h-screen bg-bg font-opensans">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
            <Bike size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold leading-tight text-ink">Delivery panel</p>
            <p className="truncate text-xs text-ink-muted">DukanCloude · {user.name}</p>
          </div>
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface/70 p-1 shadow-sm">
            <NotificationsMenu />
            <ThemeToggle bare />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {alert && (
        <div className="sticky top-16 z-30 mx-auto max-w-3xl px-4 pt-3 sm:px-6">
          <div className="animate-slide-down flex items-center gap-2.5 rounded-xl border border-brand/30 bg-brand-soft px-3.5 py-2.5 text-sm font-semibold text-brand shadow-[0_12px_30px_-14px_rgb(0_0_0_/_0.35)]">
            <Bell size={16} className="shrink-0" />
            <span className="min-w-0 flex-1">{alert}</span>
            <button type="button" onClick={() => setAlert(null)} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {profile ? (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Vehicle', value: vehicleLabel(profile.vehicleType), sub: profile.vehicleNumber ?? '—' },
                { label: 'Active', value: String(active.length), sub: 'deliveries' },
                { label: 'Delivered', value: String(deliveredToday), sub: 'today' },
              ].map((s) => (
                <div key={s.label} className="min-w-0 rounded-2xl border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{s.label}</p>
                  <p className="truncate text-base font-bold text-ink">{s.value}</p>
                  <p className="truncate text-[11px] text-ink-muted">{s.sub}</p>
                </div>
              ))}
            </div>
            <LocationCard profile={profile} token={token!} onSaved={setProfile} />
          </>
        ) : error ? null : (
          <Skeleton className="h-36 w-full rounded-2xl" />
        )}

        {error && <p className="rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm text-accent">{error}</p>}

        {active.length > 0 && (
          <section>
            <SectionTitle icon={Bike} title="Active deliveries" count={active.length} />
            <div className="space-y-3">
              {active.map((order) => (
                <article key={order.id} className="rounded-2xl border border-brand/40 bg-surface p-4 shadow-[0_8px_24px_-18px_rgb(var(--brand)/0.6)]">
                  <Progress status={order.deliveryStatus} />
                  <div className="my-3 h-px bg-border" />
                  <OrderSummary order={order} />
                  {order.deliveryStatus === 'ASSIGNED' ? (
                    <button
                      type="button"
                      disabled={actingId === order.id}
                      onClick={() => act(order.id, 'pickedUp')}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {actingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={17} />}
                      I&apos;ve picked up the order from the shop
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actingId === order.id}
                      onClick={() => act(order.id, 'delivered')}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={17} />}
                      I&apos;ve delivered the order
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle icon={Bell} title="New delivery requests" count={requests?.length} />
          {profile && !profile.city ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-ink-muted">
              Set your delivery area above — orders placed at shops near it will show up here.
            </p>
          ) : requests === null ? (
            <ListSkeleton />
          ) : requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-ink-muted">
              No delivery requests near {profile?.city ?? 'you'} right now. New ones show up here automatically.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((order) => {
                const fresh = freshIds.has(order.id);
                return (
                  <article
                    key={order.id}
                    className={`rounded-2xl border bg-surface p-4 transition-colors ${fresh ? 'border-accent/50' : 'border-border'}`}
                  >
                    <OrderSummary order={order} highlight={fresh} />
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={actingId === order.id}
                        onClick={() => act(order.id, 'reject')}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent disabled:opacity-60"
                      >
                        <X size={16} /> Reject
                      </button>
                      <button
                        type="button"
                        disabled={actingId === order.id}
                        onClick={() => act(order.id, 'accept')}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {actingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Accept
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {done.length > 0 && (
          <section>
            <SectionTitle icon={History} title="Delivered" />
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {done.map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {order.shopName ?? 'Shop'} → {order.buyer.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{order.address}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-ink">₹{Number(order.totalAmount).toFixed(0)}</p>
                    <p className="text-[11px] text-ink-muted">{order.deliveredAt ? timeAgo(order.deliveredAt) : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default function DeliveryPage() {
  return <DeliveryPanel />;
}
