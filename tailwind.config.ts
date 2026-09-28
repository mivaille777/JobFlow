import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f8fa',
        ink: '#172033',
        muted: '#64748b',
        line: '#e2e8f0',
        accent: '#2563eb'
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)'
      }
    }
  },
  plugins: []
} satisfies Config
