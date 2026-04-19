import { useState, useEffect, useCallback, useRef } from 'react';
import { getRatings, postRating, deleteRating } from '../utils/api';

// ratingsMap shape: { [appId]: [{ steamId, rating }] }
export function useRatings(players) {
  const [ratingsMap, setRatingsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const fetchedForRef = useRef('');

  const steamIds = players.filter((p) => p.steamId).map((p) => p.steamId);
  const steamIdsKey = steamIds.slice().sort().join(',');

  useEffect(() => {
    if (steamIds.length === 0 || steamIdsKey === fetchedForRef.current) return;
    fetchedForRef.current = steamIdsKey;

    setLoading(true);
    getRatings(steamIds)
      .then(setRatingsMap)
      .catch(() => {}) // ratings are optional — silently degrade
      .finally(() => setLoading(false));
  }, [steamIdsKey]);

  const submitRating = useCallback(async (steamId, appId, gameName, rating) => {
    const key = String(appId);
    // Optimistic update so the UI responds immediately
    setRatingsMap((prev) => {
      const existing = (prev[key] || []).filter((r) => r.steamId !== steamId);
      return { ...prev, [key]: [...existing, { steamId, gameName, rating, ratedAt: new Date().toISOString() }] };
    });

    try {
      await postRating({ steamId, appId, gameName, rating });
    } catch {
      // On failure roll back to the previous value for this player
      setRatingsMap((prev) => {
        const existing = (prev[key] || []).filter((r) => r.steamId !== steamId);
        return { ...prev, [key]: existing };
      });
    }
  }, []);

  const removeRating = useCallback(async (steamId, appId) => {
    const key = String(appId);
    // Snapshot the entry before removal so we can roll back on failure
    let snapshot;
    setRatingsMap((prev) => {
      snapshot = prev[key] || [];
      return { ...prev, [key]: snapshot.filter((r) => r.steamId !== steamId) };
    });

    try {
      await deleteRating({ steamId, appId });
    } catch {
      setRatingsMap((prev) => ({ ...prev, [key]: snapshot }));
    }
  }, []);

  return { ratingsMap, submitRating, removeRating, loading };
}
