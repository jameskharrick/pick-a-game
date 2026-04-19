import React, { useState } from 'react';

// Color band: 1-4 red, 5-7 yellow, 8-10 green
function ratingColor(n, active) {
  if (!active) return 'bg-navy-600 text-gray-500 hover:bg-navy-500 hover:text-gray-300';
  if (n <= 4) return 'bg-red-600 text-white';
  if (n <= 7) return 'bg-yellow-500 text-gray-900';
  return 'bg-green-500 text-gray-900';
}

function Avatar({ player }) {
  if (player.avatarUrl) {
    return (
      <img
        src={player.avatarUrl}
        alt={player.displayName}
        className="w-7 h-7 rounded-full border border-navy-600 flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {(player.displayName || '?')[0].toUpperCase()}
    </div>
  );
}

function formatRatedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function RatingWidget({ player, currentRating, ratedAt, onRate, onRemove }) {
  const [hover, setHover] = useState(null);
  const display = hover ?? currentRating ?? 0;

  return (
    <div className="flex flex-col gap-0.5 py-1.5">
    <div className="flex items-center gap-2">
      <Avatar player={player} />
      <span className="text-xs text-gray-300 w-24 truncate flex-shrink-0">
        {player.displayName}
      </span>
      <div
        className="flex gap-0.5 flex-1"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = n <= display;
          return (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onClick={() => onRate(n)}
              title={`Rate ${n}/10`}
              className={`flex-1 h-6 rounded-sm text-xs font-bold transition-colors ${ratingColor(n, active)}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {/* Fixed-width right slot keeps the bar aligned whether rated or not */}
      <div className="w-12 flex items-center justify-end gap-1 flex-shrink-0">
        {currentRating != null && (
          <>
            <span className="text-xs font-bold text-gray-400">{currentRating}/10</span>
            <button
              onClick={onRemove}
              title="Remove rating"
              className="text-gray-600 hover:text-red-400 transition-colors leading-none"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
    {ratedAt && (
      <p className="text-xs text-gray-600 pl-9">Rated {formatRatedAt(ratedAt)}</p>
    )}
    </div>
  );
}
