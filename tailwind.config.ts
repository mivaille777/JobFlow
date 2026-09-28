import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--jobflow-canvas) / <alpha-value>)',
        ink: 'rgb(var(--jobflow-ink) / <alpha-value>)',
        muted: 'rgb(var(--jobflow-muted) / <alpha-value>)',
        line: 'rgb(var(--jobflow-line) / <alpha-value>)',
        accent: 'rgb(var(--jobflow-accent) / <alpha-value>)'
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)'
      }
    }
  },
  plugins: []
} satisfies Config
