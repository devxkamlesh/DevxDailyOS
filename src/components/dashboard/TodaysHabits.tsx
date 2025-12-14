'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Target, TrendingUp, Sunrise, Briefcase, Moon, Heart, Zap, Plus, Minus, Timer } from 'lucide-react'
import Link from 'next/link'

interface Habit {
  id: string
  name: string
  type: 'boolean' | 'numeric'
  target_value: number | null
  target_unit: string | null
  category: string
  completedToday: boolean
  currentValue: number
}

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  morning: Sunrise,
  work: Briefcase,
  night: Moon,
  health: Heart,
  focus: Zap,
}

const categoryColors: Record<string, string> = {
  morning: 'text-orange-500',
  work: 'text-blue-500',
  night: 'text-purple-500',
  health: 'text-green-500',
  focus: 'text-yellow-500',
}

export default function TodaysHabits() {
  const router = useRouter()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHabits = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      const { data: habitsData } = await supabase
        .from('habits')
        .select('id, name, type, target_value, target_unit, category, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at')

      if (!habitsData) {
        setLoading(false)
        return
      }

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, completed, value')
        .eq('user_id', user.id)
        .eq('date', today)

      const habitsWithStatus = habitsData.map(habit => {
        const log = logs?.find(l => l.habit_id === habit.id)
        const currentValue = log?.value || 0
        const completedToday = log ? (habit.type === 'boolean' ? log.completed : currentValue >= (habit.target_value || 1)) : false
        
        return {
          id: habit.id,
          name: habit.name,
          type: habit.type,
          target_value: habit.target_value,
          target_unit: habit.target_unit,
          category: habit.category,
          completedToday,
          currentValue
        }
      })

      setHabits(habitsWithStatus)
    } catch (error) {
      console.error('Error in fetchHabits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  const [processing, setProcessing] = useState<Set<string>>(new Set())

  const toggleHabit = async (habit: Habit) => {
    // Prevent double-clicking
    if (processing.has(habit.id)) return
    
    const wasCompleted = habit.completedToday
    const newCompleted = !wasCompleted
    
    // For numeric habits: toggle between 0 and target_value
    const newValue = habit.type === 'numeric' 
      ? (newCompleted ? (habit.target_value || 1) : 0)
      : null
    
    // Mark as processing
    setProcessing(prev => new Set(prev).add(habit.id))
    
    // Optimistic update
    setHabits(prev => prev.map(h => 
      h.id === habit.id 
        ? { ...h, completedToday: newCompleted, currentValue: newValue ?? h.currentValue } 
        : h
    ))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, completedToday: wasCompleted, currentValue: habit.currentValue } : h
      ))
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(habit.id)
        return next
      })
      return
    }

    const today = new Date().toISOString().split('T')[0]

    // Update habit log
    const { error: logError } = await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: habit.id,
      date: today,
      completed: newCompleted,
      value: newValue
    }, { onConflict: 'user_id,habit_id,date' })

    if (logError) {
      setHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, completedToday: wasCompleted, currentValue: habit.currentValue } : h
      ))
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(habit.id)
        return next
      })
      return
    }
    
    // Dispatch event after DB update for accurate data
    window.dispatchEvent(new CustomEvent('habitUpdated'))

    // Handle coins and XP with proper tracking
    if (newCompleted && !wasCompleted) {
      // Award coins
      const { awardHabitCoins } = await import('@/lib/coins-fixed')
      const coinResult = await awardHabitCoins(user.id, habit.id, today)
      
      if (!coinResult.success) {
        console.warn('Coin award failed:', coinResult.message)
      }

      // Award XP
      const { awardHabitXP } = await import('@/lib/xp')
      const xpResult = await awardHabitXP(user.id, habit.id, today)
      
      if (!xpResult.success) {
        console.warn('XP award failed:', xpResult.message)
      }
    } else if (!newCompleted && wasCompleted) {
      // Deduct coins
      const { deductHabitCoins } = await import('@/lib/coins-fixed')
      const coinResult = await deductHabitCoins(user.id, habit.id, today)
      
      if (!coinResult.success) {
        console.warn('Coin deduction failed:', coinResult.message)
      }

      // Deduct XP
      const { deductHabitXP } = await import('@/lib/xp')
      const xpResult = await deductHabitXP(user.id, habit.id, today)
      
      if (!xpResult.success) {
        console.warn('XP deduction failed:', xpResult.message)
      }
    }

    setProcessing(prev => {
      const next = new Set(prev)
      next.delete(habit.id)
      return next
    })
  }

  const updateNumericValue = async (habitId: string, delta: number) => {
    // Prevent double-clicking
    if (processing.has(habitId)) return
    
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const newValue = Math.max(0, habit.currentValue + delta)
    const wasCompleted = habit.completedToday
    const isNowCompleted = newValue >= (habit.target_value || 1)
    
    // Mark as processing
    setProcessing(prev => new Set(prev).add(habitId))
    
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, currentValue: newValue, completedToday: isNowCompleted } : h
    ))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, currentValue: habit.currentValue, completedToday: wasCompleted } : h
      ))
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(habitId)
        return next
      })
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: habitId,
      date: today,
      completed: isNowCompleted,
      value: newValue
    }, { onConflict: 'user_id,habit_id,date' })

    if (error) {
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, currentValue: habit.currentValue, completedToday: wasCompleted } : h
      ))
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(habitId)
        return next
      })
      return
    }
    
    // Dispatch event after DB update for accurate data
    window.dispatchEvent(new CustomEvent('habitUpdated'))

    // Handle coins and XP with proper tracking
    if (!wasCompleted && isNowCompleted) {
      // Award coins
      const { awardHabitCoins } = await import('@/lib/coins-fixed')
      const coinResult = await awardHabitCoins(user.id, habitId, today)
      
      if (!coinResult.success) {
        console.warn('Coin award failed:', coinResult.message)
      }

      // Award XP
      const { awardHabitXP } = await import('@/lib/xp')
      const xpResult = await awardHabitXP(user.id, habitId, today)
      
      if (!xpResult.success) {
        console.warn('XP award failed:', xpResult.message)
      }
    } else if (wasCompleted && !isNowCompleted) {
      // Deduct coins
      const { deductHabitCoins } = await import('@/lib/coins-fixed')
      const coinResult = await deductHabitCoins(user.id, habitId, today)
      
      if (!coinResult.success) {
        console.warn('Coin deduction failed:', coinResult.message)
      }

      // Deduct XP
      const { deductHabitXP } = await import('@/lib/xp')
      const xpResult = await deductHabitXP(user.id, habitId, today)
      
      if (!xpResult.success) {
        console.warn('XP deduction failed:', xpResult.message)
      }
    }

    setProcessing(prev => {
      const next = new Set(prev)
      next.delete(habitId)
      return next
    })
  }

  const completedCount = habits.filter(h => h.completedToday).length
  const totalCount = habits.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle h-[600px]">
        <div className="h-10 bg-background rounded-lg animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-background rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="text-accent-primary" size={20} />
          <h2 className="text-lg font-bold">Today&apos;s Habits</h2>
        </div>
        <div className="text-sm font-medium text-accent-primary">{completedCount}/{totalCount}</div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-background rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-accent-primary to-accent-success transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Habits list with custom slim scrollbar */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {habits.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <Target size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-2">No habits yet</p>
            <Link href="/habits" className="text-xs text-accent-primary hover:underline">
              Create your first habit →
            </Link>
          </div>
        ) : (
          habits.map(habit => {
            const IconComponent = categoryIcons[habit.category] || Target
            const colorClass = categoryColors[habit.category] || 'text-gray-500'
            
            return (
              <div
                key={habit.id}
                className={`p-3 rounded-xl border transition-all ${
                  habit.completedToday
                    ? 'bg-accent-success/10 border-accent-success/30'
                    : 'bg-background border-border-subtle hover:border-border-subtle/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox - redirect time-based habits to focus page */}
                  <button
                    onClick={() => {
                      // Time-based habits redirect to focus page
                      if (habit.type === 'numeric' && habit.target_unit === 'minutes' && !habit.completedToday) {
                        router.push(`/focus?habit=${habit.id}`)
                      } else {
                        toggleHabit(habit)
                      }
                    }}
                    className={`flex-shrink-0 transition-all ${
                      habit.completedToday ? 'text-accent-success' : 'text-foreground-muted hover:text-accent-primary'
                    }`}
                  >
                    {habit.completedToday ? (
                      <CheckCircle2 size={22} strokeWidth={2.5} />
                    ) : habit.type === 'numeric' && habit.target_unit === 'minutes' ? (
                      <Timer size={22} strokeWidth={2} className="text-blue-500" />
                    ) : (
                      <Circle size={22} strokeWidth={2} />
                    )}
                  </button>

                  {/* Icon */}
                  <div className={`flex-shrink-0 p-1.5 rounded-lg ${habit.completedToday ? 'bg-accent-success/20' : 'bg-surface'}`}>
                    <IconComponent size={14} className={colorClass} />
                  </div>

                  {/* Name & Progress */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium truncate ${
                      habit.completedToday ? 'text-foreground-muted line-through' : 'text-foreground'
                    }`}>
                      {habit.name}
                    </h3>
                    {habit.type === 'numeric' && (
                      <div className="text-xs text-foreground-muted">
                        {habit.currentValue} / {habit.target_value} {habit.target_unit || ''}
                      </div>
                    )}
                  </div>

                  {/* Numeric controls or coin badge */}
                  {habit.type === 'numeric' ? (
                    habit.target_unit === 'minutes' ? (
                      // Time-based habits show focus button
                      !habit.completedToday && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            router.push(`/focus?habit=${habit.id}`)
                          }}
                          className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium hover:bg-blue-500/20 transition flex items-center gap-1"
                        >
                          <Timer size={10} />
                          Focus
                        </button>
                      )
                    ) : (
                      // Non-time numeric habits show increment/decrement
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateNumericValue(habit.id, -1) }}
                          disabled={habit.currentValue <= 0}
                          className="w-6 h-6 rounded-md bg-surface border border-border-subtle flex items-center justify-center hover:border-accent-primary disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs font-medium">{habit.currentValue}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateNumericValue(habit.id, 1) }}
                          className="w-6 h-6 rounded-md bg-surface border border-border-subtle flex items-center justify-center hover:border-accent-primary text-xs"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )
                  ) : !habit.completedToday && (
                    <div className="px-2 py-0.5 bg-yellow-500/10 rounded text-xs font-bold text-yellow-500">
                      +1
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {habits.length > 0 && (
        <Link 
          href="/habits" 
          className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border-subtle text-xs text-accent-primary hover:underline font-medium"
        >
          <TrendingUp size={14} />
          Manage All Habits
        </Link>
      )}
    </div>
  )
}
