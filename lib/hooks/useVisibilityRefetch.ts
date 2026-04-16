'use client';

import { useEffect } from 'react';

/**
 * Re-runs fetchFn whenever the tab becomes visible again.
 * Replaces the bare `useEffect(() => { fetchData(); }, [fetchData])` pattern
 * so pages recover after alt-tab / sleep / background throttling.
 */
export function useVisibilityRefetch(fetchFn: () => Promise<void>) {
  useEffect(() => {
    fetchFn();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchFn();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchFn]);
}
