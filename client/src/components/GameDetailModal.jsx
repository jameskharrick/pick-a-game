import React from 'react';
import RatingWidget from './RatingWidget.jsx';

function GroupAverage({ ratings }) {
  if (!ratings || ratings.length === 0) return null;
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  const colorClass =
    avg >= 8 ? 'text-green-400' : avg >= 5 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className={`text-3xl font-extrabold ${colorClass}`}>
      {avg.toFixed(1)}
      <span className="text-sm font-normal text-gray-500 ml-1">
        / 10 · {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default function GameDetailModal({ entry, players, ratingsMap, submitRating, removeRating, onClose }) {
  const { game } = entry;
  const coverUrl = game.appId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`
    : null;

  const ratings = game.appId ? (ratingsMap?.[String(game.appId)] || []) : [];
  const rateablePlayers = players.filter((p) => p.steamId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-navy-800 border border-navy-600 rounded-2xl max-w-md w-full shadow-2xl my-auto animate-slide-up">
        {/* Cover */}
        <div className="relative overflow-hidden rounded-t-2xl bg-navy-700" style={{ height: 180 }}>
          {coverUrl ? (
            <img src={coverUrl} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🎮</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white text-sm flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-extrabold text-white leading-tight mb-1">{game.name}</h2>

          {ratings.length > 0 && (
            <div className="mb-4">
              <GroupAverage ratings={ratings} />
            </div>
          )}

          {/* Ratings section */}
          <div className="border-t border-navy-600 pt-4">
            {rateablePlayers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                No Steam players added — ratings require a Steam profile.
              </p>
            ) : !game.appId ? (
              <p className="text-sm text-gray-500 text-center py-2">
                Ratings aren't available for custom (non-Steam) games.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  {ratings.length > 0 ? 'Edit ratings' : 'Rate this game'}
                </p>
                <div className="space-y-0.5">
                  {rateablePlayers.map((player) => {
                    const existing = ratings.find((r) => r.steamId === player.steamId);
                    return (
                      <RatingWidget
                        key={player.id}
                        player={player}
                        currentRating={existing?.rating ?? null}
                        ratedAt={existing?.ratedAt ?? null}
                        onRate={(rating) =>
                          submitRating(player.steamId, game.appId, game.name, rating)
                        }
                        onRemove={() => removeRating(player.steamId, game.appId)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
