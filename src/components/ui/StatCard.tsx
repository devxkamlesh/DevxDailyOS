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

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayValue(value)
      return
    }

    if (value !== displayValue) {
      setAnimState('exit')
      
      const exitTimer = setTimeout(() => {
        setDisplayValue(value)
        setAnimState('enter')
      }, 150)
      
      const enterTimer = setTimeout(() => {
        setAnimState('idle')
      }, 400)
      
      return () => {
        clearTimeout(exitTimer)
        clearTimeout(enterTimer)
      }
    }
  }, [value, displayValue])

  const getAnimationClass = () => {
    switch (animState) {
      case 'exit':
        return 'transform -translate-y-4 opacity-0'
      case 'enter':
        return 'transform translate-y-0 opacity-100'
      default:
        return 'transform translate-y-0 opacity-100'
    }
  }

  return (
    <span className={`inline-block transition-all duration-200 ease-out ${getAnimationClass()}`}>
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
        <div className="text-3xl font-semibold flex items-center gap-2">
          <span className="inline-flex items-baseline gap-1">
            <AnimatedNumber value={animatedNumber} />
            {suffix && <span className="text-foreground-muted">{suffix}</span>}
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
