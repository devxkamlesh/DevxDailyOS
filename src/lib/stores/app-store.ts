/**
 * Global State Management (M004)
 * Lightweight Zustand-like store without external dependencies
 */

type Listener<T> = (state: T) => void;

/**
 * Create a simple store with React integration
 */
export function createStore<T extends object>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener<T>>();
  
  const getState = () => state;
  
  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextState };
    listeners.forEach(listener => listener(state));
  };
  
  const subscribe = (listener: Listener<T>) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  
  const reset = () => {
    state = initialState;
    listeners.forEach(listener => listener(state));
  };
  
  return { getState, setState, subscribe, reset };
}

// ============================================================================
// USER STATE
// ============================================================================

export interface UserState {
  id: string | null;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const initialUserState: UserState = {
  id: null,
  email: null,
  username: null,
  avatarUrl: null,
  isLoading: true,
  isAuthenticated: false,
};

export const userStore = createStore(initialUserState);

// ============================================================================
// REWARDS STATE
// ============================================================================

export interface RewardsState {
  coins: number;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  isLoading: boolean;
  version: number;
}

const initialRewardsState: RewardsState = {
  coins: 0,
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  isLoading: true,
  version: 0,
};

export const rewardsStore = createStore(initialRewardsState);

// ============================================================================
// UI STATE
// ============================================================================

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  modals: ModalState[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  data?: unknown;
}

const initialUIState: UIState = {
  sidebarOpen: true,
  theme: 'dark',
  toasts: [],
  modals: [],
};

export const uiStore = createStore(initialUIState);

// UI Actions
export const uiActions = {
  toggleSidebar: () => {
    uiStore.setState(state => ({ sidebarOpen: !state.sidebarOpen }));
  },
  
  setTheme: (theme: UIState['theme']) => {
    uiStore.setState({ theme });
  },
  
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    uiStore.setState(state => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto-remove after duration
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => uiActions.removeToast(id), duration);
    }
    
    return id;
  },
  
  removeToast: (id: string) => {
    uiStore.setState(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },
  
  openModal: (id: string, data?: unknown) => {
    uiStore.setState(state => ({
      modals: [...state.modals.filter(m => m.id !== id), { id, isOpen: true, data }],
    }));
  },
  
  closeModal: (id: string) => {
    uiStore.setState(state => ({
      modals: state.modals.map(m => m.id === id ? { ...m, isOpen: false } : m),
    }));
  },
};

// ============================================================================
// HABITS STATE
// ============================================================================

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: string;
  is_active: boolean;
  created_at: string;
}

export interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
}

const initialHabitsState: HabitsState = {
  habits: [],
  isLoading: true,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0],
};

export const habitsStore = createStore(initialHabitsState);

// Habits Actions
export const habitsActions = {
  setHabits: (habits: Habit[]) => {
    habitsStore.setState({ habits, isLoading: false, error: null });
  },
  
  addHabit: (habit: Habit) => {
    habitsStore.setState(state => ({
      habits: [...state.habits, habit],
    }));
  },
  
  updateHabit: (id: string, updates: Partial<Habit>) => {
    habitsStore.setState(state => ({
      habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));
  },
  
  removeHabit: (id: string) => {
    habitsStore.setState(state => ({
      habits: state.habits.filter(h => h.id !== id),
    }));
  },
  
  setSelectedDate: (date: string) => {
    habitsStore.setState({ selectedDate: date });
  },
  
  setLoading: (isLoading: boolean) => {
    habitsStore.setState({ isLoading });
  },
  
  setError: (error: string | null) => {
    habitsStore.setState({ error, isLoading: false });
  },
};

// ============================================================================
// REACT HOOKS (for use in components)
// ============================================================================

import { useSyncExternalStore, useCallback } from 'react';

/**
 * Hook to use store state in React components
 */
export function useStore<T extends object, S>(
  store: ReturnType<typeof createStore<T>>,
  selector: (state: T) => S
): S {
  const getSnapshot = useCallback(() => selector(store.getState()), [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

// Convenience hooks
export function useUser() {
  return useStore(userStore, state => state);
}

export function useRewards() {
  return useStore(rewardsStore, state => state);
}

export function useUI() {
  return useStore(uiStore, state => state);
}

export function useHabits() {
  return useStore(habitsStore, state => state);
}

export function useToasts() {
  return useStore(uiStore, state => state.toasts);
}
