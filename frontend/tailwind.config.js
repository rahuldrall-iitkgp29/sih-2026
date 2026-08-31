/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#070b14',
        surface: {
          50: '#0f172a',
          100: '#131e36',
          200: '#182647',
          300: '#1e3059',
          400: '#253d70',
        },
        satellite: {
          cyan: '#38bdf8',
          blue: '#3b82f6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#a855f7',
        },
        border: 'rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "radial-gradient(circle, rgba(56, 189, 248, 0.07) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
