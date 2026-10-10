'use client';

import { useEffect, useState } from 'react';

// Merged pull request counts by lower-case username, loaded once after the
// board has painted. null until they arrive, and stays null if GitHub can't be reached.
export function useContributions() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/contributions', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { counts: null }))
      .then((body: { counts: Record<string, number> | null }) => {
        if (live) setCounts(body.counts);
      })
      .catch(() => {
        // No counts, same as when GitHub is down. The board works without them.
      });
    return () => {
      live = false;
    };
  }, []);

  return counts;
}
