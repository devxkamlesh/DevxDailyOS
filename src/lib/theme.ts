/**
 * Theme System (L010)
 * Dark/Light theme toggle with system preference detection
 */

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export const themes: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    primary: '262.1 83.3% 57.8%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '262.1 83.3% 57.8%',
  },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    primary: '262.1 83.3% 57.8%',
    primaryForeground: '210 40% 98%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '262.1 83.3% 57.8%',
  },
};

// ============================================================================
// THEME MANAGER
// ============================================================================

class ThemeManager {
  private theme: Theme = 'system';
  private listeners: Set<(theme: Theme) => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  /**
   * Initialize theme manager
   */
  init(): void {
    // Load saved theme
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        this.theme = saved;
      }
    }

    // Setup system preference listener
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemChange);
    }

    // Apply initial theme
    this.applyTheme();
  }

  /**
   * Handle system preference change
   */
  private handleSystemChange = (): void => {
    if (this.theme === 'system') {
      this.applyTheme();
    }
  };

  /**
   * Get current theme setting
   */
  getTheme(): Theme {
    return this.theme;
  }

  /**
   * Get resolved theme (light or dark)
   */
  getResolvedTheme(): 'light' | 'dark' {
    if (this.theme === 'system') {
      return this.getSystemTheme();
    }
    return this.theme;
  }

  /**
   * Get system preference
   */
  getSystemTheme(): 'light' | 'dark' {
    if (this.mediaQuery) {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.theme = theme;

    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }

    // Apply theme
    this.applyTheme();

    // Notify listeners
    this.listeners.forEach((listener) => listener(theme));
  }

  /**
   * Toggle between light and dark
   */
  toggle(): void {
    const resolved = this.getResolvedTheme();
    this.setTheme(resolved === 'dark' ? 'light' : 'dark');
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    if (typeof document === 'undefined') return;

    const resolved = this.getResolvedTheme();
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add new theme class
    root.classList.add(resolved);

    // Update color-scheme for native elements
    root.style.colorScheme = resolved;

    // Apply CSS variables
    const colors = themes[resolved];
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemChange);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hook to use theme
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    // Fallback if not in provider
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
      themeManager.init();
      setThemeState(themeManager.getTheme());
      setResolvedTheme(themeManager.getResolvedTheme());

      return themeManager.subscribe((newTheme) => {
        setThemeState(newTheme);
        setResolvedTheme(themeManager.getResolvedTheme());
      });
    }, []);

    return {
      theme,
      resolvedTheme,
      setTheme: (t: Theme) => themeManager.setTheme(t),
      toggle: () => themeManager.toggle(),
    };
  }

  return context;
}

/**
 * Theme Provider props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * Theme Provider component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    themeManager.init();
    setThemeState(themeManager.getTheme());
    setResolvedTheme(themeManager.getResolvedTheme());

    return themeManager.subscribe((newTheme) => {
      setThemeState(newTheme);
      setResolvedTheme(themeManager.getResolvedTheme());
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    themeManager.setTheme(newTheme);
  }, []);

  const toggle = useCallback(() => {
    themeManager.toggle();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================

import { Moon, Sun, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel }: ThemeToggleProps) {
  const { theme, setTheme, toggle } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const Icon = icons[theme];

  if (showLabel) {
    return (
      <div className={className}>
        <button
          onClick={() => setTheme('light')}
          className={`p-2 rounded ${theme === 'light' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-2 rounded ${theme === 'dark' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-2 rounded ${theme === 'system' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      className={className}
      aria-label="Toggle theme"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export default themeManager;
