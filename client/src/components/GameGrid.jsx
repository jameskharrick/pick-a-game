import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import GameDetailModal from './GameDetailModal.jsx';

export default function GameGrid({ entries, players, filterMode, ratingsMap, submitRating, removeRating, editableSteamIds }) {
  const [selectedEntry, setSelectedEntry] = useState(null);

  if (entries.length === 0) {
    const noPlayers = players.length === 0;
    const noLibraries = players.every((p) => p.games === null && !p.isCustom);

    let message = 'No games match your filter.';
    let sub = 'Try a different filter or add more players.';

    if (noPlayers) {
      message = 'No players added yet.';
      sub = 'Add Steam profiles above to find games you can all play.';
    } else if (noLibraries) {
      message = 'Libraries not loaded.';
      sub = 'Click "Load library" on a player card, or use "Refresh Libraries".';
    }

    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-5xl mb-3">🕹️</div>
        <p className="text-lg font-medium text-gray-400">{message}</p>
        <p className="text-sm mt-1">{sub}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {entries.map((entry) => (
          <GameCard
            key={entry.game.appId ?? entry.game.name}
            entry={entry}
            players={players}
            ratings={entry.game.appId ? ratingsMap?.[String(entry.game.appId)] : undefined}
            onClick={() => setSelectedEntry(entry)}
          />
        ))}
      </div>

      {selectedEntry && (
        <GameDetailModal
          entry={selectedEntry}
          players={players}
          ratingsMap={ratingsMap}
          submitRating={submitRating}
          removeRating={removeRating}
          editableSteamIds={editableSteamIds}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
}
