/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class', // toggle via classe .dark sur <html>
  theme: {
    extend: {
      colors: {
        carfo: {
          // Greens (primary) — vert vif uni style eCARFO
          50:  '#ECFDF3',
          100: '#D1FADF',
          200: '#A6F4C5',
          300: '#6CE9A6',
          400: '#32D583',
          500: '#16A34A', // Brand vif
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#052E16',

          // Legacy aliases (back-compat avec les classes existantes)
          primary: '#16A34A',
          'primary-light': '#22C55E',
          'primary-lighter': '#4ADE80',
          secondary: '#D4AF37',
          accent: '#8B0000',
          'accent-light': '#A51D1D',
          'gray-dark': '#1F2937',
          'gray-light': '#E5E7EB',
          'gray-lighter': '#F3F4F6',
        },
        gold: {
          50:  '#FBF6E5',
          100: '#F5E9B8',
          400: '#DDB94B',
          500: '#D4AF37',
          600: '#B08B22',
        },
        ink: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
        elevated: '0 10px 25px -5px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
