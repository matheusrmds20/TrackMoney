import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const KEY = 'ledger-theme'

function apply(theme) {
  const dark = theme === 'noir'
  const el = document.documentElement
  el.classList.toggle('dark', dark)
  el.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored === 'paper' ? 'paper' : 'noir'
    } catch {
      return 'noir'
    }
  })

  useEffect(() => apply(theme), [theme])

  const setMode = (mode) => {
    setTheme(mode)
    try {
      localStorage.setItem(KEY, mode)
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, setMode, toggle: () => setMode(theme === 'noir' ? 'paper' : 'noir') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)