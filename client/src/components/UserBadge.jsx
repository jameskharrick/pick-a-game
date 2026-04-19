import React, { useState } from 'react';

export default function UserBadge({ user, onLogout }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Sign out?</span>
        <button
          onClick={onLogout}
          className="text-xs bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700 rounded-lg px-2 py-1 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="w-8 h-8 rounded-full border-2 border-navy-600 flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {(user.displayName || '?')[0].toUpperCase()}
        </div>
      )}
      <span className="text-sm text-gray-300 hidden md:block max-w-[120px] truncate">
        {user.displayName}
      </span>
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-gray-500 hover:text-gray-300 border border-navy-600 hover:border-gray-500 rounded-lg px-2 py-1 transition-colors flex-shrink-0"
      >
        Sign out
      </button>
    </div>
  );
}
