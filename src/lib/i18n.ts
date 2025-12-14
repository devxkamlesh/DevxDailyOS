/**
 * Internationalization (L009)
 * Simple i18n implementation for multi-language support
 */

// ============================================================================
// TYPES
// ============================================================================

export type Locale = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  fallbackLocale: Locale;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations: Record<Locale, TranslationDictionary> = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      confirm: 'Confirm',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      or: 'or',
      and: 'and',
    },
    auth: {
      login: 'Log In',
      logout: 'Log Out',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      welcomeBack: 'Welcome back!',
      createAccount: 'Create your account',
    },
    habits: {
      title: 'My Habits',
      addHabit: 'Add Habit',
      editHabit: 'Edit Habit',
      deleteHabit: 'Delete Habit',
      habitName: 'Habit Name',
      category: 'Category',
      frequency: 'Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      completed: 'Completed',
      streak: 'Streak',
      streakDays: '{{count}} day streak',
      perfectDay: 'Perfect Day!',
      noHabits: 'No habits yet. Create your first habit!',
    },
    rewards: {
      coins: 'Coins',
      xp: 'XP',
      level: 'Level',
      badges: 'Badges',
      shop: 'Shop',
      purchase: 'Purchase',
      insufficientCoins: 'Not enough coins',
      earnedCoins: 'You earned {{count}} coins!',
      earnedXP: 'You earned {{count}} XP!',
      levelUp: 'Level Up! You are now level {{level}}',
    },
    challenges: {
      title: 'Challenges',
      weekly: 'Weekly Challenge',
      progress: 'Progress',
      reward: 'Reward',
      completed: 'Challenge Completed!',
      timeLeft: '{{days}} days left',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      notifications: 'Notifications',
      theme: 'Theme',
      language: 'Language',
      timezone: 'Timezone',
      privacy: 'Privacy',
      account: 'Account',
      deleteAccount: 'Delete Account',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      network: 'Network error. Please check your connection.',
      notFound: 'Not found',
      unauthorized: 'Please log in to continue',
      forbidden: 'You do not have permission to do this',
    },
    time: {
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      thisMonth: 'This Month',
      daysAgo: '{{count}} days ago',
      hoursAgo: '{{count}} hours ago',
      minutesAgo: '{{count}} minutes ago',
      justNow: 'Just now',
    },
  },
  
  hi: {
    common: {
      loading: 'लोड हो रहा है...',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      create: 'बनाएं',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      sort: 'क्रमबद्ध करें',
      refresh: 'रीफ्रेश',
      back: 'वापस',
      next: 'अगला',
      previous: 'पिछला',
      submit: 'जमा करें',
      confirm: 'पुष्टि करें',
      close: 'बंद करें',
      yes: 'हाँ',
      no: 'नहीं',
      or: 'या',
      and: 'और',
    },
    auth: {
      login: 'लॉग इन',
      logout: 'लॉग आउट',
      signup: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      forgotPassword: 'पासवर्ड भूल गए?',
      resetPassword: 'पासवर्ड रीसेट करें',
      welcomeBack: 'वापसी पर स्वागत है!',
      createAccount: 'अपना खाता बनाएं',
    },
    habits: {
      title: 'मेरी आदतें',
      addHabit: 'आदत जोड़ें',
      editHabit: 'आदत संपादित करें',
      deleteHabit: 'आदत हटाएं',
      habitName: 'आदत का नाम',
      category: 'श्रेणी',
      frequency: 'आवृत्ति',
      daily: 'दैनिक',
      weekly: 'साप्ताहिक',
      completed: 'पूर्ण',
      streak: 'स्ट्रीक',
      streakDays: '{{count}} दिन की स्ट्रीक',
      perfectDay: 'परफेक्ट डे!',
      noHabits: 'अभी तक कोई आदत नहीं। अपनी पहली आदत बनाएं!',
    },
    rewards: {
      coins: 'सिक्के',
      xp: 'XP',
      level: 'स्तर',
      badges: 'बैज',
      shop: 'दुकान',
      purchase: 'खरीदें',
      insufficientCoins: 'पर्याप्त सिक्के नहीं',
      earnedCoins: 'आपने {{count}} सिक्के कमाए!',
      earnedXP: 'आपने {{count}} XP कमाया!',
      levelUp: 'लेवल अप! अब आप लेवल {{level}} पर हैं',
    },
    challenges: {
      title: 'चुनौतियां',
      weekly: 'साप्ताहिक चुनौती',
      progress: 'प्रगति',
      reward: 'इनाम',
      completed: 'चुनौती पूर्ण!',
      timeLeft: '{{days}} दिन बाकी',
    },
    settings: {
      title: 'सेटिंग्स',
      profile: 'प्रोफ़ाइल',
      notifications: 'सूचनाएं',
      theme: 'थीम',
      language: 'भाषा',
      timezone: 'समय क्षेत्र',
      privacy: 'गोपनीयता',
      account: 'खाता',
      deleteAccount: 'खाता हटाएं',
    },
    errors: {
      generic: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
      network: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
      notFound: 'नहीं मिला',
      unauthorized: 'जारी रखने के लिए कृपया लॉग इन करें',
      forbidden: 'आपको यह करने की अनुमति नहीं है',
    },
    time: {
      today: 'आज',
      yesterday: 'कल',
      tomorrow: 'कल',
      thisWeek: 'इस सप्ताह',
      lastWeek: 'पिछले सप्ताह',
      thisMonth: 'इस महीने',
      daysAgo: '{{count}} दिन पहले',
      hoursAgo: '{{count}} घंटे पहले',
      minutesAgo: '{{count}} मिनट पहले',
      justNow: 'अभी',
    },
  },
  
  // Placeholder for other languages
  es: { common: { loading: 'Cargando...' } },
  fr: { common: { loading: 'Chargement...' } },
  de: { common: { loading: 'Laden...' } },
  ja: { common: { loading: '読み込み中...' } },
  zh: { common: { loading: '加载中...' } },
};

// ============================================================================
// I18N CLASS
// ============================================================================

class I18n {
  private locale: Locale = 'en';
  private config: I18nConfig = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'hi', 'es', 'fr', 'de', 'ja', 'zh'],
    fallbackLocale: 'en',
  };

  /**
   * Set current locale
   */
  setLocale(locale: Locale): void {
    if (this.config.supportedLocales.includes(locale)) {
      this.locale = locale;
      
      // Persist to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('locale', locale);
      }
      
      // Update document lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
      }
    }
  }

  /**
   * Get current locale
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * Initialize locale from storage or browser
   */
  init(): void {
    // Try localStorage first
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale;
      if (stored && this.config.supportedLocales.includes(stored)) {
        this.locale = stored;
        return;
      }
    }

    // Try browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (this.config.supportedLocales.includes(browserLang)) {
        this.locale = browserLang;
        return;
      }
    }

    // Fall back to default
    this.locale = this.config.defaultLocale;
  }

  /**
   * Get translation by key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: string | TranslationDictionary | undefined = translations[this.locale];

    // Navigate to the key
    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to default locale
    if (value === undefined) {
      value = translations[this.config.fallbackLocale];
      for (const k of keys) {
        if (typeof value === 'object' && value !== null) {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }
    }

    // Return key if not found
    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
        return String(params[param] ?? `{{${param}}}`);
      });
    }

    return value;
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): Locale[] {
    return this.config.supportedLocales;
  }

  /**
   * Get locale display name
   */
  getLocaleDisplayName(locale: Locale): string {
    const names: Record<Locale, string> = {
      en: 'English',
      hi: 'हिंदी',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      ja: '日本語',
      zh: '中文',
    };
    return names[locale] || locale;
  }
}

// Singleton instance
export const i18n = new I18n();

// Convenience function
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Hook to use i18n
 */
export function useI18n() {
  const context = useContext(I18nContext);
  
  if (!context) {
    // Fallback if not in provider
    return {
      locale: i18n.getLocale(),
      setLocale: (locale: Locale) => i18n.setLocale(locale),
      t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    };
  }
  
  return context;
}

/**
 * Hook for translation function only
 */
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}

/**
 * I18n Provider component props
 */
interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

/**
 * I18n Provider component
 */
export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'en');

  useEffect(() => {
    i18n.init();
    setLocaleState(i18n.getLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    [locale] // Re-create when locale changes
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export default i18n;
