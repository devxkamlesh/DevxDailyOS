/**
 * Date Utilities for Timezone-Safe Operations
 * 
 * All dates are handled in India/Kolkata timezone (IST - UTC+5:30)
 * This ensures consistent behavior regardless of user's system timezone.
 * 
 * Problem: new Date().toISOString().split('T')[0] converts to UTC
 * which can cause the date to be off by 1 day depending on timezone.
 * 
 * Solution: Use these utilities for all date string operations.
 */

// App timezone - India/Kolkata (IST)
export const APP_TIMEZONE = 'Asia/Kolkata'

/**
 * Get current date/time in India/Kolkata timezone
 * @returns Date components in IST
 */
export function getISTDate(): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } {
  const now = new Date()
  const istString = now.toLocaleString('en-US', { timeZone: APP_TIMEZONE })
  const istDate = new Date(istString)
  return {
    year: istDate.getFullYear(),
    month: istDate.getMonth() + 1,
    day: istDate.getDate(),
    hours: istDate.getHours(),
    minutes: istDate.getMinutes(),
    seconds: istDate.getSeconds()
  }
}

/**
 * Get a date in YYYY-MM-DD format using India/Kolkata timezone
 * @param date - Date object (defaults to now)
 * @returns Date string in YYYY-MM-DD format (IST)
 */
export function getLocalDateString(date: Date = new Date()): string {
  // Convert to IST timezone
  const istString = date.toLocaleString('en-US', { timeZone: APP_TIMEZONE })
  const istDate = new Date(istString)
  const year = istDate.getFullYear()
  const month = String(istDate.getMonth() + 1).padStart(2, '0')
  const day = String(istDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * @returns Today's date string
 */
export function getToday(): string {
  return getLocalDateString(new Date())
}

/**
 * Get date X days ago in local timezone
 * @param daysAgo - Number of days to go back
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateDaysAgo(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return getLocalDateString(date)
}

/**
 * Get date X days from now in local timezone
 * @param daysFromNow - Number of days to go forward
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateDaysFromNow(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return getLocalDateString(date)
}

/**
 * Check if two dates are the same day (local timezone)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export function isSameLocalDay(date1: Date, date2: Date): boolean {
  return getLocalDateString(date1) === getLocalDateString(date2)
}

/**
 * Check if a date is today (local timezone)
 * @param date - Date to check
 * @returns True if today
 */
export function isToday(date: Date): boolean {
  return getLocalDateString(date) === getToday()
}

/**
 * Check if a date is yesterday (local timezone)
 * @param date - Date to check
 * @returns True if yesterday
 */
export function isYesterday(date: Date): boolean {
  return getLocalDateString(date) === getLocalDateDaysAgo(1)
}

/**
 * Get the start of today (midnight) in local timezone
 * @returns Date object set to start of today
 */
export function getStartOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}

/**
 * Get the end of today (23:59:59.999) in local timezone
 * @returns Date object set to end of today
 */
export function getEndOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
}

/**
 * Get the start of a specific date in local timezone
 * @param date - Date to get start of
 * @returns Date object set to start of that day
 */
export function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

/**
 * Get the end of a specific date in local timezone
 * @param date - Date to get end of
 * @returns Date object set to end of that day
 */
export function getEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local timezone)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get an array of date strings for the last N days
 * @param days - Number of days to include
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getLastNDays(days: number): string[] {
  const dates: string[] = []
  for (let i = 0; i < days; i++) {
    dates.push(getLocalDateDaysAgo(i))
  }
  return dates
}

/**
 * Get the first day of the current month
 * @returns Date string in YYYY-MM-DD format
 */
export function getFirstDayOfMonth(): string {
  const now = new Date()
  return getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1))
}

/**
 * Get the last day of the current month
 * @returns Date string in YYYY-MM-DD format
 */
export function getLastDayOfMonth(): string {
  const now = new Date()
  return getLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}

/**
 * Calculate the difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days difference (positive if date1 > date2)
 */
export function daysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000 // milliseconds in a day
  const start = getStartOfDay(date1)
  const end = getStartOfDay(date2)
  return Math.round((start.getTime() - end.getTime()) / oneDay)
}

/**
 * Format a date for display
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }
): string {
  return date.toLocaleDateString('en-US', options)
}

/**
 * Get timezone information for debugging
 * @returns Object with timezone details
 */
export function getTimezoneInfo(): {
  offset: number
  offsetHours: number
  name: string
  appTimezone: string
  isAheadOfUTC: boolean
  currentISTDate: string
  currentISTTime: string
} {
  const offset = new Date().getTimezoneOffset()
  const ist = getISTDate()
  return {
    offset,
    offsetHours: offset / 60,
    name: Intl.DateTimeFormat().resolvedOptions().timeZone,
    appTimezone: APP_TIMEZONE,
    isAheadOfUTC: offset < 0,
    currentISTDate: getLocalDateString(),
    currentISTTime: `${String(ist.hours).padStart(2, '0')}:${String(ist.minutes).padStart(2, '0')}:${String(ist.seconds).padStart(2, '0')}`
  }
}

/**
 * Get milliseconds until next midnight in IST
 * @returns Milliseconds until 12:00 AM IST
 */
export function getMsUntilMidnightIST(): number {
  const ist = getISTDate()
  // Calculate seconds until midnight
  const secondsUntilMidnight = 
    (24 - ist.hours - 1) * 3600 + // hours remaining
    (60 - ist.minutes - 1) * 60 + // minutes remaining
    (60 - ist.seconds) // seconds remaining
  return secondsUntilMidnight * 1000
}

/**
 * Check if it's a new day in IST compared to stored date
 * @param storedDate - Previously stored date string (YYYY-MM-DD)
 * @returns True if current IST date is different from stored date
 */
export function isNewDayIST(storedDate: string | null): boolean {
  if (!storedDate) return true
  return getLocalDateString() !== storedDate
}

/**
 * Get formatted IST time string
 * @returns Time string like "11:30 PM IST"
 */
export function getISTTimeString(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { 
    timeZone: APP_TIMEZONE, 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }) + ' IST'
}

// ============================================
// SERVER DATE VERIFICATION SYSTEM
// Prevents users from manipulating local date
// ============================================

// Cache for verified server date
let verifiedServerDate: string | null = null
let verifiedServerTimestamp: number | null = null
let lastVerificationTime: number = 0
let verificationStatus: 'pending' | 'verified' | 'failed' = 'pending'

// Short cache for instant responses, re-verify frequently
const VERIFICATION_CACHE_MS = 60 * 1000 // 1 minute cache (more frequent checks)

// Multiple time APIs for redundancy
const TIME_APIS = [
  {
    name: 'TimeAPI.io',
    url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata',
    parseDate: (data: { year: number; month: number; day: number }) => 
      `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`,
    parseTimestamp: (data: { dateTime: string }) => new Date(data.dateTime).getTime()
  },
  {
    name: 'WorldTimeAPI',
    url: 'https://worldtimeapi.org/api/timezone/Asia/Kolkata',
    parseDate: (data: { datetime: string }) => data.datetime.split('T')[0],
    parseTimestamp: (data: { unixtime: number }) => data.unixtime * 1000
  }
]

/**
 * Fetch date from a single API with timeout
 */
async function fetchFromAPI(api: typeof TIME_APIS[0], timeoutMs: number = 3000): Promise<{ date: string; timestamp: number } | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(api.url, {
      cache: 'no-store',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) throw new Error(`${api.name} returned ${response.status}`)
    
    const data = await response.json()
    return {
      date: api.parseDate(data),
      timestamp: api.parseTimestamp(data)
    }
  } catch (error) {
    console.warn(`[DateVerify] ${api.name} failed:`, error)
    return null
  }
}

/**
 * Fetch actual date from internet time servers with multiple fallbacks
 * Uses race condition to get fastest response
 * @returns Verified date string in YYYY-MM-DD format (IST)
 */
export async function getVerifiedServerDate(): Promise<string> {
  // Return cached date if still valid and verified
  if (
    verifiedServerDate && 
    verificationStatus === 'verified' &&
    Date.now() - lastVerificationTime < VERIFICATION_CACHE_MS
  ) {
    return verifiedServerDate
  }

  // Try all APIs in parallel, use first successful response
  const results = await Promise.allSettled(
    TIME_APIS.map(api => fetchFromAPI(api, 3000))
  )
  
  // Find first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      verifiedServerDate = result.value.date
      verifiedServerTimestamp = result.value.timestamp
      lastVerificationTime = Date.now()
      verificationStatus = 'verified'
      
      console.log(`[DateVerify] Server date verified: ${verifiedServerDate}`)
      return verifiedServerDate
    }
  }
  
  // All APIs failed - use local date but mark as unverified
  console.warn('[DateVerify] All APIs failed, using local date')
  verificationStatus = 'failed'
  return getLocalDateString()
}

/**
 * Get verification status
 */
export function getVerificationStatus(): {
  status: 'pending' | 'verified' | 'failed'
  serverDate: string | null
  serverTimestamp: number | null
  lastChecked: number
  cacheAge: number
} {
  return {
    status: verificationStatus,
    serverDate: verifiedServerDate,
    serverTimestamp: verifiedServerTimestamp,
    lastChecked: lastVerificationTime,
    cacheAge: lastVerificationTime ? Date.now() - lastVerificationTime : 0
  }
}

/**
 * Force re-verification (bypass cache)
 */
export async function forceVerifyDate(): Promise<string> {
  verifiedServerDate = null
  lastVerificationTime = 0
  verificationStatus = 'pending'
  return await getVerifiedServerDate()
}

/**
 * Verify if local date matches server date
 * @returns Object with verification result
 */
export async function verifyDateIntegrity(): Promise<{
  isValid: boolean
  localDate: string
  serverDate: string
  mismatch: boolean
  status: 'pending' | 'verified' | 'failed'
  timeDriftMs: number
}> {
  const localDate = getLocalDateString()
  const localTimestamp = Date.now()
  const serverDate = await getVerifiedServerDate()
  const mismatch = localDate !== serverDate
  
  // Calculate time drift if we have server timestamp
  const timeDriftMs = verifiedServerTimestamp 
    ? Math.abs(localTimestamp - verifiedServerTimestamp)
    : 0
  
  if (mismatch) {
    console.error(`[DateVerify] DATE MISMATCH DETECTED! Local: ${localDate}, Server: ${serverDate}`)
  }
  
  return {
    isValid: !mismatch && verificationStatus === 'verified',
    localDate,
    serverDate,
    mismatch,
    status: verificationStatus,
    timeDriftMs
  }
}

/**
 * Get today's date with server verification
 * Falls back to local date if server is unreachable
 * @returns Verified date string in YYYY-MM-DD format
 */
export async function getVerifiedToday(): Promise<string> {
  return await getVerifiedServerDate()
}

/**
 * Check if user's system time is manipulated
 * Returns true if time drift is more than 5 minutes
 */
export async function isTimeManipulated(): Promise<boolean> {
  const result = await verifyDateIntegrity()
  // If dates don't match or time drift > 5 minutes, likely manipulated
  return result.mismatch || result.timeDriftMs > 5 * 60 * 1000
}

/**
 * Initialize date verification on app load
 * Call this early in the app lifecycle
 */
export async function initDateVerification(): Promise<void> {
  console.log('[DateVerify] Initializing date verification...')
  const result = await verifyDateIntegrity()
  console.log('[DateVerify] Initial verification:', result)
  
  if (result.mismatch) {
    console.error('[DateVerify] WARNING: System date appears to be manipulated!')
  }
}
