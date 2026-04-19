import { useMemo } from 'react';

// Merge a player's Steam games + custom games into a unified list
function getPlayerGameSet(player) {
  const names = new Set();
  const games = [];

  const steamGames = player.games || [];
  for (const g of steamGames) {
    if (!names.has(g.name.toLowerCase())) {
      names.add(g.name.toLowerCase());
      games.push(g);
    }
  }
  for (const g of player.customGames) {
    if (!names.has(g.name.toLowerCase())) {
      names.add(g.name.toLowerCase());
      games.push(g);
    }
  }
  return games;
}

export function useGameFilter(players, filterMode, searchQuery) {
  return useMemo(() => {
    const readyPlayers = players.filter(
      (p) => (p.games !== null || p.isCustom) && !p.gamesError
    );
    if (readyPlayers.length === 0) return [];

    // Build a map: normalized game name → { game, ownerIds[] }
    const gameMap = new Map();

    for (const player of readyPlayers) {
      const playerGames = getPlayerGameSet(player);
      for (const game of playerGames) {
        const key = game.name.toLowerCase();
        if (!gameMap.has(key)) {
          gameMap.set(key, { game, ownerIds: [] });
        }
        gameMap.get(key).ownerIds.push(player.id);
      }
    }

    const totalSteamPlayers = players.filter((p) => !p.isCustom && p.games !== null).length;
    // Use readyPlayers count for filter thresholds
    const total = readyPlayers.length;

    let filtered = [...gameMap.values()];

    switch (filterMode) {
      case 'all':
        filtered = filtered.filter((entry) => entry.ownerIds.length === total);
        break;
      case 'most':
        filtered = filtered.filter((entry) => entry.ownerIds.length > total / 2);
        break;
      case 'atleast2':
        filtered = filtered.filter((entry) => entry.ownerIds.length >= 2);
        break;
      case 'anyone':
      default:
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((entry) => entry.game.name.toLowerCase().includes(q));
    }

    // Sort by how many own it desc, then alphabetically
    filtered.sort((a, b) => {
      if (b.ownerIds.length !== a.ownerIds.length) return b.ownerIds.length - a.ownerIds.length;
      return a.game.name.localeCompare(b.game.name);
    });

    return filtered;
  }, [players, filterMode, searchQuery]);
}
