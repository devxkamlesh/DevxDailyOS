'use client'

import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-6">
        {/* Logo/Brand */}
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-primary)]/20 animate-ping" style={{ animationDuration: '2s' }} />
          
          {/* Spinning ring */}
          <div className="w-16 h-16 rounded-full border-3 border-[var(--border-subtle)] border-t-[var(--accent-primary)] animate-spin" />
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)] animate-pulse" />
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            Sadhana
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Loading your workspace...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-success)] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
