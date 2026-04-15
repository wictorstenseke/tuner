import { useState, useCallback } from 'react'
import { THEMES, PedalTheme, loadTheme, saveTheme } from './themes'

export function useTheme() {
  const [theme, setTheme] = useState<PedalTheme>(loadTheme)

  const selectTheme = useCallback((themeId: string) => {
    const found = THEMES.find(t => t.id === themeId)
    if (found) {
      setTheme(found)
      saveTheme(themeId)
    }
  }, [])

  return { theme, themes: THEMES, selectTheme }
}
