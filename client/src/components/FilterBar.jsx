import React from 'react';

const FILTERS = [
  { id: 'all', label: 'All must own' },
  { id: 'most', label: 'Most own' },
  { id: 'atleast2', label: 'At least 2' },
  { id: 'anyone', label: 'Anyone owns' },
];

export default function FilterBar({
  filterMode,
  setFilterMode,
  searchQuery,
  setSearchQuery,
  gameCount,
  multiplayerOnly,
  setMultiplayerOnly,
  categoryFetching,
  categoryProgress,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterMode === f.id
                  ? 'bg-accent text-white glow-accent-sm'
                  : 'bg-navy-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
          {gameCount} game{gameCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Multiplayer toggle */}
      <button
        onClick={() => setMultiplayerOnly(!multiplayerOnly)}
        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
          multiplayerOnly
            ? 'bg-accent/20 border-accent text-accent-light'
            : 'bg-navy-700 border-navy-600 text-gray-400 hover:text-gray-200 hover:border-gray-500'
        }`}
      >
        <span
          className={`w-8 h-4.5 rounded-full relative flex-shrink-0 transition-colors ${
            multiplayerOnly ? 'bg-accent' : 'bg-navy-600'
          }`}
          style={{ height: '1.125rem' }}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
              multiplayerOnly ? 'left-4' : 'left-0.5'
            }`}
          />
        </span>
        <span>Multiplayer / Co-op only</span>
        {multiplayerOnly && categoryFetching && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-accent-light border-t-transparent rounded-full animate-spin inline-block" />
            {categoryProgress.done}/{categoryProgress.total}
          </span>
        )}
        {multiplayerOnly && !categoryFetching && (
          <span className="ml-auto text-xs text-green-400">✓ checked</span>
        )}
      </button>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search games…"
          className="w-full bg-navy-700 border border-navy-600 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
