'use client'

import { LucideIcon } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface StatCardProps {
  label: string
  value?: string | number
  icon?: LucideIcon
  animatedNumber?: number
  suffix?: string
}

// Simple animated number with fade effect
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isUpdating, setIsUpdating] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayValue(value)
      return
    }

    if (value !== displayValue) {
      setIsUpdating(true)
      
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsUpdating(false)
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  return (
    <span className={`transition-opacity duration-150 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
      {displayValue}
    </span>
  )
}

export default function StatCard({ label, value, icon: Icon, animatedNumber, suffix }: StatCardProps) {
  // If animatedNumber is provided, use it with animation
  if (animatedNumber !== undefined) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
        <div className="text-foreground-muted text-sm mb-2">{label}</div>
        <div className="text-3xl font-semibold flex items-center justify-between">
          <span className="flex items-baseline">
            <AnimatedNumber value={animatedNumber} />
            {suffix && <span className="text-foreground-muted text-xl ml-1">{suffix}</span>}
          </span>
          {Icon && <Icon size={28} className="text-accent-primary flex-shrink-0" />}
        </div>
      </div>
    )
  }

  // Default: no animation, just display value
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
      <div className="text-foreground-muted text-sm mb-2">{label}</div>
      <div className="text-3xl font-semibold flex items-center gap-2">
        <span>{value}</span>
        {Icon && <Icon size={28} className="text-accent-primary flex-shrink-0" />}
      </div>
    </div>
  )
}
