'use client'

import { createContext, useContext, useState, useSyncExternalStore, useCallback, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('recupera-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot(): Theme {
  return getStoredTheme()
}

function getServerSnapshot(): Theme {
  return 'dark'
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const storedTheme = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot)
  const [theme, setTheme] = useState<Theme>(storedTheme)

  // Sync data-theme attribute when theme changes
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('recupera-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
