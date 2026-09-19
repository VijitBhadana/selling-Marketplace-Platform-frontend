'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { api } from './api';
import { FINANCE_STATUS_LABELS, type MyFinanceApplication } from './finance-details';

// The signed-in buyer's finance applications keyed by productId, so a scheme card can show
// "Applied" / "Under review" / "Approved" in place of the Apply button. `enabled: false`
// (every shop outside the Financing Cloude) skips the request entirely.
export function useMyFinanceApplications(enabled = true) {
  const { token } = useAuth();
  const [byProduct, setByProduct] = useState<Record<string, MyFinanceApplication>>({});

  useEffect(() => {
    if (!token || !enabled) {
      setByProduct((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    let cancelled = false;
    api.finance
      .myApplications(token)
      .then((items: MyFinanceApplication[]) => {
        if (!cancelled) setByProduct(Object.fromEntries(items.map((a) => [a.productId, a])));
      })
      .catch(() => {
        // not fatal — cards just fall back to showing Apply
      });
    return () => {
      cancelled = true;
    };
  }, [token, enabled]);

  const markApplied = useCallback((application: MyFinanceApplication) => {
    setByProduct((prev) => ({ ...prev, [application.productId]: application }));
  }, []);

  /** What the card's button says once they've applied — undefined while they haven't. */
  const statusLabel = useCallback(
    (productId: string) => {
      const application = byProduct[productId];
      return application ? FINANCE_STATUS_LABELS[application.status] : undefined;
    },
    [byProduct],
  );

  return { byProduct, markApplied, statusLabel };
}
