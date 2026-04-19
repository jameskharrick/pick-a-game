import React, { useEffect, useState, useRef } from 'react';
import RatingWidget from './RatingWidget.jsx';

const SPIN_DURATION_MS = 2500;

function OwnerAvatars({ ownerIds, players }) {
  const owners = ownerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {owners.map((p) => (
        <div key={p.id} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full border-2 border-accent overflow-hidden">
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-accent flex items-center justify-center text-white text-sm font-bold">
                {(p.displayName || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">{p.displayName}</span>
        </div>
      ))}
    </div>
  );
}

function GroupAverage({ ratings }) {
  if (!ratings || ratings.length === 0) return null;
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  const color =
    avg >= 8 ? 'text-green-400' : avg >= 5 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className={`text-2xl font-extrabold ${color}`}>
      {avg.toFixed(1)}
      <span className="text-sm font-normal text-gray-500 ml-1">/ 10 group avg</span>
    </div>
  );
}

export default function PickerOverlay({ entries, players, onClose, onPickAgain, ratingsMap, submitRating, removeRating, editableSteamIds }) {
  const [phase, setPhase] = useState('spinning'); // 'spinning' | 'result'
  const [displayedGame, setDisplayedGame] = useState(null);
  const [winner, setWinner] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (entries.length === 0) {
      onClose();
      return;
    }

    const picked = entries[Math.floor(Math.random() * entries.length)];
    setWinner(picked);

    let speed = 60;
    let elapsed = 0;
    let lastUpdate = Date.now();

    function tick() {
      const now = Date.now();
      elapsed += now - lastUpdate;
      lastUpdate = now;

      const progress = Math.min(elapsed / SPIN_DURATION_MS, 1);
      speed = 60 + progress * progress * 500;

      const random = entries[Math.floor(Math.random() * entries.length)];
      setDisplayedGame(random);

      if (elapsed < SPIN_DURATION_MS) {
        timeoutRef.current = setTimeout(tick, speed);
      } else {
        setDisplayedGame(picked);
        setPhase('result');
      }
    }

    timeoutRef.current = setTimeout(tick, speed);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function handlePickAgain() {
    setPhase('spinning');
    setDisplayedGame(null);
    setWinner(null);
    onPickAgain();
  }

  const showGame = phase === 'result' ? winner : displayedGame;
  const coverUrl = showGame?.game?.appId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${showGame.game.appId}/header.jpg`
    : null;

  // Players eligible to rate: Steam players only (custom players have no steamId to attach a rating to)
  const rateablePlayers = players.filter((p) => p.steamId);
  const winnerRatings = winner?.game?.appId ? (ratingsMap?.[String(winner.game.appId)] || []) : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === 'result') onClose();
      }}
    >
      <div
        className={`bg-navy-800 border rounded-2xl max-w-lg w-full p-8 text-center shadow-2xl my-auto ${
          phase === 'result' ? 'border-accent animate-bounce-in glow-accent' : 'border-navy-600'
        }`}
      >
        {phase === 'spinning' ? (
          <>
            <p className="text-accent-light text-sm font-semibold uppercase tracking-widest mb-6">
              Picking a game…
            </p>
            <div className="relative overflow-hidden rounded-xl bg-navy-700 mb-4" style={{ height: 180 }}>
              {showGame ? (
                coverUrl ? (
                  <img
                    key={showGame.game.appId ?? showGame.game.name}
                    src={coverUrl}
                    alt={showGame.game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🎮</div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent pointer-events-none" />
            </div>
            <p className="text-xl font-bold text-white min-h-[2rem] transition-all">
              {showGame?.game?.name || '…'}
            </p>
          </>
        ) : (
          <>
            <div className="text-accent-light text-sm font-semibold uppercase tracking-widest mb-2">
              Tonight you're playing
            </div>
            <div className="relative overflow-hidden rounded-xl bg-navy-700 mb-4" style={{ height: 200 }}>
              {coverUrl ? (
                <img src={coverUrl} alt={winner?.game?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🎮</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/50 to-transparent pointer-events-none" />
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-1 text-glow leading-tight">
              {winner?.game?.name}
            </h2>

            {winnerRatings.length > 0 && (
              <div className="mb-3">
                <GroupAverage ratings={winnerRatings} />
              </div>
            )}

            {winner && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Owned by</p>
                <OwnerAvatars ownerIds={winner.ownerIds} players={players} />
              </div>
            )}

            {/* Rating section — only shown when there are Steam players and the game has an appId */}
            {rateablePlayers.length > 0 && winner?.game?.appId && (
              <div className="border-t border-navy-600 pt-4 mb-5 text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">
                  Rate this game
                </p>
                <div className="space-y-0.5">
                  {rateablePlayers.map((player) => {
                    const existing = winnerRatings.find((r) => r.steamId === player.steamId);
                    return (
                      <RatingWidget
                        key={player.id}
                        player={player}
                        currentRating={existing?.rating ?? null}
                        ratedAt={existing?.ratedAt ?? null}
                        canEdit={editableSteamIds ? editableSteamIds.has(player.steamId) : true}
                        onRate={(rating) =>
                          submitRating(player.steamId, winner.game.appId, winner.game.name, rating)
                        }
                        onRemove={() => removeRating(player.steamId, winner.game.appId)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handlePickAgain}
                className="bg-accent hover:bg-accent-glow text-white px-6 py-2.5 rounded-xl font-semibold transition-colors glow-accent-sm"
              >
                Pick Again
              </button>
              <button
                onClick={onClose}
                className="bg-navy-700 hover:bg-navy-600 text-gray-300 px-6 py-2.5 rounded-xl font-semibold transition-colors border border-navy-600"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
