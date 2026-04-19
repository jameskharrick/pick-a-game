import React, { useState } from 'react';

function OwnerAvatars({ ownerIds, players }) {
  const owners = ownerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  return (
    <div className="flex items-center -space-x-2">
      {owners.map((p) => (
        <div
          key={p.id}
          title={p.displayName}
          className="w-6 h-6 rounded-full border-2 border-navy-800 overflow-hidden flex-shrink-0"
        >
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center text-white text-xs font-bold">
              {(p.displayName || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RatingBadge({ ratings }) {
  if (!ratings || ratings.length === 0) return null;
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  const colorClass =
    avg >= 8 ? 'bg-green-500/20 text-green-400 border-green-500/40'
    : avg >= 5 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
    : 'bg-red-500/20 text-red-400 border-red-500/40';

  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
      ★ {avg.toFixed(1)}
    </span>
  );
}

export default function GameCard({ entry, players, ratings, onClick }) {
  const { game, ownerIds } = entry;
  const [imgError, setImgError] = useState(false);

  const coverUrl = game.appId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden hover:border-accent/50 transition-colors group cursor-pointer"
    >
      {coverUrl && !imgError ? (
        <div className="aspect-[460/215] overflow-hidden bg-navy-700 relative">
          <img
            src={coverUrl}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
          {/* Rate hint shown on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-accent/80 px-2.5 py-1 rounded-full">
              ★ Rate
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-[460/215] bg-navy-700 flex items-center justify-center relative group-hover:bg-navy-600 transition-colors">
          <span className="text-4xl">🎮</span>
          <span className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-accent/80 px-2 py-0.5 rounded-full">
            ★ Rate
          </span>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-100 leading-tight line-clamp-2 mb-2">
          {game.name}
        </p>
        <div className="flex items-center justify-between gap-2">
          <OwnerAvatars ownerIds={ownerIds} players={players} />
          <div className="flex items-center gap-2">
            <RatingBadge ratings={ratings} />
            <span className="text-xs text-gray-500">
              {ownerIds.length}/{players.filter((p) => !p.gamesError).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
