'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-surface p-8 rounded-2xl border border-border-subtle text-center">
          <div className="p-4 bg-red-500/20 rounded-full w-fit mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Oops! Something went wrong
          </h1>
          
          <p className="text-foreground-muted mb-6">
            We encountered an unexpected error. Don't worry, your data is safe and we're working to fix this.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition font-medium"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            
            <a
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border-subtle text-foreground rounded-xl hover:bg-surface transition font-medium"
            >
              <Home size={18} />
              Go to Dashboard
            </a>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-background p-4 rounded-lg border border-border-subtle">
              <summary className="cursor-pointer text-sm font-medium text-foreground-muted mb-2">
                Error Details (Development)
              </summary>
              <div className="text-xs font-mono text-red-400 whitespace-pre-wrap break-all">
                {error.message}
                {error.digest && (
                  <>
                    <br />
                    <br />
                    <strong>Error ID:</strong> {error.digest}
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}