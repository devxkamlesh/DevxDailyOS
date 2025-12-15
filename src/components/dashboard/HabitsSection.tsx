'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Habit, HabitLog } from '@/types/database'
import HabitCard from '@/components/habits/HabitCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getLocalDateString } from '@/lib/date-utils'

export default function HabitsSection() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = getLocalDateString()
      
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at'),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('date', today)
      ])

      if (habitsRes.error) {
        console.error('Error fetching habits:', habitsRes.error)
      }
      if (logsRes.error) {
        console.error('Error fetching logs:', logsRes.error)
      }

      if (habitsRes.data) setHabits(habitsRes.data)
      if (logsRes.data) setLogs(logsRes.data)
    } catch (error) {
      console.error('Error in fetchData:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      await fetchData()
      if (mounted) setLoading(false)
    }
    
    loadData()
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  const getLogForHabit = (habitId: string) => {
    return logs.find(log => log.habit_id === habitId) || null
  }

  const completedCount = habits.filter(habit => {
    const log = getLogForHabit(habit.id)
    if (habit.type === 'boolean') return log?.completed
    return (log?.value || 0) >= (habit.target_value || 1)
  }).length

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <SectionHeader title="Today's Habits" actionLabel="View all" actionHref="/habits" />
        <div className="text-center py-8 text-foreground-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Today&apos;s Habits</h2>
          <p className="text-sm text-foreground-muted">{completedCount} of {habits.length} completed</p>
        </div>
        <Link 
          href="/habits"
          className="flex items-center gap-1 text-sm text-accent-primary hover:underline"
        >
          <Plus size={16} />
          Add Habit
        </Link>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground-muted mb-4">No habits yet. Start building your routine!</p>
          <Link 
            href="/habits"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Add First Habit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              log={getLogForHabit(habit.id)}
              onUpdate={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  )
}
