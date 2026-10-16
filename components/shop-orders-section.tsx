'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, Bike, CalendarCheck, ClipboardList, MapPin, Store, Truck, Utensils, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { orderItemLine, type BookingDetails } from '@/lib/booking-details';
import type { OrderDelivery } from '@/lib/delivery';
import { useVisibleInterval } from '@/lib/use-visible-interval';
import { BookingDetailsSummary } from '@/components/booking-details';
import { DeliveryPartnerCard } from '@/components/delivery-partner-card';

type Order = {
  id: string;
  channel: 'TAKEAWAY' | 'DELIVERY' | 'DINE_IN' | 'SERVICE' | 'BOOKING';
  pickupEta: string | null;
  address: string | null;
  paymentMethod: 'ONLINE' | 'COD';
  status: 'PENDING' | 'COMPLETED' | 'NO_SHOW';
  totalAmount: string;
  createdAt: string;
  items: { id: string; productName: string; quantity: number; unitPrice: string; bookingDetails?: BookingDetails | null }[];
} & OrderDelivery;

const isBookingOrder = (order: Order) => order.items.some((it) => it.bookingDetails);

// The shop's latest delivery orders — enough to see who took what today and recently.
const DELIVERY_ORDERS_SHOWN = 20;
const DELIVERY_POLL_MS = 15000;

export function ShopOrdersSection({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isOwner = user?.id === sellerId;

  // `quiet` refreshes (polling) don't flip the loading state, so nothing flickers.
  async function load(quiet = false) {
    if (!token || !isOwner) return;
    if (!quiet) setLoading(true);
    try {
      const all: Order[] = await api.orders.shopOrders(listingId, token);
      // Pending COD orders (for no-show reporting) plus every pending booking, so
      // Booking Cloude sellers can see what the buyer asked for.
      setOrders(all.filter((o) => o.status === 'PENDING' && (o.paymentMethod === 'COD' || isBookingOrder(o))));
      // Delivery orders: which delivery partner is coming for / took each one.
      setDeliveryOrders(all.filter((o) => o.deliveryStatus).slice(0, DELIVERY_ORDERS_SHOWN));
    } catch {
      // Keep whatever is already shown (nothing, on first load) if the fetch fails.
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, listingId, isOwner]);

  // A delivery notification links to #delivery-orders, which only exists once the orders
  // have loaded — so the browser's own jump to the hash misses it.
  const hasDeliveryOrders = deliveryOrders.length > 0;
  useEffect(() => {
    if (hasDeliveryOrders && window.location.hash === '#delivery-orders') {
      document.getElementById('delivery-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasDeliveryOrders]);

  // While a delivery is open, poll so "partner on the way" / "picked up" show up live.
  const deliveryOpen = deliveryOrders.some((o) => o.deliveryStatus !== 'DELIVERED' && o.status === 'PENDING');
  useVisibleInterval(() => load(true), DELIVERY_POLL_MS, deliveryOpen && token ? `${token} ${listingId}` : null);

  async function handleNoShow(orderId: string) {
    if (!token) return;
    setActingId(orderId);
    setError(null);
    try {
      await api.orders.markNoShow(orderId, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not report this order.');
    } finally {
      setActingId(null);
    }
  }

  if (!isOwner || (!loading && orders.length === 0 && deliveryOrders.length === 0)) return null;

  return (
    <>
    {(loading || orders.length > 0) && (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <ClipboardList size={15} className="text-brand" />{' '}
        {orders.some(isBookingOrder) ? 'Pending bookings & orders' : 'Pending Cash-on-Delivery orders'}
      </h2>

      <div className="space-y-3">
        {orders.map((order) => {
          const eligible = order.channel === 'DELIVERY' || (order.pickupEta && new Date(order.pickupEta) < new Date());
          return (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3.5">
              <div className="min-w-0 flex-1 break-words">
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  {order.channel === 'TAKEAWAY' && <Store size={13} />}
                  {order.channel === 'DELIVERY' && <Truck size={13} />}
                  {order.channel === 'DINE_IN' && <Utensils size={13} />}
                  {order.channel === 'SERVICE' && <Wrench size={13} />}
                  {order.channel === 'BOOKING' && <CalendarCheck size={13} />}
                  {order.items.map(orderItemLine).join(', ')}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {order.channel === 'DELIVERY'
                    ? order.address
                    : order.channel === 'BOOKING'
                      ? // Only property purchase enquiries have no booking date.
                        order.pickupEta
                        ? `Booking date: ${new Date(order.pickupEta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Purchase enquiry'
                      : `Promised ${order.channel === 'DINE_IN' || order.channel === 'SERVICE' ? 'arrival' : 'pickup'}: ${order.pickupEta ? new Date(order.pickupEta).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}`}
                  {' · '}₹{order.totalAmount}
                  {' · '}
                  {order.paymentMethod === 'COD' ? 'Cash' : 'Paid online'}
                </p>
                {order.items.map((it) => (
                  <BookingDetailsSummary key={it.id} details={it.bookingDetails} className="mt-2 max-w-md" />
                ))}
              </div>
              {order.paymentMethod === 'COD' && (
              <button
                type="button"
                disabled={!eligible || actingId === order.id}
                title={
                  !eligible
                    ? order.channel === 'BOOKING'
                      ? 'The booking date has not passed yet'
                      : 'The promised pickup time has not passed yet'
                    : undefined
                }
                onClick={() => handleNoShow(order.id)}
                className="flex items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <AlertOctagon size={13} /> Buyer no-show
              </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-accent">{error}</p>}
    </div>
    )}

    {deliveryOrders.length > 0 && (
      <section id="delivery-orders" className="mt-6 scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Bike size={15} className="text-brand" /> Delivery orders
        </h2>
        <div className="space-y-3">
          {deliveryOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 break-words text-sm font-medium text-ink">
                  <Truck size={13} className="mr-1.5 inline -translate-y-px" />
                  {order.items.map(orderItemLine).join(', ')}
                </p>
                <span className="shrink-0 text-xs font-semibold text-ink">
                  ₹{order.totalAmount} · {order.paymentMethod === 'COD' ? 'Cash' : 'Paid online'}
                </span>
              </div>
              <p className="mt-1 flex items-start gap-1 break-words text-xs text-ink-muted">
                <MapPin size={12} className="mt-0.5 shrink-0" /> {order.address}
                {' · '}
                {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              <DeliveryPartnerCard order={order} viewer="seller" />
            </div>
          ))}
        </div>
      </section>
    )}
    </>
  );
}
