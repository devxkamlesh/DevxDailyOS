'use client'

import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to external service in production
        console.error('Root Error Boundary:', error, errorInfo)
      }}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}
