/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        kodo: {
          bg: 'rgb(var(--kodo-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--kodo-surface-rgb) / <alpha-value>)',
          card: 'rgb(var(--kodo-card-rgb) / <alpha-value>)',
          text: 'rgb(var(--kodo-text-rgb) / <alpha-value>)',
          'text-secondary': 'rgb(var(--kodo-text-secondary-rgb) / <alpha-value>)',
          'text-muted': 'rgb(var(--kodo-text-muted-rgb) / <alpha-value>)',
          'text-dim': 'rgb(var(--kodo-text-dim-rgb) / <alpha-value>)',
          accent: '#6366f1',
          'accent-hover': '#5558e6',
          'accent-soft': 'rgba(99,102,241,0.12)',
          pink: '#ec4899',
          teal: '#14b8a6',
          amber: '#f59e0b',
          green: '#22c55e',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
