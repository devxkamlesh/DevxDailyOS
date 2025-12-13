'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const toastStyles = {
  success: 'bg-accent-success/10 border-accent-success/30 text-accent-success',
  error: 'bg-red-500/10 border-red-500/30 text-red-500',
  info: 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary',
  warning: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, message, type }])

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container - only render on client */}
      {mounted && toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
          {toasts.map(toast => {
            const Icon = toastIcons[toast.type]
            return (
              <div
                key={toast.id}
                className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg animate-toast-slide-in ${toastStyles[toast.type]}`}
              >
                <Icon size={20} className="flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-sm text-foreground">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-foreground-muted hover:text-foreground transition"
                >
                  <X size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}
