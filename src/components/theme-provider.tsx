"use client"

import * as React from "react"

type Theme = "light" | "dark" | "sepia" | "light-gray" | "black" | "mint" | "blue"
const THEMES: Theme[] = ['light', 'dark', 'sepia', 'light-gray', 'black', 'mint', 'blue'];

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)

  React.useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    if (storedTheme && THEMES.includes(storedTheme)) {
      setTheme(storedTheme)
    }
  }, [storageKey])

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...THEMES)
    root.classList.add(theme)
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
