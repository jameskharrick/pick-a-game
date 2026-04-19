import React from 'react';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ratingColor(r) {
  if (r >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
  if (r >= 5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
  return 'bg-red-500/20 text-red-400 border-red-500/40';
}

function PlayerChip({ steamId, players }) {
  const player = players.find((p) => p.steamId === steamId);
  if (!player) return <span className="text-gray-500 text-xs">{steamId}</span>;
  return (
    <span className="flex items-center gap-1">
      {player.avatarUrl ? (
        <img src={player.avatarUrl} alt={player.displayName} className="w-4 h-4 rounded-full flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
          {(player.displayName || '?')[0].toUpperCase()}
        </span>
      )}
      <span className="text-gray-300 text-xs truncate">{player.displayName}</span>
    </span>
  );
}

// Flatten ratingsMap → sorted feed entries
function buildFeed(ratingsMap) {
  const entries = [];
  for (const [appId, ratings] of Object.entries(ratingsMap)) {
    for (const r of ratings) {
      if (r.ratedAt) entries.push({ appId: Number(appId), ...r });
    }
  }
  return entries.sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt));
}

export default function RatingFeed({ ratingsMap, players, onClose }) {
  const feed = buildFeed(ratingsMap);

  return (
    <aside className="flex flex-col bg-navy-800 border border-navy-600 rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-accent-light text-sm">📋</span>
          <h2 className="text-sm font-semibold text-gray-200">Rating Feed</h2>
          {feed.length > 0 && (
            <span className="text-xs bg-accent/20 text-accent-light border border-accent/30 rounded-full px-1.5 py-0.5 font-medium">
              {feed.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
          aria-label="Close feed"
        >
          ✕
        </button>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto">
        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 text-gray-500">
            <span className="text-4xl mb-3">⭐</span>
            <p className="text-sm font-medium text-gray-400">No ratings yet</p>
            <p className="text-xs mt-1">Pick a game and rate it to see activity here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-navy-700">
            {feed.map((entry, i) => {
              const coverUrl = entry.appId
                ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${entry.appId}/header.jpg`
                : null;
              return (
                <li key={`${entry.appId}-${entry.steamId}-${entry.ratedAt}`} className="flex items-center gap-3 px-4 py-3 hover:bg-navy-700/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-16 h-8 rounded overflow-hidden bg-navy-700 flex-shrink-0">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={entry.gameName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base">🎮</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-100 truncate leading-tight">
                      {entry.gameName || `App ${entry.appId}`}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <PlayerChip steamId={entry.steamId} players={players} />
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-500 text-xs">{timeAgo(entry.ratedAt)}</span>
                    </div>
                  </div>

                  {/* Rating badge */}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${ratingColor(entry.rating)}`}>
                    ★ {entry.rating}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
