import { useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { resolvePlayer, fetchGames } from '../utils/api';

function loadInitialPlayers() {
  return storage.get('players', []);
}

export function usePlayers(addToast) {
  const [players, setPlayers] = useState(loadInitialPlayers);
  const [resolving, setResolving] = useState(false);

  function savePlayers(updated) {
    setPlayers(updated);
    storage.set('players', updated);
  }

  const addSteamPlayer = useCallback(async (input) => {
    setResolving(true);
    try {
      const profile = await resolvePlayer(input);
      const existing = players.find((p) => p.steamId === profile.steamId);
      if (existing) {
        addToast(`${profile.displayName} is already in the list.`, 'warning');
        return;
      }
      const newPlayer = {
        id: profile.steamId,
        steamId: profile.steamId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        isCustom: false,
        games: null,
        gamesError: null,
        customGames: [],
      };
      savePlayers([...players, newPlayer]);
    } catch (err) {
      addToast(err.message || 'Could not resolve Steam profile.', 'error');
    } finally {
      setResolving(false);
    }
  }, [players, addToast]);

  const addCustomPlayer = useCallback((name) => {
    if (!name.trim()) return;
    const id = `custom_${Date.now()}`;
    const newPlayer = {
      id,
      steamId: null,
      displayName: name.trim(),
      avatarUrl: null,
      isCustom: true,
      games: [],
      gamesError: null,
      customGames: [],
    };
    savePlayers([...players, newPlayer]);
  }, [players]);

  const removePlayer = useCallback((id) => {
    savePlayers(players.filter((p) => p.id !== id));
  }, [players]);

  const addCustomGame = useCallback((playerId, gameName) => {
    if (!gameName.trim()) return;
    const updated = players.map((p) => {
      if (p.id !== playerId) return p;
      const existing = p.customGames.find(
        (g) => g.name.toLowerCase() === gameName.trim().toLowerCase()
      );
      if (existing) return p;
      return {
        ...p,
        customGames: [...p.customGames, { name: gameName.trim(), appId: null, isCustom: true }],
      };
    });
    savePlayers(updated);
  }, [players]);

  const removeCustomGame = useCallback((playerId, gameName) => {
    const updated = players.map((p) => {
      if (p.id !== playerId) return p;
      return { ...p, customGames: p.customGames.filter((g) => g.name !== gameName) };
    });
    savePlayers(updated);
  }, [players]);

  const loadGames = useCallback(async (player) => {
    if (!player.steamId) return;
    const updating = (patch) =>
      setPlayers((prev) => {
        const updated = prev.map((p) => (p.id === player.id ? { ...p, ...patch } : p));
        storage.set('players', updated);
        return updated;
      });

    updating({ gamesError: null, games: null });
    try {
      const games = await fetchGames(player.steamId);
      updating({ games });
    } catch (err) {
      updating({ games: [], gamesError: err.message });
    }
  }, []);

  const refreshAllLibraries = useCallback(async () => {
    const steamPlayers = players.filter((p) => p.steamId);
    await Promise.all(steamPlayers.map(loadGames));
  }, [players, loadGames]);

  return {
    players,
    resolving,
    addSteamPlayer,
    addCustomPlayer,
    removePlayer,
    addCustomGame,
    removeCustomGame,
    loadGames,
    refreshAllLibraries,
  };
}
