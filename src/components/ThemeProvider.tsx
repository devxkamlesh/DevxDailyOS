'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Theme definitions matching the shop
export const THEMES = {
  default: {
    name: 'Default',
    background: '#000000',
    surface: '#111111',
    foreground: '#ffffff',
    foregroundMuted: '#888888',
    accentPrimary: '#3b82f6',
    accentSuccess: '#22c55e',
    borderSubtle: '#222222',
  },
  ocean: {
    name: 'Ocean Blue',
    background: '#0a1628',
    surface: '#0f2847',
    foreground: '#ffffff',
    foregroundMuted: '#7dd3fc',
    accentPrimary: '#0ea5e9',
    accentSuccess: '#22c55e',
    borderSubtle: '#1e3a5f',
  },
  sunset: {
    name: 'Sunset',
    background: '#1a0a0a',
    surface: '#2d1515',
    foreground: '#ffffff',
    foregroundMuted: '#fca5a5',
    accentPrimary: '#f97316',
    accentSuccess: '#22c55e',
    borderSubtle: '#4a2020',
  },
  forest: {
    name: 'Forest',
    background: '#0a1a0a',
    surface: '#0f2d0f',
    foreground: '#ffffff',
    foregroundMuted: '#86efac',
    accentPrimary: '#22c55e',
    accentSuccess: '#4ade80',
    borderSubtle: '#1a4a1a',
  },
  purple: {
    name: 'Royal Purple',
    background: '#0f0a1a',
    surface: '#1a1030',
    foreground: '#ffffff',
    foregroundMuted: '#c4b5fd',
    accentPrimary: '#8b5cf6',
    accentSuccess: '#22c55e',
    borderSubtle: '#2e1f5a',
  },
  gold: {
    name: 'Golden',
    background: '#1a1505',
    surface: '#2d2510',
    foreground: '#ffffff',
    foregroundMuted: '#fcd34d',
    accentPrimary: '#f59e0b',
    accentSuccess: '#22c55e',
    borderSubtle: '#4a3d1a',
  },
  rose: {
    name: 'Rose Gold',
    background: '#1a0f14',
    surface: '#2d1a24',
    foreground: '#ffffff',
    foregroundMuted: '#fda4af',
    accentPrimary: '#f43f5e',
    accentSuccess: '#22c55e',
    borderSubtle: '#4a2a3a',
  },
  midnight: {
    name: 'Midnight',
    background: '#020617',
    surface: '#0f172a',
    foreground: '#ffffff',
    foregroundMuted: '#94a3b8',
    accentPrimary: '#6366f1',
    accentSuccess: '#22c55e',
    borderSubtle: '#1e293b',
  },
} as const

export type ThemeId = keyof typeof THEMES

interface ThemeContextType {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyTheme(themeId: ThemeId) {
  const theme = THEMES[themeId] || THEMES.default
  const root = document.documentElement
  
  root.style.setProperty('--background', theme.background)
  root.style.setProperty('--surface', theme.surface)
  root.style.setProperty('--foreground', theme.foreground)
  root.style.setProperty('--foreground-muted', theme.foregroundMuted)
  root.style.setProperty('--accent-primary', theme.accentPrimary)
  root.style.setProperty('--accent-success', theme.accentSuccess)
  root.style.setProperty('--border-subtle', theme.borderSubtle)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('default')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Load theme from database
    const loadTheme = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data } = await supabase
            .from('user_rewards')
            .select('current_theme')
            .eq('user_id', user.id)
            .single()
          
          if (data?.current_theme && THEMES[data.current_theme as ThemeId]) {
            setThemeState(data.current_theme as ThemeId)
            applyTheme(data.current_theme as ThemeId)
          } else {
            // Apply default theme if no theme found
            applyTheme('default')
          }
        } else {
          // Apply default theme if no user
          applyTheme('default')
        }
      } catch (error) {
        console.error('Error loading theme:', error)
        applyTheme('default')
      } finally {
        setLoading(false)
      }
    }

    loadTheme()
  }, [])

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    
    // Save to localStorage for instant load next time
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  // Apply theme on mount and changes
  useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  // Don't show loading state - let the page loading.tsx handle it
  // This prevents duplicate loading screens
  if (loading) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
