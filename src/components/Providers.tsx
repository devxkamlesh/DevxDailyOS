'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { performanceMonitor, errorTracker } from '@/lib/monitoring'
import { useOnlineStatus } from '@/lib/offline'

// Online status indicator component
function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus()
  const [showOffline, setShowOffline] = useState(false)
  
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (!isOnline) {
      // Delay showing offline indicator to avoid flashing during page loads
      timer = setTimeout(() => setShowOffline(true), 2000)
    } else {
      setShowOffline(false)
    }
    
    return () => clearTimeout(timer)
  }, [isOnline])
  
  if (!showOffline) return null
  
  return (
    <div className="fixed bottom-4 left-4 z-50 px-4 py-2 bg-yellow-500/90 text-black rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
      <div className="w-2 h-2 bg-yellow-800 rounded-full animate-pulse" />
      You&apos;re offline - changes will sync when back online
    </div>
  )
}

// Initialize monitoring on mount
function MonitoringInitializer() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.init()
    
    // Initialize error tracking
    errorTracker.init()
    
    // Cleanup on unmount
    return () => {
      performanceMonitor.destroy()
    }
  }, [])
  
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Track error with our error tracker
        errorTracker.captureError(error, {
          componentStack: errorInfo.componentStack || undefined,
          source: 'ErrorBoundary'
        })
        console.error('Root Error Boundary:', error, errorInfo)
      }}
    >
      <ToastProvider>
        <MonitoringInitializer />
        <OnlineStatusIndicator />
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}
