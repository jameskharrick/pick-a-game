import React from 'react';

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
    </svg>
  );
}

export default function SignInPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Hero */}
        <div>
          <div className="text-7xl mb-4">🎮</div>
          <h1 className="text-4xl font-extrabold text-white mb-3 text-glow">
            Game Night Picker
          </h1>
          <p className="text-gray-400 text-lg">
            Find games your whole group can play together
          </p>
        </div>

        {/* Sign-in card */}
        <div className="bg-navy-800 rounded-2xl border border-navy-600 p-8 space-y-6 text-left">
          <div className="space-y-2">
            <h2 className="text-white font-semibold text-lg">Sign in to get started</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connect your Steam account to load your game library and rate games
              with your friends. Ratings are shared — you can rate for yourself
              and anyone on your Steam friends list.
            </p>
          </div>

          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-white transition-all
              bg-[#1b2838] hover:bg-[#2a475e] border border-[#4c6b82] hover:border-[#66c0f4]
              hover:shadow-[0_0_16px_rgba(102,192,244,0.2)]"
          >
            <SteamIcon />
            Sign in through Steam
          </button>

          <p className="text-xs text-gray-600 text-center">
            We only read your Steam ID, display name, avatar, and game library.
            Your password is never shared with us.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '📚', label: 'Compare libraries' },
            { icon: '🎲', label: 'Random picker' },
            { icon: '⭐', label: 'Rate games' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-navy-800/50 rounded-xl p-3 border border-navy-700">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
