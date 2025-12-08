'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Plus, Minus, Target } from 'lucide-react'
import Link from 'next/link'

interface Habit {
  id: string
  name: string
  type: 'boolean' | 'numeric'
  target_value: number | null
  target_unit: string | null
  category: string
  emoji: string | null
  completedToday: boolean
  currentValue: number
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    morning: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
    work: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
    night: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
    health: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
    focus: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  }
  return colors[category] || { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30' }
}

export default function TodaysHabits() {
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

      // Fetch active habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at')

      if (habitsError) {
        console.error('Error fetching habits:', habitsError)
        setLoading(false)
        return
      }

      if (!habitsData) {
        setLoading(false)
        return
      }

      // Fetch today's logs
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, completed, value')
        .eq('user_id', user.id)
        .eq('date', today)

      if (logsError) {
        console.error('Error fetching logs:', logsError)
      }

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
          emoji: habit.emoji,
          completedToday,
          currentValue
        }
      })

      setHabits(habitsWithStatus)
    } catch (error) {
      console.error('Error in fetchHabits:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const loadHabits = async () => {
      await fetchHabits()
      if (mounted) setLoading(false)
    }
    
    loadHabits()
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  const addCoins = async (userId: string, amount: number) => {
    const supabase = createClient()
    // Get current coins
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', userId)
      .single()
    
    if (rewards) {
      await supabase
        .from('user_rewards')
        .update({ coins: rewards.coins + amount })
        .eq('user_id', userId)
    }
  }

  const toggleBoolean = async (habitId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const newStatus = !currentStatus

    await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: habitId,
      date: today,
      completed: newStatus,
      value: null
    }, { onConflict: 'user_id,habit_id,date' })

    // Award coins for completing (not uncompleting)
    if (newStatus) {
      await addCoins(user.id, 5)
    }

    fetchHabits()
  }

  const updateNumeric = async (habitId: string, currentValue: number, change: number, targetValue: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const newValue = Math.max(0, currentValue + change)
    const completed = newValue >= targetValue

    await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: habitId,
      date: today,
      completed,
      value: newValue
    }, { onConflict: 'user_id,habit_id,date' })

    fetchHabits()
  }

  const quickComplete = async (habitId: string, targetValue: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: habitId,
      date: today,
      completed: true,
      value: targetValue
    }, { onConflict: 'user_id,habit_id,date' })

    // Award coins for completing
    await addCoins(user.id, 5)

    fetchHabits()
  }

  const completedCount = habits.filter(h => h.completedToday).length
  const totalCount = habits.length

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Habits</h2>
          <div className="text-sm text-foreground-muted">Loading...</div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-background rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
      {/* Header with Progress */}
      <div className="p-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Today's Habits</h2>
          <Link 
            href="/habits"
            className="text-sm text-accent-primary hover:underline font-medium"
          >
            Manage →
          </Link>
        </div>
        
        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Progress</span>
              <span className="font-semibold text-accent-primary">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent-primary to-accent-success transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Habits List */}
      <div className="p-6 pt-4">
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-primary/10 flex items-center justify-center">
              <Target size={32} className="text-accent-primary" />
            </div>
            <h3 className="font-semibold mb-2">No habits yet</h3>
            <p className="text-sm text-foreground-muted mb-4">Start building your daily routine</p>
            <Link 
              href="/habits"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              <Plus size={18} />
              Create First Habit
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {habits.map(habit => {
              const categoryStyle = getCategoryColor(habit.category)
              return (
                <button
                  key={habit.id}
                  onClick={() => {
                    if (habit.completedToday) return
                    if (habit.type === 'boolean') {
                      toggleBoolean(habit.id, habit.completedToday)
                    } else {
                      quickComplete(habit.id, habit.target_value || 1)
                    }
                  }}
                  disabled={habit.completedToday}
                  className={`group w-full p-4 rounded-xl border-2 transition-all text-left ${
                    habit.completedToday 
                      ? 'bg-gradient-to-br from-accent-success/10 to-accent-success/5 border-accent-success/40 cursor-default' 
                      : 'bg-background border-border-subtle hover:border-accent-primary/40 hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                      habit.completedToday 
                        ? 'bg-accent-success border-accent-success shadow-sm' 
                        : 'border-border-subtle group-hover:border-accent-primary group-hover:bg-accent-primary/5'
                    }`}>
                      {habit.completedToday ? (
                        <CheckCircle2 size={18} className="text-white" strokeWidth={2.5} />
                      ) : (
                        <div className="w-3 h-3 rounded-sm border-2 border-foreground-muted/30 group-hover:border-accent-primary transition-colors" />
                      )}
                    </div>

                    {/* Habit Info */}
                    <div className="flex-1 min-w-0">
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {habit.emoji && (
                            <span className="text-lg flex-shrink-0">{habit.emoji}</span>
                          )}
                          <span className={`font-semibold text-base transition-all ${
                            habit.completedToday ? 'line-through text-foreground-muted' : 'text-foreground'
                          }`}>
                            {habit.name}
                          </span>
                        </div>
                        
                        {/* Category Badge */}
                        {habit.category && (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                            {habit.category}
                          </span>
                        )}
                      </div>

                      {/* Details Row */}
                      <div className="flex items-center gap-3">
                        {habit.type === 'numeric' && (
                          <>
                            {/* Progress Bar */}
                            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  habit.completedToday 
                                    ? 'bg-accent-success' 
                                    : 'bg-gradient-to-r from-accent-primary to-accent-primary/70'
                                }`}
                                style={{ width: `${Math.min((habit.currentValue / (habit.target_value || 1)) * 100, 100)}%` }}
                              />
                            </div>
                            
                            {/* Target Badge */}
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                              habit.completedToday 
                                ? 'bg-accent-success/20 text-accent-success' 
                                : 'bg-accent-primary/10 text-accent-primary'
                            }`}>
                              {habit.completedToday ? '✓ ' : ''}{habit.target_value} {habit.target_unit}
                            </span>
                          </>
                        )}
                        
                        {habit.type === 'boolean' && !habit.completedToday && (
                          <span className="text-xs text-foreground-muted">Click to complete</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
