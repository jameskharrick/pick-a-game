import { useState, useEffect, useRef, useCallback } from 'react';
import { storage } from '../utils/storage';

const CACHE_KEY = 'categories';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE = 20; // appIds per /api/categories request

function loadCache() {
  return storage.get(CACHE_KEY, {});
}

function saveCache(cache) {
  storage.set(CACHE_KEY, cache);
}

function isCacheEntryFresh(entry) {
  return entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export function useCategoryFilter(entries, enabled) {
  const [cache, setCache] = useState(loadCache);
  const [fetching, setFetching] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);

  const fetchMissing = useCallback(async (steamEntries, currentCache) => {
    const missing = steamEntries
      .map((e) => e.game.appId)
      .filter((id) => id != null && !isCacheEntryFresh(currentCache[id]));

    if (missing.length === 0) return currentCache;

    abortRef.current = false;
    setFetching(true);
    setProgress({ done: 0, total: missing.length });

    let updatedCache = { ...currentCache };
    let done = 0;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      if (abortRef.current) break;
      const batch = missing.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch(`/api/categories?appIds=${batch.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          const now = Date.now();
          for (const [appId, info] of Object.entries(data)) {
            updatedCache[Number(appId)] = { ...info, fetchedAt: now };
          }
        }
      } catch {
        // Network error on a batch — skip and continue
      }

      done += batch.length;
      setProgress({ done: Math.min(done, missing.length), total: missing.length });
    }

    setCache(updatedCache);
    saveCache(updatedCache);
    setFetching(false);
    return updatedCache;
  }, []);

  // Kick off fetching whenever the filter is enabled or entries change
  useEffect(() => {
    if (!enabled) return;
    const steamEntries = entries.filter((e) => e.game.appId != null);
    fetchMissing(steamEntries, cache);

    return () => {
      abortRef.current = true;
    };
  }, [enabled, entries]);

  // Apply the filter using whatever cache data we have (partial is fine — show known results)
  const filtered = enabled
    ? entries.filter((e) => {
        if (e.game.appId == null) return true; // custom game — pass through
        const entry = cache[e.game.appId];
        if (!entry) return true; // not yet fetched — optimistically include
        return entry.multiplayer !== false; // exclude only confirmed non-multiplayer
      })
    : entries;

  return { filtered, fetching, progress };
}
