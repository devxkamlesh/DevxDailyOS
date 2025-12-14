/**
 * Centralized Configuration (M009)
 * All configuration values in one place with environment variable support
 */

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

// ============================================================================
// APPLICATION CONFIG
// ============================================================================

export const config = {
  // App Info
  app: {
    name: getEnvString('NEXT_PUBLIC_APP_NAME', 'Sadhana'),
    version: getEnvString('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
    environment: getEnvString('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    baseUrl: getEnvString('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  
  // Supabase
  supabase: {
    url: getEnvString('NEXT_PUBLIC_SUPABASE_URL', ''),
    anonKey: getEnvString('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
    serviceRoleKey: getEnvString('SUPABASE_SERVICE_ROLE_KEY', ''),
  },
  
  // Razorpay
  razorpay: {
    keyId: getEnvString('NEXT_PUBLIC_RAZORPAY_KEY_ID', ''),
    keySecret: getEnvString('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: getEnvString('RAZORPAY_WEBHOOK_SECRET', ''),
  },
  
  // Rate Limiting
  rateLimit: {
    auth: {
      maxRequests: getEnvNumber('RATE_LIMIT_AUTH_MAX', 5),
      windowMs: getEnvNumber('RATE_LIMIT_AUTH_WINDOW', 15 * 60 * 1000), // 15 minutes
    },
    api: {
      maxRequests: getEnvNumber('RATE_LIMIT_API_MAX', 60),
      windowMs: getEnvNumber('RATE_LIMIT_API_WINDOW', 60 * 1000), // 1 minute
    },
    payment: {
      maxRequests: getEnvNumber('RATE_LIMIT_PAYMENT_MAX', 10),
      windowMs: getEnvNumber('RATE_LIMIT_PAYMENT_WINDOW', 60 * 1000), // 1 minute
    },
  },
  
  // Gamification
  gamification: {
    // XP Settings
    xp: {
      perHabitCompletion: getEnvNumber('XP_PER_HABIT', 10),
      streakBonus: getEnvNumber('XP_STREAK_BONUS', 5),
      perfectDayBonus: getEnvNumber('XP_PERFECT_DAY_BONUS', 50),
      levelUpMultiplier: getEnvNumber('XP_LEVEL_MULTIPLIER', 100),
    },
    // Coin Settings
    coins: {
      perHabitCompletion: getEnvNumber('COINS_PER_HABIT', 1),
      streakBonus: getEnvNumber('COINS_STREAK_BONUS', 2),
      perfectDayBonus: getEnvNumber('COINS_PERFECT_DAY_BONUS', 10),
      dailyLoginBonus: getEnvNumber('COINS_DAILY_LOGIN', 5),
    },
    // Streak Settings
    streak: {
      graceHours: getEnvNumber('STREAK_GRACE_HOURS', 4),
      shieldCost: getEnvNumber('STREAK_SHIELD_COST', 50),
    },
  },
  
  // Feature Flags
  features: {
    enableSocialFeatures: getEnvBoolean('FEATURE_SOCIAL', true),
    enablePayments: getEnvBoolean('FEATURE_PAYMENTS', true),
    enableAnalytics: getEnvBoolean('FEATURE_ANALYTICS', true),
    enableNotifications: getEnvBoolean('FEATURE_NOTIFICATIONS', true),
    enablePWA: getEnvBoolean('FEATURE_PWA', false),
    maintenanceMode: getEnvBoolean('MAINTENANCE_MODE', false),
  },
  
  // Logging
  logging: {
    level: getEnvString('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
    enableConsole: getEnvBoolean('LOG_CONSOLE', true),
    enableFile: getEnvBoolean('LOG_FILE', false),
  },
  
  // Security
  security: {
    csrfTokenExpiry: getEnvNumber('CSRF_TOKEN_EXPIRY', 24 * 60 * 60 * 1000), // 24 hours
    sessionTimeout: getEnvNumber('SESSION_TIMEOUT', 7 * 24 * 60 * 60 * 1000), // 7 days
    maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: getEnvNumber('LOCKOUT_DURATION', 15 * 60 * 1000), // 15 minutes
  },
  
  // Pagination
  pagination: {
    defaultPageSize: getEnvNumber('DEFAULT_PAGE_SIZE', 20),
    maxPageSize: getEnvNumber('MAX_PAGE_SIZE', 100),
  },
  
  // Cache
  cache: {
    defaultTTL: getEnvNumber('CACHE_DEFAULT_TTL', 5 * 60 * 1000), // 5 minutes
    userDataTTL: getEnvNumber('CACHE_USER_DATA_TTL', 60 * 1000), // 1 minute
    staticDataTTL: getEnvNumber('CACHE_STATIC_DATA_TTL', 60 * 60 * 1000), // 1 hour
  },
  
  // Timeouts
  timeouts: {
    apiRequest: getEnvNumber('TIMEOUT_API_REQUEST', 30000), // 30 seconds
    dbQuery: getEnvNumber('TIMEOUT_DB_QUERY', 10000), // 10 seconds
    fileUpload: getEnvNumber('TIMEOUT_FILE_UPLOAD', 60000), // 60 seconds
  },
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate required configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required in production
  if (config.app.isProd) {
    if (!config.supabase.url) errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
    if (!config.supabase.anonKey) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    
    if (config.features.enablePayments) {
      if (!config.razorpay.keyId) errors.push('NEXT_PUBLIC_RAZORPAY_KEY_ID is required for payments');
      if (!config.razorpay.keySecret) errors.push('RAZORPAY_KEY_SECRET is required for payments');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get public config (safe to expose to client)
 */
export function getPublicConfig() {
  return {
    app: {
      name: config.app.name,
      version: config.app.version,
      environment: config.app.environment,
      baseUrl: config.app.baseUrl,
    },
    features: config.features,
    gamification: {
      xp: config.gamification.xp,
      coins: config.gamification.coins,
    },
    pagination: config.pagination,
  };
}

export default config;
