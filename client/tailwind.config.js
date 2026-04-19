/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d1117',
          800: '#161b22',
          700: '#21262d',
          600: '#30363d',
        },
        accent: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          glow: '#8b5cf6',
        },
        green: {
          accent: '#22c55e',
        },
      },
      animation: {
        'spin-fast': 'spin 0.3s linear infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'slot-scroll': 'slotScroll 0.1s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
