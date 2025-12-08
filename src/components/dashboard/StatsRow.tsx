'use client'

import { useEffect, useState } from 'react'
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
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]
      
      // Fetch habits and today's logs
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('id, type, target_value').eq('user_id', user.id).eq('is_active', true),
        supabase.from('habit_logs').select('habit_id, completed, value').eq('user_id', user.id).eq('date', today)
      ])

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
      const { data: recentLogs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(30)

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

      // Deep work (sum of numeric habit values with 'min' unit for today)
      const deepWorkLog = logs.find(l => {
        const habit = habits.find(h => h.id === l.habit_id)
        return habit?.type === 'numeric'
      })

      setStats({
        habitsCompleted: completed,
        habitsTotal: habits.length,
        deepWorkMinutes: deepWorkLog?.value || 0,
        streak
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

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
        value={`${stats.habitsCompleted} / ${stats.habitsTotal}`} 
        icon={CheckCircle2}
      />
      <StatCard 
        label="Deep Work" 
        value={`${stats.deepWorkMinutes} min`} 
        icon={Target}
      />
      <StatCard 
        label="Streak" 
        value={`${stats.streak} days`} 
        icon={Flame}
      />
    </div>
  )
}
