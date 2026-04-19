import { useState, useEffect, useCallback } from 'react';

// user: undefined = loading, null = not signed in, object = signed in
export function useAuth() {
  const [user, setUser] = useState(undefined);
  const [friendIds, setFriendIds] = useState(new Set());

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data);
        if (data) fetchFriends();
      })
      .catch(() => setUser(null));
  }, []);

  function fetchFriends() {
    fetch('/api/friends', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { friendIds: [] }))
      .then(({ friendIds: ids }) => setFriendIds(new Set(ids)))
      .catch(() => {});
  }

  const login = useCallback(() => {
    window.location.href = '/auth/steam';
  }, []);

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setFriendIds(new Set());
  }, []);

  // The set of Steam IDs the signed-in user is allowed to submit/delete ratings for
  const editableSteamIds = user
    ? new Set([user.steamId, ...friendIds])
    : new Set();

  return { user, login, logout, editableSteamIds };
}
