import type { ThemePreference } from '../shared/settings'

let systemListener: (() => void) | null = null

export function applyThemePreference(theme: ThemePreference): void {
  systemListener?.()
  systemListener = null

  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const apply = () => {
    const dark = theme === 'dark' || (theme === 'system' && media.matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }

  apply()

  if (theme === 'system') {
    const handler = () => apply()
    media.addEventListener('change', handler)
    systemListener = () => media.removeEventListener('change', handler)
  }
}
