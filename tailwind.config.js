import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Seluruh "amber" (emas) di UI dialihkan ke satu warna aksen indigo
      colors: { amber: colors.indigo },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(.9)' },
          '20%': { opacity: '1', transform: 'translateY(-4px) scale(1.05)' },
          '100%': { opacity: '0', transform: 'translateY(-40px) scale(1)' },
        },
        pulseRing: {
          '0%,100%': { boxShadow: '0 0 0 0 var(--ring, rgba(248,113,113,.6))' },
          '50%': { boxShadow: '0 0 0 5px rgba(248,113,113,0)' },
        },
      },
      animation: {
        floatUp: 'floatUp 1.2s ease-out forwards',
        pulseRing: 'pulseRing 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};