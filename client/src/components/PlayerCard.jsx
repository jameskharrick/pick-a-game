import React, { useState } from 'react';
import Spinner from './Spinner.jsx';

function DefaultAvatar({ name }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
      {initial}
    </div>
  );
}

export default function PlayerCard({ player, onRemove, onAddCustomGame, onRemoveCustomGame, onLoadGames }) {
  const [gameInput, setGameInput] = useState('');
  const [showCustomGames, setShowCustomGames] = useState(false);

  const gamesLoaded = player.games !== null;
  const steamGameCount = player.games?.length ?? 0;
  const customGameCount = player.customGames?.length ?? 0;
  const totalGames = steamGameCount + customGameCount;

  function handleAddGame(e) {
    e.preventDefault();
    if (!gameInput.trim()) return;
    onAddCustomGame(player.id, gameInput.trim());
    setGameInput('');
  }

  return (
    <div className={`bg-navy-800 rounded-xl p-4 border transition-colors ${
      player.gamesError ? 'border-yellow-600/60' : 'border-navy-600'
    }`}>
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-navy-600"
            />
          ) : (
            <DefaultAvatar name={player.displayName} />
          )}
          {player.isCustom && (
            <span className="absolute -bottom-1 -right-1 bg-navy-700 border border-navy-600 rounded-full text-xs px-1">
              ✎
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-100 truncate">{player.displayName}</h3>
            <button
              onClick={() => onRemove(player.id)}
              className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
              aria-label="Remove player"
            >
              ✕
            </button>
          </div>

          {player.gamesError ? (
            <p className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
              <span>⚠</span>
              <span>{player.gamesError}</span>
            </p>
          ) : gamesLoaded ? (
            <p className="text-xs text-gray-400 mt-0.5">
              {totalGames} game{totalGames !== 1 ? 's' : ''}
              {customGameCount > 0 && (
                <span className="text-accent-light"> (+{customGameCount} custom)</span>
              )}
            </p>
          ) : player.steamId ? (
            <p className="text-xs text-gray-500 mt-0.5">Library not loaded</p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">Custom player</p>
          )}

          {player.steamId && !gamesLoaded && !player.gamesError && (
            <button
              onClick={() => onLoadGames(player)}
              className="text-xs text-accent-light hover:text-white mt-1 underline transition-colors"
            >
              Load library
            </button>
          )}
        </div>
      </div>

      {/* Custom games section */}
      <div className="mt-3 border-t border-navy-600/50 pt-3">
        <button
          onClick={() => setShowCustomGames(!showCustomGames)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
        >
          <span>{showCustomGames ? '▾' : '▸'}</span>
          Add custom / F2P games
        </button>

        {showCustomGames && (
          <div className="mt-2 space-y-2">
            <form onSubmit={handleAddGame} className="flex gap-2">
              <input
                type="text"
                value={gameInput}
                onChange={(e) => setGameInput(e.target.value)}
                placeholder="Game name…"
                className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-2 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={!gameInput.trim()}
                className="bg-navy-600 hover:bg-accent disabled:opacity-40 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Add
              </button>
            </form>
            {player.customGames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {player.customGames.map((g) => (
                  <span
                    key={g.name}
                    className="flex items-center gap-1 bg-navy-700 border border-navy-600 rounded-full text-xs px-2 py-0.5 text-gray-300"
                  >
                    {g.name}
                    <button
                      onClick={() => onRemoveCustomGame(player.id, g.name)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
