'use client';

import { useEffect, useRef } from 'react';

/**
 * Re-runs fetchFn whenever the tab becomes visible again.
 * Skips the refetch if one is already in flight so concurrent calls can't
 * race and leave stale state behind after a backgrounded tab returns.
 */
export function useVisibilityRefetch(fetchFn: () => Promise<void>) {
  const inFlight = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try { await fetchFn(); } finally { inFlight.current = false; }
    };

    run();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') run();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchFn]);
}
