'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, Info, MapPin, NotebookPen, Store, Truck, Utensils, Wallet, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

type Channel = 'TAKEAWAY' | 'DELIVERY' | 'DINE_IN' | 'SERVICE' | 'BOOKING';
type PaymentMethod = 'ONLINE' | 'COD';
type Step = 'channel' | 'details' | 'note' | 'payment' | 'done';

const NOTE_MAX = 300;

const cardBase =
  'flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-semibold transition-colors';
const cardActive = 'border-brand bg-brand-soft text-brand';
const cardInactive = 'border-border text-ink-muted hover:border-brand hover:bg-brand-soft/60 hover:text-brand';

const COD_WARNING_TEXT =
  "With Cash on Delivery: if you don't collect a takeaway order in time, or aren't available to accept a delivery, you'll get a warning — a repeat offense suspends your account.";
const BOOKING_COD_WARNING_TEXT =
  "Paying later: if you don't show up on your booking date, you'll get a warning — a repeat offense suspends your account.";
const FOOD_ONLINE_ONLY_TEXT = 'Only online payment is accepted for food orders.';
const SERVICE_ONLINE_ONLY_TEXT = 'Only online payment is accepted for service bookings.';
const RENT_ONLINE_ONLY_TEXT =
  'Only online payment is accepted for rentals — the owner hands the item over once the rent is paid.';
const DELIVERY_ONLINE_ONLY_TEXT =
  'Delivery orders are paid online in advance — a delivery partner picks your order up from the shop.';

export function CheckoutFlow({
  token,
  isFoodOrder = false,
  hasFoodItems = isFoodOrder,
  isServiceOrder = false,
  isBookingOrder = false,
  hasBookingItems = false,
  hasRentItems = false,
  onClose,
  onSuccess,
}: {
  token: string;
  isFoodOrder?: boolean;
  /** Some items are from Food Cloude shops — the buyer gets a step to leave the kitchen a note. */
  hasFoodItems?: boolean;
  isServiceOrder?: boolean;
  /** Every item is a Booking Cloude booking — dates/addresses are already in the booking details. */
  isBookingOrder?: boolean;
  /** Some (not necessarily all) items are bookings — the channel choice only applies to the rest. */
  hasBookingItems?: boolean;
  /** Some items are Rent Cloude rentals — cash at the counter is shown but can't be used. */
  hasRentItems?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Booking-only carts (hotel, cab, tour...) skip takeaway/delivery and go straight to payment.
  const [step, setStep] = useState<Step>(isBookingOrder ? 'payment' : isServiceOrder ? 'details' : 'channel');
  const [channel, setChannel] = useState<Channel | null>(isBookingOrder ? 'BOOKING' : isServiceOrder ? 'SERVICE' : null);
  const [pickupMinutes, setPickupMinutes] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidOnline, setPaidOnline] = useState(false);
  const [toast, setToast] = useState<{ text: string; visible: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const needsPickupMinutes = channel === 'TAKEAWAY' || channel === 'DINE_IN' || channel === 'SERVICE';
  const canContinueDetails = needsPickupMinutes ? Number(pickupMinutes) > 0 : address.trim().length > 3;
  const isDelivery = channel === 'DELIVERY';
  const codBlocked = isFoodOrder || isServiceOrder || hasRentItems || isDelivery;

  function flashToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, visible: true });
    toastTimer.current = setTimeout(() => setToast((cur) => (cur ? { ...cur, visible: false } : cur)), 2800);
  }

  useEffect(() => {
    if (step === 'payment' && !codBlocked) flashToast(isBookingOrder ? BOOKING_COD_WARNING_TEXT : COD_WARNING_TEXT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  async function submit(method: PaymentMethod) {
    if (!channel) return;
    setPaymentMethod(method);
    setSubmitting(true);
    setError(null);
    try {
      await api.orders.checkout(
        {
          channel,
          pickupEtaMinutes: needsPickupMinutes ? Number(pickupMinutes) : undefined,
          address: channel === 'DELIVERY' ? address.trim() : undefined,
          note: hasFoodItems && note.trim() ? note.trim() : undefined,
          paymentMethod: method,
        },
        token,
      );
      setPaidOnline(method === 'ONLINE');
      setStep('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodClick() {
    if (isDelivery) {
      flashToast(DELIVERY_ONLINE_ONLY_TEXT);
      return;
    }
    if (isFoodOrder) {
      flashToast(FOOD_ONLINE_ONLY_TEXT);
      return;
    }
    if (isServiceOrder) {
      flashToast(SERVICE_ONLINE_ONLY_TEXT);
      return;
    }
    if (hasRentItems) {
      flashToast(RENT_ONLINE_ONLY_TEXT);
      return;
    }
    submit('COD');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={step === 'done' ? undefined : onClose}>
      {toast && (
        <div
          className={`pointer-events-none fixed left-1/2 top-6 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 transition-all duration-500 ${
            toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
          }`}
        >
          <div className="flex items-start gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-[12px] leading-snug text-accent shadow-[0_12px_30px_-10px_rgb(0_0_0_/_0.35)]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {toast.text}
          </div>
        </div>
      )}
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">
            {step === 'channel' && 'How will you get your order?'}
            {step === 'details' && channel === 'TAKEAWAY' && 'When will you pick it up?'}
            {step === 'details' && (channel === 'DINE_IN' || channel === 'SERVICE') && 'When will you arrive?'}
            {step === 'details' && channel === 'DELIVERY' && 'Delivery address'}
            {step === 'note' && 'Any instructions for the kitchen?'}
            {step === 'payment' && 'Choose payment method'}
            {step === 'done' && (isBookingOrder ? 'Booking placed' : 'Order placed')}
          </h3>
          {step !== 'done' && (
            <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink">
              <X size={18} />
            </button>
          )}
        </div>

        {step === 'payment' && hasRentItems && (
          <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-snug text-brand">
            <Info size={13} className="mt-0.5 shrink-0" />
            Rentals are paid online up front — the owner releases the item once the rent is paid.
          </p>
        )}

        {step === 'payment' && isDelivery && (
          <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-snug text-brand">
            <Info size={13} className="mt-0.5 shrink-0" />
            Delivery orders are paid online in advance — a delivery partner near the shop picks it up and brings it to you.
          </p>
        )}

        {step === 'channel' && hasBookingItems && (
          <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-snug text-brand">
            <Info size={13} className="mt-0.5 shrink-0" />
            Your bookings (hotel, cab, tour, property…) already have their details — this choice is only for your other items.
          </p>
        )}

        {step === 'channel' && (
          <div className="flex gap-3">
            <button type="button" className={`${cardBase} ${channel === 'TAKEAWAY' ? cardActive : cardInactive}`} onClick={() => setChannel('TAKEAWAY')}>
              <Store size={22} /> Takeaway
            </button>
            <button type="button" className={`${cardBase} ${channel === 'DELIVERY' ? cardActive : cardInactive}`} onClick={() => setChannel('DELIVERY')}>
              <Truck size={22} /> Delivery
            </button>
            {isFoodOrder && (
              <button type="button" className={`${cardBase} ${channel === 'DINE_IN' ? cardActive : cardInactive}`} onClick={() => setChannel('DINE_IN')}>
                <Utensils size={22} /> Dine-in
              </button>
            )}
          </div>
        )}

        {step === 'details' && needsPickupMinutes && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Minutes until you arrive *</label>
            <input
              value={pickupMinutes}
              onChange={(e) => setPickupMinutes(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 30"
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <p className="mt-2 text-xs text-ink-muted">
              {channel === 'DINE_IN' && 'Please arrive within this time so your table is ready.'}
              {channel === 'SERVICE' && 'Please arrive within this time so the provider is ready for you.'}
              {channel === 'TAKEAWAY' && 'Please arrive within this time — the shop will hold your order for you.'}
            </p>
          </div>
        )}

        {step === 'details' && channel === 'DELIVERY' && (
          <div>
            <label className="mb-1.5 block flex items-center gap-1.5 text-sm font-medium text-ink">
              <MapPin size={14} /> Delivery address *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="House no., street, area, city, pincode"
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
        )}

        {step === 'note' && (
          <div>
            <label htmlFor="order-note" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <NotebookPen size={14} /> Note for the shop <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <textarea
              id="order-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              rows={4}
              placeholder="e.g. Less spicy, no onion or garlic, extra chutney, pack the gravy separately…"
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <p className="mt-1 flex justify-between gap-3 text-xs text-ink-muted">
              <span>The shop sees this with your order.</span>
              <span>
                {note.length}/{NOTE_MAX}
              </span>
            </p>
          </div>
        )}

        {step === 'payment' && (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              className={`${cardBase} ${cardInactive} disabled:opacity-60`}
              onClick={() => submit('ONLINE')}
            >
              <Wallet size={22} /> Pay Online
            </button>
            <button
              type="button"
              disabled={submitting}
              aria-disabled={hasRentItems || isDelivery}
              className={`${cardBase} ${cardInactive} disabled:opacity-60 ${hasRentItems || isDelivery ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={handleCodClick}
            >
              <Banknote size={22} /> {hasRentItems || isServiceOrder ? 'Cash at counter' : isBookingOrder ? 'Pay later (cash)' : 'Cash on Delivery'}
              {hasRentItems && <span className="text-[10px] font-medium text-ink-muted">Not available for rentals</span>}
              {isDelivery && !hasRentItems && <span className="text-[10px] font-medium text-ink-muted">Not available for delivery</span>}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <CheckCircle2 size={24} />
            </span>
            <p className="text-sm font-semibold text-ink">
              {paidOnline
                ? isDelivery
                  ? "Payment successful — we're finding a delivery partner near the shop. You'll be notified once it's picked up."
                  : `Payment successful — your ${isBookingOrder ? 'booking' : 'order'} is confirmed!`
                : isBookingOrder
                  ? 'Booking placed — pay the seller in cash.'
                  : 'Order placed — pay cash when you receive it.'}
            </p>
            <button
              type="button"
              onClick={onSuccess}
              className="mt-1 w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-accent">{error}</p>}

        {step !== 'done' && (
          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() =>
                setStep(step === 'payment' ? (hasFoodItems ? 'note' : 'details') : step === 'note' ? 'details' : 'channel')
              }
              className={`text-sm font-medium text-ink-muted hover:text-ink ${
                step === 'channel' || (step === 'details' && isServiceOrder) || (step === 'payment' && isBookingOrder) ? 'invisible' : ''
              }`}
            >
              Back
            </button>
            {step !== 'payment' && (
              <button
                type="button"
                disabled={step === 'channel' ? !channel : step === 'details' ? !canContinueDetails : false}
                onClick={() =>
                  setStep(step === 'channel' ? 'details' : step === 'details' && hasFoodItems ? 'note' : 'payment')
                }
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-ink transition-opacity disabled:opacity-50"
              >
                {step === 'note' && !note.trim() ? 'Skip' : 'Continue'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
