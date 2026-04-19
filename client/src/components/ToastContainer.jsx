import React from 'react';

const ICONS = {
  error: '✕',
  warning: '⚠',
  success: '✓',
  info: 'ℹ',
};

const COLORS = {
  error: 'bg-red-900/90 border-red-500 text-red-100',
  warning: 'bg-yellow-900/90 border-yellow-500 text-yellow-100',
  success: 'bg-green-900/90 border-green-500 text-green-100',
  info: 'bg-navy-700 border-accent text-gray-100',
};

export default function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-xl animate-slide-up pointer-events-auto ${COLORS[t.type] || COLORS.info}`}
        >
          <span className="text-base mt-0.5">{ICONS[t.type] || ICONS.info}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-60 hover:opacity-100 transition-opacity ml-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
