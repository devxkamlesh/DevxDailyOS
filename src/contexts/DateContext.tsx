'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { 
  getLocalDateString, 
  getLocalDateDaysAgo, 
  parseLocalDate, 
  APP_TIMEZONE, 
  verifyDateIntegrity,
  forceVerifyDate
} from '@/lib/date-utils'

interface DateContextType {
  // Current selected date (YYYY-MM-DD format in IST)
  selectedDate: string
  // Server-verified today's date
  verifiedToday: string
  // Whether viewing today or a past date
  isToday: boolean
  // Whether date has been verified with server
  isDateVerified: boolean
  // Verification status
  verificationStatus: 'pending' | 'verified' | 'failed'
  // Is date potentially manipulated
  isDateManipulated: boolean
  // Navigation functions
  goToToday: () => void
  goToPreviousDay: () => void
  goToNextDay: () => void
  setDate: (date: string) => void
  // Force re-verify date
  refreshVerification: () => Promise<void>
  // Formatted display strings
  displayDate: string
  displayDateShort: string
  // Check if can navigate forward (can't go past today)
  canGoForward: boolean
}

const DateContext = createContext<DateContextType | undefined>(undefined)

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString())
  const [verifiedToday, setVerifiedToday] = useState<string>(getLocalDateString())
  const [isDateVerified, setIsDateVerified] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending')
  const [isDateManipulated, setIsDateManipulated] = useState(false)
  const verificationInProgress = useRef(false)

  // Verify date with server
  const verifyDate = useCallback(async (force: boolean = false) => {
    if (verificationInProgress.current && !force) return
    verificationInProgress.current = true
    
    try {
      const result = await verifyDateIntegrity()
      setVerifiedToday(result.serverDate)
      setIsDateVerified(result.status === 'verified')
      setVerificationStatus(result.status)
      setIsDateManipulated(result.mismatch)
      
      // If local date doesn't match server, force use server date
      if (result.mismatch && result.status === 'verified') {
        console.error('[DateContext] DATE MANIPULATION DETECTED!')
        console.error(`Local: ${result.localDate}, Server: ${result.serverDate}`)
        // Force selected date to server date if user was on "today"
        const localToday = getLocalDateString()
        if (selectedDate === localToday) {
          setSelectedDate(result.serverDate)
        }
      }
      
      return result
    } catch (error) {
      console.error('Failed to verify date:', error)
      setIsDateVerified(false)
      setVerificationStatus('failed')
    } finally {
      verificationInProgress.current = false
    }
  }, [selectedDate])

  // Force refresh verification
  const refreshVerification = useCallback(async () => {
    await forceVerifyDate()
    await verifyDate(true)
  }, [verifyDate])

  // Verify date on mount and periodically
  useEffect(() => {
    // Initial verification
    verifyDate()
    
    // Re-verify every 1 minute (more frequent for security)
    const interval = setInterval(() => verifyDate(), 60 * 1000)
    
    // Also verify on window focus (user returns to tab)
    const handleFocus = () => verifyDate()
    window.addEventListener('focus', handleFocus)
    
    // Verify on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        verifyDate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [verifyDate])
  
  // Check if selected date is today (use verified date)
  const isToday = selectedDate === verifiedToday
  const canGoForward = selectedDate < verifiedToday

  // Navigation functions
  const goToToday = useCallback(() => {
    setSelectedDate(verifiedToday)
    window.dispatchEvent(new CustomEvent('dateChanged', { detail: { date: verifiedToday } }))
  }, [verifiedToday])

  const goToPreviousDay = useCallback(() => {
    const current = parseLocalDate(selectedDate)
    current.setDate(current.getDate() - 1)
    const newDate = getLocalDateString(current)
    setSelectedDate(newDate)
    window.dispatchEvent(new CustomEvent('dateChanged', { detail: { date: newDate } }))
  }, [selectedDate])

  const goToNextDay = useCallback(() => {
    if (!canGoForward) return
    const current = parseLocalDate(selectedDate)
    current.setDate(current.getDate() + 1)
    const newDate = getLocalDateString(current)
    setSelectedDate(newDate)
    window.dispatchEvent(new CustomEvent('dateChanged', { detail: { date: newDate } }))
  }, [selectedDate, canGoForward])

  const setDate = useCallback((date: string) => {
    // Don't allow future dates (use verified today)
    if (date > verifiedToday) return
    setSelectedDate(date)
    window.dispatchEvent(new CustomEvent('dateChanged', { detail: { date } }))
  }, [verifiedToday])

  // Format display strings
  const getDisplayDate = useCallback(() => {
    if (isToday) return 'Today'
    if (selectedDate === getLocalDateDaysAgo(1)) return 'Yesterday'
    
    const date = parseLocalDate(selectedDate)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: APP_TIMEZONE
    })
  }, [selectedDate, isToday])

  const getDisplayDateShort = useCallback(() => {
    const date = parseLocalDate(selectedDate)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: APP_TIMEZONE
    })
  }, [selectedDate])

  // Listen for midnight reset to update to new day
  useEffect(() => {
    const handleMidnightReset = () => {
      // If user was viewing "today", update to new today
      if (isToday) {
        setSelectedDate(getLocalDateString())
      }
    }
    window.addEventListener('midnightReset', handleMidnightReset)
    return () => window.removeEventListener('midnightReset', handleMidnightReset)
  }, [isToday])

  return (
    <DateContext.Provider value={{
      selectedDate,
      verifiedToday,
      isToday,
      isDateVerified,
      verificationStatus,
      isDateManipulated,
      goToToday,
      goToPreviousDay,
      goToNextDay,
      setDate,
      refreshVerification,
      displayDate: getDisplayDate(),
      displayDateShort: getDisplayDateShort(),
      canGoForward
    }}>
      {children}
    </DateContext.Provider>
  )
}

export function useDate() {
  const context = useContext(DateContext)
  if (!context) {
    throw new Error('useDate must be used within a DateProvider')
  }
  return context
}

/**
 * Hook to listen for date changes
 */
export function useDateChangeListener(callback: (date: string) => void) {
  useEffect(() => {
    const handler = (event: CustomEvent<{ date: string }>) => {
      callback(event.detail.date)
    }
    window.addEventListener('dateChanged', handler as EventListener)
    return () => window.removeEventListener('dateChanged', handler as EventListener)
  }, [callback])
}
