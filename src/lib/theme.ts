export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'travel-budget-theme'

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY)
  if (value === 'light' || value === 'dark') {
    return value
  }
  return null
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

export function initTheme() {
  applyTheme(resolveTheme())
}
