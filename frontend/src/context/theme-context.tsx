import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_THEME_ID, isValidThemeId, THEMES } from '@/lib/themes'

const THEME_STORAGE_KEY = 'billing.theme'

interface ThemeContextValue {
  themeId: string
  setThemeId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isValidThemeId(stored) ? stored : DEFAULT_THEME_ID
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
  }, [themeId])

  const setThemeId = (id: string) => {
    if (!isValidThemeId(id)) return
    localStorage.setItem(THEME_STORAGE_KEY, id)
    setThemeIdState(id)
  }

  const value = useMemo(() => ({ themeId, setThemeId }), [themeId])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

export { THEMES }
