/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS custom properties
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        // Shared colors (work in both modes)
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
