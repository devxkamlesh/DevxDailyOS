'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { parseError, getErrorIcon, type UserFriendlyError } from '@/lib/error-messages'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  friendlyError: UserFriendlyError | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, friendlyError: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    const friendlyError = parseError(error)
    return { hasError: true, error, errorInfo: null, friendlyError }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and external service
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, friendlyError: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI with user-friendly messages
      const { friendlyError } = this.state
      const errorIcon = friendlyError ? getErrorIcon(friendlyError.category) : '❓'
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-surface p-8 rounded-2xl border border-border-subtle text-center">
              <div className="p-4 bg-red-500/20 rounded-full w-fit mx-auto mb-6">
                <span className="text-4xl">{errorIcon}</span>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {friendlyError?.title || 'Something went wrong'}
              </h1>
              
              <p className="text-foreground-muted mb-6">
                {friendlyError?.message || 'We encountered an unexpected error. Don\'t worry, your data is safe.'}
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition font-medium"
                >
                  <RefreshCw size={18} />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border-subtle text-foreground rounded-xl hover:bg-surface transition font-medium"
                >
                  <RefreshCw size={18} />
                  Reload Page
                </button>
                
                <a
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border-subtle text-foreground rounded-xl hover:bg-surface transition font-medium"
                >
                  <Home size={18} />
                  Go to Dashboard
                </a>
                
                {friendlyError?.action && friendlyError?.actionLabel && (
                  <a
                    href={friendlyError.action}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded-xl hover:bg-accent-primary/20 transition font-medium"
                  >
                    {friendlyError.actionLabel}
                  </a>
                )}
              </div>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-background p-4 rounded-lg border border-border-subtle">
                  <summary className="cursor-pointer text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                    <Bug size={16} />
                    Error Details (Development)
                  </summary>
                  <div className="text-xs font-mono text-red-400 whitespace-pre-wrap break-all">
                    <strong>Error:</strong> {this.state.error.message}
                    {this.state.errorInfo && (
                      <>
                        <br /><br />
                        <strong>Component Stack:</strong>
                        {this.state.errorInfo.componentStack}
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

    return this.props.children
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo)
    
    // In a real app, you might want to show a toast or modal
    // For now, we'll just log it
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary