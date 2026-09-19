'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth-context';
import type { BookingDetails } from './booking-details';
import type { PropertyDetails } from './property-details';
import type { TransportDetails } from './transport-details';

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  /** Booking Cloude only — what the buyer asked for (dates, guests, pickup/drop...). */
  bookingDetails?: BookingDetails | null;
  product: {
    id: string;
    name: string;
    price: string | null;
    priceType: 'FIXED' | 'CONTACT_FOR_PRICE';
    imageUrl: string | null;
    isService: boolean;
    priceUnit?: string | null;
    /** Property Cloude only — rent or sale, minimum rent period, deposit... */
    propertyDetails?: PropertyDetails | null;
    /** Agriculture transport only — the vehicle's delivery charge and hourly rate. */
    transportDetails?: TransportDetails | null;
    listing: {
      id: string;
      shopName: string | null;
      title: string;
      sellerId: string;
      cloude?: { id: string; slug: string; name: string } | null;
      category?: { slug: string; name: string } | null;
    };
  };
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  loading: boolean;
  /** False until the cart has been fetched once for the current session — "still loading" vs "loaded and empty". */
  ready: boolean;
  suspended: boolean;
  pendingWarning: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, bookingDetails?: BookingDetails) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  ackWarning: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [pendingWarning, setPendingWarning] = useState(false);
  // The token the cart was last fetched for; `ready` compares it to the current one.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || user?.role === 'SELLER') {
      setItems([]);
      setSuspended(false);
      setPendingWarning(false);
      setLoadedFor(token);
      return;
    }
    setLoading(true);
    try {
      const [cart, me] = await Promise.all([api.cart.list(token), api.users.me(token)]);
      setItems(cart);
      setSuspended(Boolean(me.isSuspended));
      setPendingWarning(Boolean(me.pendingCodWarning));
    } catch {
      // leave previous state on transient failure
    } finally {
      setLoading(false);
      setLoadedFor(token);
    }
  }, [token, user?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // After a cart edit only the items can have changed — no need to re-ask /users/me
  // for the suspension / warning flags the way a full refresh() does.
  const reloadItems = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await api.cart.list(token));
    } catch {
      // leave previous state on transient failure
    }
  }, [token]);

  const addToCart = useCallback(
    async (productId: string, bookingDetails?: BookingDetails) => {
      if (!token) return;
      await api.cart.add(productId, token, 1, bookingDetails);
      await reloadItems();
    },
    [token, reloadItems],
  );

  // Quantity and remove update the list right away (the backend drops an item whose
  // quantity goes below 1 too), then only resync from the server if the call failed.
  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!token) return;
      setItems((prev) =>
        quantity < 1 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
      try {
        await api.cart.setQuantity(productId, quantity, token);
      } catch (err) {
        await reloadItems();
        throw err;
      }
    },
    [token, reloadItems],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!token) return;
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      try {
        await api.cart.remove(productId, token);
      } catch (err) {
        await reloadItems();
        throw err;
      }
    },
    [token, reloadItems],
  );

  const ackWarning = useCallback(async () => {
    if (!token) return;
    setPendingWarning(false);
    await api.users.ackWarning(token).catch(() => {});
  }, [token]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const ready = loadedFor === token;

  // Memoized so consumers (Navbar's bucket badge, product pages, etc.) only
  // re-render when cart state actually changes, not on every provider render.
  const value = useMemo(
    () => ({ items, count, loading, ready, suspended, pendingWarning, refresh, addToCart, setQuantity, removeFromCart, ackWarning }),
    [items, count, loading, ready, suspended, pendingWarning, refresh, addToCart, setQuantity, removeFromCart, ackWarning],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
