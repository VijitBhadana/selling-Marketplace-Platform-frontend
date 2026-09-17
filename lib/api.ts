// Small fetch wrapper around the NestJS backend.
// Set NEXT_PUBLIC_API_URL in .env.local (see .env.local.example).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  /** Seconds to let Next cache this GET (ISR-style). Omit for always-fresh, per-user data. */
  revalidate?: number;
};

// Carries the backend's actual error message (e.g. "Email already registered")
// so callers can show the real reason instead of a generic fallback string.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      // Public, non-personalized GETs can be cached for a few seconds so repeat
      // navigations serve instantly instead of re-hitting the DB every time.
      ...(opts.revalidate !== undefined ? { next: { revalidate: opts.revalidate } } : { cache: 'no-store' }),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. It may be offline.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = Array.isArray(parsed?.message) ? parsed.message.join(', ') : parsed?.message ?? text;
    } catch {
      // body wasn't JSON — fall back to the raw text
    }
    throw new ApiError(res.status, message || `Request failed (${res.status})`);
  }

  // DELETEs that return nothing send an empty body, which res.json() would reject.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  cloudes: {
    list: () => apiFetch('/cloudes', { revalidate: 60 }),
    bySlug: (slug: string) => apiFetch(`/cloudes/${slug}`, { revalidate: 60 }),
  },
  listings: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
      ).toString();
      return apiFetch(`/listings${qs ? `?${qs}` : ''}`, { revalidate: 30 });
    },
    byId: (id: string) => apiFetch(`/listings/${id}`, { revalidate: 30 }),
    sitemap: () => apiFetch<{ id: string; updatedAt: string }[]>('/listings/sitemap', { revalidate: 3600 }),
    create: (body: unknown, token: string) => apiFetch('/listings', { method: 'POST', body, token }),
    mine: (token: string) => apiFetch('/listings/mine', { token }),
    remove: (id: string, token: string) => apiFetch(`/listings/${id}`, { method: 'DELETE', token }),
    removeAllMine: (token: string) => apiFetch('/listings/mine', { method: 'DELETE', token }),
  },
  products: {
    listForShop: (listingId: string) => apiFetch(`/listings/${listingId}/products`),
    create: (listingId: string, body: unknown, token: string) =>
      apiFetch(`/listings/${listingId}/products`, { method: 'POST', body, token }),
    update: (id: string, body: unknown, token: string) =>
      apiFetch(`/products/${id}`, { method: 'PATCH', body, token }),
    remove: (id: string, token: string) => apiFetch(`/products/${id}`, { method: 'DELETE', token }),
    removeAllForShop: (listingId: string, token: string) =>
      apiFetch(`/listings/${listingId}/products`, { method: 'DELETE', token }),
  },
  // Jobs & Freelancing Cloude. Job rows carry no images, so reads stay uncached —
  // a freshly posted job or a new application shows up immediately.
  jobs: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString();
      return apiFetch(`/jobs${qs ? `?${qs}` : ''}`);
    },
    byId: (id: string) => apiFetch(`/jobs/${id}`),
    create: (body: unknown, token: string) => apiFetch('/jobs', { method: 'POST', body, token }),
    mine: (token: string) => apiFetch('/jobs/mine', { token }),
    remove: (id: string, token: string) => apiFetch(`/jobs/${id}`, { method: 'DELETE', token }),
    removeAllMine: (token: string) => apiFetch('/jobs/mine', { method: 'DELETE', token }),
    myApplications: (token: string) => apiFetch('/jobs/applications/mine', { token }),
    apply: (jobId: string, body: unknown, token: string) =>
      apiFetch(`/jobs/${jobId}/apply`, { method: 'POST', body, token }),
    applications: (jobId: string, token: string) => apiFetch(`/jobs/${jobId}/applications`, { token }),
    resume: (applicationId: string, token: string) =>
      apiFetch<{ fileName: string; dataUrl: string }>(`/jobs/applications/${applicationId}/resume`, { token }),
    scheduleInterview: (applicationId: string, body: { interviewAt: string; interviewDetails?: string }, token: string) =>
      apiFetch(`/jobs/applications/${applicationId}/schedule-interview`, { method: 'POST', body, token }),
    reject: (applicationId: string, token: string) =>
      apiFetch(`/jobs/applications/${applicationId}/reject`, { method: 'POST', token }),
  },
  // Financing Cloude — buyers apply for an agency's loan / policy / investment scheme with
  // their KYC papers instead of buying it, and the agency approves or rejects. Uncached:
  // a new application or decision has to show up immediately.
  finance: {
    apply: (productId: string, body: unknown, token: string) =>
      apiFetch(`/finance/products/${productId}/apply`, { method: 'POST', body, token }),
    myApplications: (token: string) => apiFetch('/finance/applications/mine', { token }),
    shopApplications: (listingId: string, token: string) => apiFetch(`/finance/shops/${listingId}/applications`, { token }),
    document: (documentId: string, token: string) =>
      apiFetch<{ fileName: string; label: string; dataUrl: string }>(`/finance/documents/${documentId}`, { token }),
    decide: (
      applicationId: string,
      body: { status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'; note?: string; approvedAmount?: number; approvedRate?: number; approvedTenure?: number },
      token: string,
    ) => apiFetch(`/finance/applications/${applicationId}/decision`, { method: 'POST', body, token }),
  },
  messages: {
    start: (listingId: string, token: string) =>
      apiFetch('/messages/conversations', { method: 'POST', body: { listingId }, token }),
    /** Job chat — candidate ↔ recruiter. The recruiter passes the applicant's id. */
    startForJob: (jobId: string, token: string, candidateId?: string) =>
      apiFetch('/messages/job-conversations', { method: 'POST', body: { jobId, candidateId }, token }),
    myConversations: (token: string) => apiFetch('/messages/conversations', { token }),
    unreadCount: (token: string) => apiFetch('/messages/unread-count', { token }),
    list: (conversationId: string, token: string) =>
      apiFetch(`/messages/conversations/${conversationId}`, { token }),
    send: (conversationId: string, content: string, token: string) =>
      apiFetch(`/messages/conversations/${conversationId}`, { method: 'POST', body: { content }, token }),
  },
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
    register: (body: { name: string; email: string; password: string; phone?: string; role?: 'BUYER' | 'SELLER' }) =>
      apiFetch('/auth/register', { method: 'POST', body }),
    verifyOtp: (email: string, otp: string) =>
      apiFetch('/auth/verify-otp', { method: 'POST', body: { email, otp } }),
    resendOtp: (email: string) => apiFetch('/auth/resend-otp', { method: 'POST', body: { email } }),
  },
  cart: {
    list: (token: string) => apiFetch('/cart', { token }),
    add: (productId: string, token: string, quantity = 1, bookingDetails?: Record<string, unknown>) =>
      apiFetch(`/cart/${productId}`, { method: 'POST', body: { quantity, ...(bookingDetails ? { bookingDetails } : {}) }, token }),
    setQuantity: (productId: string, quantity: number, token: string) =>
      apiFetch(`/cart/${productId}`, { method: 'PATCH', body: { quantity }, token }),
    remove: (productId: string, token: string) => apiFetch(`/cart/${productId}`, { method: 'DELETE', token }),
  },
  orders: {
    checkout: (
      body: { channel: 'TAKEAWAY' | 'DELIVERY' | 'DINE_IN' | 'SERVICE' | 'BOOKING'; pickupEtaMinutes?: number; address?: string; paymentMethod: 'ONLINE' | 'COD' },
      token: string,
    ) => apiFetch('/orders/checkout', { method: 'POST', body, token }),
    mine: (token: string) => apiFetch('/orders/mine', { token }),
    receive: (orderId: string, token: string) => apiFetch(`/orders/${orderId}/receive`, { method: 'POST', token }),
    shopOrders: (listingId: string, token: string) => apiFetch(`/orders/shop/${listingId}`, { token }),
    markNoShow: (orderId: string, token: string) => apiFetch(`/orders/${orderId}/no-show`, { method: 'POST', token }),
  },
  users: {
    me: (token: string) => apiFetch('/users/me', { token }),
    ackWarning: (token: string) => apiFetch('/users/me/ack-warning', { method: 'POST', token }),
  },
  notifications: {
    list: (token: string) => apiFetch('/notifications', { token }),
    unreadCount: (token: string) => apiFetch('/notifications/unread-count', { token }),
  },
  settings: {
    theme: () => apiFetch<{ brandColor: string | null }>('/settings/theme'),
  },
  admin: {
    stats: (token: string) => apiFetch('/admin/stats', { token }),
    users: (params: Record<string, string | number | undefined>, token: string) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
      ).toString();
      return apiFetch(`/admin/users${qs ? `?${qs}` : ''}`, { token });
    },
    user: (id: string, token: string) => apiFetch(`/admin/users/${id}`, { token }),
    setSuspended: (id: string, suspended: boolean, token: string) =>
      apiFetch(`/admin/users/${id}/suspension`, { method: 'PATCH', body: { suspended }, token }),
    subscriptions: (params: { status?: string; q?: string }, token: string) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as [string, string][],
      ).toString();
      return apiFetch(`/admin/subscriptions${qs ? `?${qs}` : ''}`, { token });
    },
    updateTheme: (brandColor: string | null, token: string) =>
      apiFetch<{ brandColor: string | null }>('/admin/theme', { method: 'PUT', body: { brandColor }, token }),
  },
};
