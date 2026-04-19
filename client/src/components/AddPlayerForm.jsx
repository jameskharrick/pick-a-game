import React, { useState } from 'react';
import Spinner from './Spinner.jsx';

export default function AddPlayerForm({ onAddSteam, onAddCustom, resolving }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('steam'); // 'steam' | 'custom'
  const [customName, setCustomName] = useState('');

  function handleSteamSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onAddSteam(input.trim());
    setInput('');
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustom(customName.trim());
    setCustomName('');
  }

  return (
    <div className="bg-navy-800 rounded-xl p-4 border border-navy-600">
      <h2 className="text-lg font-semibold text-accent-light mb-3">Add Players</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('steam')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'steam'
              ? 'bg-accent text-white glow-accent-sm'
              : 'bg-navy-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          Steam Profile
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-accent text-white glow-accent-sm'
              : 'bg-navy-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          Custom Player
        </button>
      </div>

      {mode === 'steam' ? (
        <form onSubmit={handleSteamSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Steam ID or profile URL…"
            disabled={resolving}
            className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={resolving || !input.trim()}
            className="bg-accent hover:bg-accent-glow disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 glow-accent-sm"
          >
            {resolving ? <Spinner size="sm" /> : null}
            {resolving ? 'Loading…' : 'Add'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Player name…"
            className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={!customName.trim()}
            className="bg-accent hover:bg-accent-glow disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors glow-accent-sm"
          >
            Add
          </button>
        </form>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {mode === 'steam'
          ? 'Paste a Steam ID (17 digits), or full profile URL like steamcommunity.com/id/username'
          : 'Add a non-Steam player — you can manually add their games below.'}
      </p>
    </div>
  );
}
