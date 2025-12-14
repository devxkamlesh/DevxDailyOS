'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  onRetry?: () => void | Promise<void>
}

interface State {
  hasError: boolean
  error: Error | null
  isRetrying: boolean
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, isRetrying: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Async Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true })
    
    try {
      if (this.props.onRetry) {
        await this.props.onRetry()
      }
      
      // Reset error state after successful retry
      this.setState({ hasError: false, error: null, isRetrying: false })
    } catch (error) {
      console.error('Retry failed:', error)
      this.setState({ isRetrying: false })
    }
  }

  getErrorType = (error: Error | null) => {
    if (!error) return 'unknown'
    
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network'
    }
    if (message.includes('timeout')) {
      return 'timeout'
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'auth'
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'notfound'
    }
    
    return 'unknown'
  }

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error)
      
      return (
        <div className="flex items-center justify-center p-8">
          <div className="max-w-sm w-full text-center">
            <div className="p-4 bg-red-500/20 rounded-full w-fit mx-auto mb-4">
              {errorType === 'network' ? (
                <WifiOff size={24} className="text-red-400" />
              ) : (
                <AlertCircle size={24} className="text-red-400" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {errorType === 'network' && 'Connection Error'}
              {errorType === 'timeout' && 'Request Timeout'}
              {errorType === 'auth' && 'Authentication Error'}
              {errorType === 'notfound' && 'Not Found'}
              {errorType === 'unknown' && 'Something went wrong'}
            </h3>
            
            <p className="text-sm text-foreground-muted mb-6">
              {errorType === 'network' && 'Please check your internet connection and try again.'}
              {errorType === 'timeout' && 'The request took too long to complete.'}
              {errorType === 'auth' && 'You may need to log in again.'}
              {errorType === 'notfound' && 'The requested resource was not found.'}
              {errorType === 'unknown' && 'An unexpected error occurred.'}
            </p>

            <button
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={this.state.isRetrying ? 'animate-spin' : ''} />
              {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left bg-background p-3 rounded-lg border border-border-subtle">
                <summary className="cursor-pointer text-xs font-medium text-foreground-muted">
                  Error Details
                </summary>
                <pre className="text-xs text-red-400 mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AsyncErrorBoundary