/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0b0f19',
          sidebar: '#070a12',
          card: 'rgba(19, 27, 46, 0.72)',
          border: 'rgba(30, 41, 59, 0.8)',
          cyan: '#00f0ff',
          purple: '#a855f7',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
