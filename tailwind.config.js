/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        'surface-hover': '#1a1a1a',
        border: '#262626',
        'text-primary': '#fafafa',
        'text-secondary': '#a3a3a3',
        'text-muted': '#525252',
        accent: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
}
