'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, CalendarCheck, ClipboardList, Store, Truck, Utensils, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { orderItemLine, type BookingDetails } from '@/lib/booking-details';
import { BookingDetailsSummary } from '@/components/booking-details';

type Order = {
  id: string;
  channel: 'TAKEAWAY' | 'DELIVERY' | 'DINE_IN' | 'SERVICE' | 'BOOKING';
  pickupEta: string | null;
  address: string | null;
  paymentMethod: 'ONLINE' | 'COD';
  status: 'PENDING' | 'COMPLETED' | 'NO_SHOW';
  totalAmount: string;
  items: { id: string; productName: string; quantity: number; unitPrice: string; bookingDetails?: BookingDetails | null }[];
};

const isBookingOrder = (order: Order) => order.items.some((it) => it.bookingDetails);

export function ShopOrdersSection({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isOwner = user?.id === sellerId;

  async function load() {
    if (!token || !isOwner) return;
    setLoading(true);
    try {
      const all: Order[] = await api.orders.shopOrders(listingId, token);
      // Pending COD orders (for no-show reporting) plus every pending booking, so
      // Booking Cloude sellers can see what the buyer asked for.
      setOrders(all.filter((o) => o.status === 'PENDING' && (o.paymentMethod === 'COD' || isBookingOrder(o))));
    } catch {
      // Keep whatever is already shown (nothing, on first load) if the fetch fails.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, listingId, isOwner]);

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

  if (!isOwner || (!loading && orders.length === 0)) return null;

  return (
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
  );
}
