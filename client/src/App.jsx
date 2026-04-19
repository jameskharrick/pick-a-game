import React, { useState } from 'react';
import AddPlayerForm from './components/AddPlayerForm.jsx';
import PlayerList from './components/PlayerList.jsx';
import FilterBar from './components/FilterBar.jsx';
import GameGrid from './components/GameGrid.jsx';
import PickerOverlay from './components/PickerOverlay.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import RatingFeed from './components/RatingFeed.jsx';
import { usePlayers } from './hooks/usePlayers.js';
import { useToast } from './hooks/useToast.js';
import { useGameFilter } from './hooks/useGameFilter.js';
import { useCategoryFilter } from './hooks/useCategoryFilter.js';
import { useRatings } from './hooks/useRatings.js';

export default function App() {
  const { toasts, addToast, removeToast } = useToast();
  const {
    players,
    resolving,
    addSteamPlayer,
    addCustomPlayer,
    removePlayer,
    addCustomGame,
    removeCustomGame,
    loadGames,
    refreshAllLibraries,
  } = usePlayers(addToast);

  const [filterMode, setFilterMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [multiplayerOnly, setMultiplayerOnly] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const [showFeed, setShowFeed] = useState(false);

  const { ratingsMap, submitRating, removeRating } = useRatings(players);

  const ownershipEntries = useGameFilter(players, filterMode, searchQuery);

  const {
    filtered: filteredEntries,
    fetching: categoryFetching,
    progress: categoryProgress,
  } = useCategoryFilter(ownershipEntries, multiplayerOnly);

  const totalRatings = Object.values(ratingsMap).reduce((s, arr) => s + arr.length, 0);

  function handlePickAgain() {
    setPickerKey((k) => k + 1);
  }

  const hasAnyLibrary = players.some((p) => p.games !== null || p.isCustom);

  return (
    <div className="min-h-screen bg-navy-900 pb-28">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-600 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h1 className="text-xl font-extrabold text-white leading-none">
                Game Night Picker
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Find games your whole group can play</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Feed toggle */}
            <button
              onClick={() => setShowFeed((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                showFeed
                  ? 'bg-accent/20 border-accent text-accent-light'
                  : 'bg-navy-700 border-navy-600 text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              <span>📋</span>
              <span className="hidden sm:inline">Feed</span>
              {totalRatings > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  showFeed ? 'bg-accent text-white' : 'bg-navy-600 text-gray-400'
                }`}>
                  {totalRatings}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-accent inline-block" />
              Powered by Steam
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Left sidebar — players */}
          <aside className="w-80 xl:w-96 flex-shrink-0 space-y-4 hidden lg:block">
            <AddPlayerForm
              onAddSteam={addSteamPlayer}
              onAddCustom={addCustomPlayer}
              resolving={resolving}
            />
            <PlayerList
              players={players}
              onRemove={removePlayer}
              onAddCustomGame={addCustomGame}
              onRemoveCustomGame={removeCustomGame}
              onLoadGames={loadGames}
              onRefreshAll={refreshAllLibraries}
            />
          </aside>

          {/* Mobile-only player section (stacked above games) */}
          <div className="lg:hidden w-full space-y-4 flex-shrink-0">
            <AddPlayerForm
              onAddSteam={addSteamPlayer}
              onAddCustom={addCustomPlayer}
              resolving={resolving}
            />
            <PlayerList
              players={players}
              onRemove={removePlayer}
              onAddCustomGame={addCustomGame}
              onRemoveCustomGame={removeCustomGame}
              onLoadGames={loadGames}
              onRefreshAll={refreshAllLibraries}
            />
          </div>

          {/* Centre — games */}
          <div className="flex-1 min-w-0 space-y-4">
            {hasAnyLibrary || players.length > 0 ? (
              <>
                <div className="bg-navy-800 rounded-xl p-4 border border-navy-600">
                  <FilterBar
                    filterMode={filterMode}
                    setFilterMode={setFilterMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    gameCount={filteredEntries.length}
                    multiplayerOnly={multiplayerOnly}
                    setMultiplayerOnly={setMultiplayerOnly}
                    categoryFetching={categoryFetching}
                    categoryProgress={categoryProgress}
                  />
                </div>
                <GameGrid
                  entries={filteredEntries}
                  players={players}
                  filterMode={filterMode}
                  ratingsMap={ratingsMap}
                  submitRating={submitRating}
                  removeRating={removeRating}
                />
              </>
            ) : (
              <div className="bg-navy-800 rounded-xl border border-navy-600 p-12 text-center">
                <div className="text-6xl mb-4">🕹️</div>
                <h2 className="text-xl font-bold text-gray-300 mb-2">Welcome to Game Night Picker</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Add your friends' Steam profiles on the left. Once libraries are loaded, you'll see
                  which games you all share — then let fate decide what to play.
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar — rating feed */}
          {showFeed && (
            <aside className="w-72 xl:w-80 flex-shrink-0" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
              <div className="sticky top-24 h-[calc(100vh-7rem)]">
                <RatingFeed
                  ratingsMap={ratingsMap}
                  players={players}
                  onClose={() => setShowFeed(false)}
                />
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Fixed Pick button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-navy-900 via-navy-900/95 to-transparent p-4 pointer-events-none">
        <div className="max-w-xs mx-auto pointer-events-auto">
          <button
            onClick={() => {
              if (filteredEntries.length === 0) {
                addToast('No games to pick from! Add players and load their libraries.', 'warning');
                return;
              }
              setPickerKey((k) => k + 1);
              setShowPicker(true);
            }}
            className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-glow text-white text-lg font-extrabold shadow-2xl glow-accent transition-all hover:scale-105 active:scale-95"
          >
            🎲 Pick a Game!
          </button>
          {filteredEntries.length > 0 && (
            <p className="text-center text-xs text-gray-500 mt-1">
              {filteredEntries.length} eligible game{filteredEntries.length !== 1 ? 's' : ''}
              {multiplayerOnly && ' · multiplayer'}
            </p>
          )}
        </div>
      </div>

      {/* Picker overlay */}
      {showPicker && (
        <PickerOverlay
          key={pickerKey}
          entries={filteredEntries}
          players={players}
          onClose={() => setShowPicker(false)}
          onPickAgain={handlePickAgain}
          ratingsMap={ratingsMap}
          submitRating={submitRating}
          removeRating={removeRating}
        />
      )}
    </div>
  );
}
