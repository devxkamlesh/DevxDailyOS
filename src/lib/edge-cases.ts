/**
 * Edge Case Handling Utilities (M001)
 * Handles timezone changes, leap years, network failures, and other edge cases
 */

// ============================================================================
// TIMEZONE UTILITIES
// ============================================================================

/**
 * Get user's timezone safely with fallback
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Convert date to user's local timezone
 */
export function toLocalDate(date: Date | string, timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  const d = typeof date === 'string' ? new Date(date) : date;
  
  try {
    const localString = d.toLocaleString('en-US', { timeZone: tz });
    return new Date(localString);
  } catch {
    return d;
  }
}

/**
 * Get start of day in user's timezone
 */
export function getStartOfDay(date: Date = new Date(), timezone?: string): Date {
  const local = toLocalDate(date, timezone);
  local.setHours(0, 0, 0, 0);
  return local;
}

/**
 * Get end of day in user's timezone
 */
export function getEndOfDay(date: Date = new Date(), timezone?: string): Date {
  const local = toLocalDate(date, timezone);
  local.setHours(23, 59, 59, 999);
  return local;
}

/**
 * Check if two dates are the same day (timezone-aware)
 */
export function isSameDay(date1: Date, date2: Date, timezone?: string): boolean {
  const d1 = toLocalDate(date1, timezone);
  const d2 = toLocalDate(date2, timezone);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ============================================================================
// LEAP YEAR UTILITIES
// ============================================================================

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get days in a month (handles leap years)
 */
export function getDaysInMonth(year: number, month: number): number {
  // month is 0-indexed (0 = January)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 1 && isLeapYear(year)) {
    return 29;
  }
  
  return daysInMonth[month] || 30;
}

/**
 * Safely add days to a date (handles month/year boundaries)
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = getStartOfDay(date1);
  const d2 = getStartOfDay(date2);
  return Math.round(Math.abs((d2.getTime() - d1.getTime()) / oneDay));
}

// ============================================================================
// NETWORK FAILURE HANDLING
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: unknown) => boolean;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: () => true,
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === opts.maxRetries || !opts.retryCondition(error)) {
        throw error;
      }
      
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }
  
  if (error instanceof Error) {
    const networkMessages = [
      'network',
      'timeout',
      'abort',
      'connection',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
    ];
    return networkMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
}

// ============================================================================
// SAFE DATA OPERATIONS
// ============================================================================

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely access nested object properties
 */
export function safeGet<T>(
  obj: Record<string, unknown>,
  path: string,
  fallback: T
): T {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return fallback;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return (current as T) ?? fallback;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// DATE VALIDATION
// ============================================================================

/**
 * Check if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if date is today
 */
export function isToday(date: Date, timezone?: string): boolean {
  return isSameDay(date, new Date(), timezone);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date for display (handles invalid dates)
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  try {
    return d.toLocaleDateString(undefined, options);
  } catch {
    return d.toDateString();
  }
}

/**
 * Debounce function for handling rapid inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
