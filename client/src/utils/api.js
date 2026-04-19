const BASE = '/api';

async function request(path) {
  const res = await fetch(BASE + path);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function resolvePlayer(input) {
  return request(`/resolve-player?input=${encodeURIComponent(input)}`);
}

export async function fetchGames(steamId) {
  return request(`/games?steamId=${encodeURIComponent(steamId)}`);
}

// Returns { [appId]: [{ steamId, rating }] } for all games rated by these players
export async function getRatings(steamIds) {
  return request(`/ratings?steamIds=${steamIds.map(encodeURIComponent).join(',')}`);
}

export async function postRating({ steamId, appId, gameName, rating }) {
  const res = await fetch('/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steamId, appId, gameName, rating }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function deleteRating({ steamId, appId }) {
  const res = await fetch('/api/ratings', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steamId, appId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
