import React from 'react';
import PlayerCard from './PlayerCard.jsx';
import Spinner from './Spinner.jsx';

export default function PlayerList({
  players,
  onRemove,
  onAddCustomGame,
  onRemoveCustomGame,
  onLoadGames,
  onRefreshAll,
}) {
  const hasLibraries = players.some((p) => !p.isCustom);
  const allLoaded = players.filter((p) => !p.isCustom).every((p) => p.games !== null || p.gamesError);

  if (players.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-5xl mb-3">🎮</div>
        <p className="text-lg font-medium">No players yet</p>
        <p className="text-sm mt-1">Add a Steam profile above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {players.length} Player{players.length !== 1 ? 's' : ''}
        </h2>
        {hasLibraries && (
          <button
            onClick={onRefreshAll}
            className="text-xs text-accent-light hover:text-white transition-colors flex items-center gap-1 border border-accent/30 rounded-lg px-2 py-1 hover:border-accent"
          >
            ↺ Refresh Libraries
          </button>
        )}
      </div>

      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          onRemove={onRemove}
          onAddCustomGame={onAddCustomGame}
          onRemoveCustomGame={onRemoveCustomGame}
          onLoadGames={onLoadGames}
        />
      ))}
    </div>
  );
}
