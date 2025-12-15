'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getLocalDateString, getMsUntilMidnightIST, APP_TIMEZONE } from '@/lib/date-utils'

/**
 * Hook that triggers a callback at midnight IST (12:00 AM India/Kolkata)
 * Used to auto-reset habits and refresh data when a new day starts
 * 
 * @param onMidnight - Callback function to execute at midnight
 * @param enabled - Whether the hook is active (default: true)
 */
export function useMidnightReset(onMidnight: () => void, enabled: boolean = true) {
  const lastDateRef = useRef<string>(getLocalDateString())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const checkAndReset = useCallback(() => {
    const currentDate = getLocalDateString()
    if (currentDate !== lastDateRef.current) {
      console.log(`[MidnightReset] New day detected! ${lastDateRef.current} → ${currentDate} (${APP_TIMEZONE})`)
      lastDateRef.current = currentDate
      onMidnight()
      // Dispatch global event for other components
      window.dispatchEvent(new CustomEvent('midnightReset', { detail: { date: currentDate } }))
      window.dispatchEvent(new CustomEvent('habitUpdated'))
    }
  }, [onMidnight])

  const scheduleNextMidnight = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    const msUntilMidnight = getMsUntilMidnightIST()
    console.log(`[MidnightReset] Scheduling reset in ${Math.round(msUntilMidnight / 1000 / 60)} minutes (${APP_TIMEZONE})`)
    
    timeoutRef.current = setTimeout(() => {
      checkAndReset()
      // Schedule next midnight after reset
      scheduleNextMidnight()
    }, msUntilMidnight + 1000) // Add 1 second buffer
  }, [checkAndReset])

  useEffect(() => {
    if (!enabled) return

    // Store current date
    lastDateRef.current = getLocalDateString()
    
    // Schedule midnight reset
    scheduleNextMidnight()
    
    // Also check every minute in case of sleep/wake or tab visibility
    intervalRef.current = setInterval(checkAndReset, 60000)

    // Check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndReset()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Check on window focus
    const handleFocus = () => checkAndReset()
    window.addEventListener('focus', handleFocus)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, scheduleNextMidnight, checkAndReset])
}

/**
 * Hook to listen for midnight reset events from other components
 * @param callback - Function to call when midnight reset occurs
 */
export function useMidnightResetListener(callback: (date: string) => void) {
  useEffect(() => {
    const handler = (event: CustomEvent<{ date: string }>) => {
      callback(event.detail.date)
    }
    window.addEventListener('midnightReset', handler as EventListener)
    return () => window.removeEventListener('midnightReset', handler as EventListener)
  }, [callback])
}
