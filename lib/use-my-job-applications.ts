'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { api } from './api';
import type { MyApplication } from './jobs';

// The signed-in user's job applications keyed by jobId, so job cards can show
// "Applied" / "Interview scheduled" in place of the Apply button.
export function useMyJobApplications() {
  const { token } = useAuth();
  const [byJob, setByJob] = useState<Record<string, MyApplication>>({});

  useEffect(() => {
    if (!token) {
      setByJob({});
      return;
    }
    let cancelled = false;
    api.jobs
      .myApplications(token)
      .then((items: MyApplication[]) => {
        if (!cancelled) setByJob(Object.fromEntries(items.map((a) => [a.jobId, a])));
      })
      .catch(() => {
        // not fatal — cards just fall back to showing Apply
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const markApplied = useCallback((application: MyApplication) => {
    setByJob((prev) => ({ ...prev, [application.jobId]: application }));
  }, []);

  return { byJob, markApplied };
}
