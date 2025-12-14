'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/ui/StatCard'
import { CheckCircle2, Target, Flame } from 'lucide-react'

export default function StatsRow() {
  const [stats, setStats] = useState({
    habitsCompleted: 0,
    habitsTotal: 0,
    deepWorkMinutes: 0,
    streak: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    let mounted = true
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        
        if (!user) {
          setLoading(false)
          return
        }

        const today = new Date().toISOString().split('T')[0]
        
        // Fetch habits and today's logs
        const [habitsRes, logsRes] = await Promise.all([
          supabase.from('habits').select('id, type, target_value, target_unit').eq('user_id', user.id).eq('is_active', true),
          supabase.from('habit_logs').select('habit_id, completed, value').eq('user_id', user.id).eq('date', today)
        ])

        if (habitsRes.error) {
          console.error('Error fetching habits:', habitsRes.error)
          setLoading(false)
          return
        }

        if (logsRes.error) {
          console.error('Error fetching logs:', logsRes.error)
        }

        const habits = habitsRes.data || []
        const logs = logsRes.data || []

        // Calculate completed habits
        let completed = 0
        habits.forEach(habit => {
          const log = logs.find(l => l.habit_id === habit.id)
          if (log) {
            if (habit.type === 'boolean' && log.completed) completed++
            else if (habit.type === 'numeric' && (log.value || 0) >= (habit.target_value || 1)) completed++
          }
        })

        // Calculate streak (simplified - count consecutive days with at least one completed habit)
        const { data: recentLogs, error: streakError } = await supabase
          .from('habit_logs')
          .select('date, completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('date', { ascending: false })
          .limit(30)

        if (streakError) {
          console.error('Error fetching streak:', streakError)
        }

        let streak = 0
        if (recentLogs && recentLogs.length > 0) {
          const uniqueDates = [...new Set(recentLogs.map(l => l.date))].sort().reverse()
          const todayDate = new Date()
          
          for (let i = 0; i < uniqueDates.length; i++) {
            const checkDate = new Date(todayDate)
            checkDate.setDate(checkDate.getDate() - i)
            const checkDateStr = checkDate.toISOString().split('T')[0]
            
            if (uniqueDates.includes(checkDateStr)) {
              streak++
            } else {
              break
            }
          }
        }

        // Deep work - sum only time-based habit values (where target_unit is 'minutes')
        let deepWorkMinutes = 0
        logs.forEach(log => {
          const habit = habits.find(h => h.id === log.habit_id)
          if (habit?.type === 'numeric' && habit?.target_unit === 'minutes' && log.value) {
            // Add the logged value (in minutes)
            deepWorkMinutes += log.value
          }
        })

      if (mounted) {
        setStats({
          habitsCompleted: completed,
          habitsTotal: habits.length,
          deepWorkMinutes,
          streak
        })
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in fetchStats:', error)
      if (mounted) setLoading(false)
    }
    
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Listen for habit updates to refresh stats in realtime
    const handleHabitUpdate = () => fetchStats()
    window.addEventListener('habitUpdated', handleHabitUpdate)
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('habitUpdated', handleHabitUpdate)
    }
  }, [fetchStats])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface p-6 rounded-2xl border border-border-subtle">
            <div className="text-center text-foreground-muted">Loading...</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        label="Habits Done" 
        animatedNumber={stats.habitsCompleted}
        suffix={` / ${stats.habitsTotal}`}
        icon={CheckCircle2}
      />
      <StatCard 
        label="Deep Work" 
        animatedNumber={stats.deepWorkMinutes}
        suffix=" min"
        icon={Target}
      />
      <StatCard 
        label="Streak" 
        animatedNumber={stats.streak}
        suffix=" days"
        icon={Flame}
      />
    </div>
  )
}
