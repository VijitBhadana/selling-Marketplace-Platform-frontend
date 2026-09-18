'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarCheck, Minus, Package, Pencil, Plus, ShoppingBasket, Store, Trash2, Truck, Utensils, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart, type CartItem } from '@/lib/cart-context';
import { api } from '@/lib/api';
import {
  bookingPriceLine,
  bookingUnits,
  effectivePriceUnit,
  getBookingKind,
  getRentSubject,
  orderItemLine,
  priceUnitSuffix,
  type BookingDetails,
  type BookingKind,
} from '@/lib/booking-details';
import { getPropertyType } from '@/lib/property-details';
import { CLINIC_CLOUDE_SLUG } from '@/lib/clinic-details';
import { EDUCATION_CLOUDE_SLUG } from '@/lib/education-details';
import { transportQuote } from '@/lib/transport-details';
import { TransportBookingModal } from '@/components/transport-details';
import { withImageParams } from '@/lib/image-utils';
import { BookingDetailsModal, BookingDetailsSummary } from '@/components/booking-details';
import { CheckoutFlow } from '@/components/checkout-flow';
import { OrderRating } from '@/components/order-rating';
import { Skeleton, SkeletonGroup } from '@/components/skeleton';

type OrderItem = { id: string; productName: string; unitPrice: string; quantity: number; bookingDetails?: BookingDetails | null };

function bookingKindOf(item: CartItem) {
  return getBookingKind(item.product.listing.cloude?.slug, item.product.listing.category?.slug);
}

/** A booking's unit price and what it's per — Agriculture transport's depends on the service the buyer picked. */
function bookingPricing(item: CartItem, kind: BookingKind) {
  const plain = { unitPrice: Number(item.product.price ?? 0), priceUnit: effectivePriceUnit(kind, item.product.priceUnit) };
  return kind === 'TRANSPORT' ? transportQuote(item.product.transportDetails, item.bookingDetails?.service) ?? plain : plain;
}

/** What a line costs: price × quantity for normal items, price × rooms × nights etc. for bookings. */
function lineTotal(item: CartItem) {
  const kind = bookingKindOf(item);
  if (!kind) return Number(item.product.price ?? 0) * item.quantity;
  const { unitPrice, priceUnit } = bookingPricing(item, kind);
  return unitPrice * bookingUnits(priceUnit, item.bookingDetails ?? {});
}

function bookingPriceText(item: CartItem, kind: BookingKind) {
  const { unitPrice, priceUnit } = bookingPricing(item, kind);
  return item.bookingDetails ? bookingPriceLine(unitPrice, priceUnit, item.bookingDetails) : `₹${unitPrice} ${priceUnitSuffix(kind, priceUnit)}`;
}
type Order = {
  id: string;
  channel: 'TAKEAWAY' | 'DELIVERY' | 'DINE_IN' | 'SERVICE' | 'BOOKING';
  pickupEta: string | null;
  address: string | null;
  paymentMethod: 'ONLINE' | 'COD';
  paymentStatus: 'PENDING' | 'PAID';
  status: 'PENDING' | 'COMPLETED' | 'NO_SHOW';
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
  // Null once the seller deletes the shop; shopName is snapshotted at order time.
  listing: { id: string; shopName: string | null; title: string } | null;
  shopName: string | null;
  // The buyer's own 1–5 rating of this order's shop, null until they rate it.
  myRating: number | null;
};

const statusStyles: Record<Order['status'], string> = {
  PENDING: 'bg-brand-soft text-brand',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600',
  NO_SHOW: 'bg-accent-soft text-accent',
};

function CartItemsSkeleton() {
  return (
    <SkeletonGroup label="Loading your bucket list…" className="mt-6 flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <Skeleton className="mb-4 h-3 w-36" />
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-[88px] rounded-full" />
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5">
        <div>
          <Skeleton className="h-3 w-10" />
          <Skeleton className="mt-2 h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
    </SkeletonGroup>
  );
}

function OrdersSkeleton() {
  return (
    <SkeletonGroup label="Loading your orders…" className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-32" />
          <Skeleton className="mt-3 h-3 w-56 max-w-full" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

export default function BucketListPage() {
  const { user, loading: authLoading, requireAuth, token } = useAuth();
  const { items, ready: cartReady, addToCart, setQuantity, removeFromCart, refresh } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<CartItem | null>(null);
  // null until the first fetch settles, so the skeleton shows instead of a premature "No orders yet".
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  async function loadOrders() {
    if (!token) return;
    try {
      setOrders(await api.orders.mine(token));
    } catch {
      // leave previous list on transient failure; a failed first load shows the empty state
      setOrders((prev) => prev ?? []);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleReceive(orderId: string) {
    if (!token) return;
    setReceivingId(orderId);
    try {
      await api.orders.receive(orderId, token);
      await loadOrders();
    } finally {
      setReceivingId(null);
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <ShoppingBasket size={40} className="mx-auto text-ink-muted" />
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Your bucket list is waiting</h1>
        <p className="mt-2 text-sm text-ink-muted">Log in to see items you&apos;ve added from shops.</p>
        <button
          type="button"
          onClick={() => requireAuth(undefined, 'default')}
          className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink hover:opacity-90"
        >
          Log in
        </button>
      </div>
    );
  }

  if (user?.role === 'SELLER') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-ink-muted">The bucket list is for buyer accounts. Switch to a buyer account to use it.</p>
      </div>
    );
  }

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.product.listing.id;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const grandTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const isFoodOrder = items.length > 0 && items.every((item) => item.product.listing.cloude?.slug === 'food');
  // Skill Cloude on-site services, Clinic & Doctors Cloude doctor appointments and Education
  // Cloude course / class enrolments and counselling sessions.
  const isServiceOrder =
    items.length > 0 &&
    items.every(
      (item) => item.product.isService && ['skill', CLINIC_CLOUDE_SLUG, EDUCATION_CLOUDE_SLUG].includes(item.product.listing.cloude?.slug ?? ''),
    );
  const cartPending = authLoading || !cartReady;
  const missingBookingDetails = items.some((item) => bookingKindOf(item) && !item.bookingDetails);
  const editingKind = editingBooking ? bookingKindOf(editingBooking) : null;
  const isBookingOrder = items.length > 0 && items.every((item) => bookingKindOf(item));
  const hasBookingItems = items.some((item) => bookingKindOf(item));
  // Rent Cloude: the owner hands the thing over before any counter payment would happen,
  // so a bucket holding any rental can only be paid for online.
  const hasRentItems = items.some((item) => bookingKindOf(item) === 'RENT');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 font-opensans sm:px-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
        <ShoppingBasket size={22} className="text-brand" /> Bucket list
      </h1>

      {cartPending && <CartItemsSkeleton />}

      {!cartPending && items.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
          Nothing here yet — go buy something from a shop and it&apos;ll show up here.
        </p>
      )}

      {!cartPending && items.length > 0 && (
        <div className="mt-6 space-y-4">
          {Array.from(groups.entries()).map(([listingId, groupItems]) => (
            <div key={listingId} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Store size={13} className="text-brand" /> {groupItems[0].product.listing.shopName || groupItems[0].product.listing.title}
              </h2>
              <div className="space-y-3">
                {groupItems.map((item) => {
                  const kind = bookingKindOf(item);
                  const isBooking = Boolean(kind);
                  return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-brand-soft">
                      {item.product.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={withImageParams(item.product.imageUrl, 'w=120&q=75&auto=format&fit=crop')}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.product.name}</p>
                      <p className="text-xs text-ink-muted">
                        {item.product.priceType === 'CONTACT_FOR_PRICE'
                          ? 'Contact for price'
                          : kind
                            ? bookingPriceText(item, kind)
                            : `₹${item.product.price} each`}
                      </p>
                      {isBooking &&
                        (item.bookingDetails ? (
                          <BookingDetailsSummary details={item.bookingDetails} className="mt-2" />
                        ) : (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-accent">
                            <AlertTriangle size={12} /> Booking details missing — add them before you proceed.
                          </p>
                        ))}
                    </div>
                    {isBooking ? (
                      <button
                        type="button"
                        onClick={() => setEditingBooking(item)}
                        className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                      >
                        <Pencil size={12} /> {item.bookingDetails ? 'Edit details' : 'Add details'}
                      </button>
                    ) : (
                    <div className="flex items-center gap-1.5 rounded-full border border-border px-1 py-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:bg-surface-hover hover:text-ink"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:bg-surface-hover hover:text-ink"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    )}
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeFromCart(item.productId)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:text-accent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5">
            <div>
              <p className="text-xs text-ink-muted">Total</p>
              <p className="text-lg font-bold text-ink">₹{grandTotal.toFixed(2)}</p>
            </div>
            <button
              type="button"
              disabled={missingBookingDetails}
              title={missingBookingDetails ? 'Fill in the booking details first' : undefined}
              onClick={() => setCheckoutOpen(true)}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Package size={13} className="text-brand" /> My orders
        </h2>
        {orders === null && <OrdersSkeleton />}
        {orders?.length === 0 && <p className="text-sm text-ink-muted">No orders yet.</p>}
        <div className="space-y-3">
          {orders?.map((order) => (
            <div key={order.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Store size={14} className="text-brand" /> {order.shopName || order.listing?.shopName || order.listing?.title || 'Deleted shop'}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[order.status]}`}>
                  {order.status === 'NO_SHOW' ? 'Missed' : order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="mt-2 space-y-0.5">
                {order.items.map((it) => (
                  <div key={it.id}>
                    <p className="text-xs text-ink-muted">{orderItemLine(it)}</p>
                    <BookingDetailsSummary details={it.bookingDetails} className="mt-1.5 max-w-md" />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  {order.channel === 'TAKEAWAY' && <Store size={12} />}
                  {order.channel === 'DELIVERY' && <Truck size={12} />}
                  {order.channel === 'DINE_IN' && <Utensils size={12} />}
                  {order.channel === 'SERVICE' && <Wrench size={12} />}
                  {order.channel === 'BOOKING' && <CalendarCheck size={12} />}
                  {order.channel === 'BOOKING' &&
                    `Booking${order.pickupEta ? ` for ${new Date(order.pickupEta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
                  {order.channel === 'TAKEAWAY' &&
                    `Pickup by ${order.pickupEta ? new Date(order.pickupEta).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}`}
                  {order.channel === 'DELIVERY' && order.address}
                  {(order.channel === 'DINE_IN' || order.channel === 'SERVICE') &&
                    `Arriving by ${order.pickupEta ? new Date(order.pickupEta).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}`}
                </span>
                <span>{order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentStatus === 'PAID' ? 'Paid online' : 'Online payment'}</span>
                <span className="font-semibold text-ink">₹{order.totalAmount}</span>
              </div>
              {order.status === 'PENDING' && (
                <button
                  type="button"
                  disabled={receivingId === order.id}
                  onClick={() => handleReceive(order.id)}
                  className="mt-3 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand disabled:opacity-60"
                >
                  {order.channel === 'BOOKING' ? 'Mark as completed' : 'Mark as received'}
                </button>
              )}
              {order.status === 'COMPLETED' && order.listing && token && (
                <OrderRating orderId={order.id} initialRating={order.myRating} token={token} />
              )}
            </div>
          ))}
        </div>
      </div>

      {editingBooking && editingKind === 'TRANSPORT' && (
        <TransportBookingModal
          productName={editingBooking.product.name}
          transport={editingBooking.product.transportDetails}
          initial={editingBooking.bookingDetails}
          onClose={() => setEditingBooking(null)}
          onSubmit={async (details) => {
            await addToCart(editingBooking.productId, details);
            setEditingBooking(null);
          }}
        />
      )}

      {editingBooking && editingKind && editingKind !== 'TRANSPORT' && (
        <BookingDetailsModal
          kind={editingKind}
          productName={editingBooking.product.name}
          initial={editingBooking.bookingDetails}
          unitPrice={editingBooking.product.priceType === 'FIXED' ? Number(editingBooking.product.price) : null}
          priceUnit={effectivePriceUnit(editingKind, editingBooking.product.priceUnit)}
          property={editingBooking.product.propertyDetails}
          propertyType={getPropertyType(editingBooking.product.listing.cloude?.slug, editingBooking.product.listing.category?.slug)}
          rentSubject={getRentSubject(editingBooking.product.listing.cloude?.slug, editingBooking.product.listing.category?.slug)}
          onClose={() => setEditingBooking(null)}
          onSubmit={async (details) => {
            await addToCart(editingBooking.productId, details);
            setEditingBooking(null);
          }}
        />
      )}

      {checkoutOpen && token && (
        <CheckoutFlow
          token={token}
          isFoodOrder={isFoodOrder}
          isServiceOrder={isServiceOrder}
          isBookingOrder={isBookingOrder}
          hasBookingItems={hasBookingItems}
          hasRentItems={hasRentItems}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={async () => {
            setCheckoutOpen(false);
            await Promise.all([refresh(), loadOrders()]);
          }}
        />
      )}
    </div>
  );
}
