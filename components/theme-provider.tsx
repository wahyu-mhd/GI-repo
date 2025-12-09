'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isReady: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'parents-lms-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? undefined
    const initialTheme = stored ?? (prefersDark ? 'dark' : 'light')

    setTheme(initialTheme)
    setDocumentTheme(initialTheme)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    localStorage.setItem(STORAGE_KEY, theme)
    setDocumentTheme(theme)
  }, [theme, isReady])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(prev => (prev === 'light' ? 'dark' : 'light')),
      isReady,
    }),
    [theme, isReady]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

function setDocumentTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
