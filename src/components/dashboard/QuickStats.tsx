'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Target, Zap, Calendar, Star, Coins } from 'lucide-react'
import { getLevelProgress } from '@/lib/xp'
import { getLocalDateString, getLocalDateDaysAgo } from '@/lib/date-utils'

export default function QuickStats() {
  const [stats, setStats] = useState({
    weeklyCompletion: 0,
    currentStreak: 0,
    totalHabits: 0,
    todayProgress: 0,
    xp: 0,
    level: 1,
    coins: 0,
    levelProgress: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const fetchStats = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        
        if (!user) {
          setLoading(false)
          return
        }

        const today = getLocalDateString()
        const weekAgo = getLocalDateDaysAgo(7)

        // Fetch total active habits
        const { data: habits } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        const totalHabits = habits?.length || 0

        // Fetch today's logs
        const { data: todayLogs } = await supabase
          .from('habit_logs')
          .select('completed')
          .eq('user_id', user.id)
          .eq('date', today)

        const todayCompleted = todayLogs?.filter(log => log.completed).length || 0
        const todayProgress = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0

        // Fetch weekly logs
        const { data: weeklyLogs } = await supabase
          .from('habit_logs')
          .select('completed')
          .eq('user_id', user.id)
          .gte('date', weekAgo)
          .eq('completed', true)

        const weeklyTotal = totalHabits * 7
        const weeklyCompleted = weeklyLogs?.length || 0
        const weeklyCompletion = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0

        // Calculate current streak
        const { data: allLogs } = await supabase
          .from('habit_logs')
          .select('date, completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('date', { ascending: false })
          .limit(365)

        let currentStreak = 0
        if (allLogs && allLogs.length > 0) {
          const dates = [...new Set(allLogs.map(log => log.date))].sort().reverse()
          const todayStr = getLocalDateString()
          
          for (let i = 0; i < dates.length; i++) {
            const expectedDate = getLocalDateDaysAgo(i)
            if (dates[i] === expectedDate) {
              currentStreak++
            } else {
              break
            }
          }
        }

        // Fetch XP, Level, and Coins
        const { data: rewards } = await supabase
          .from('user_rewards')
          .select('xp, level, coins')
          .eq('user_id', user.id)
          .single()

        const xp = rewards?.xp || 0
        const level = rewards?.level || 1
        const coins = rewards?.coins || 0
        const progress = getLevelProgress(xp)

        if (mounted) {
          setStats({
            weeklyCompletion,
            currentStreak,
            totalHabits,
            todayProgress,
            xp,
            level,
            coins,
            levelProgress: progress.progressPercent
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        if (mounted) setLoading(false)
      }
    }

    fetchStats()
    
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-accent-primary" />
          <h2 className="text-lg font-semibold">Quick Stats</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-foreground-muted text-sm">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-accent-primary" />
        <h2 className="text-lg font-semibold">Quick Stats</h2>
      </div>

      <div className="space-y-3">
        {/* Today's Progress */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 p-3 rounded-xl border border-accent-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-accent-primary" />
              <span className="text-sm font-medium text-foreground-muted">Today</span>
            </div>
            <span className="text-2xl font-bold text-accent-primary">{stats.todayProgress}%</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-primary transition-all duration-500"
              style={{ width: `${stats.todayProgress}%` }}
            />
          </div>
        </div>

        {/* Weekly Completion */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-3 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <span className="text-sm font-medium text-foreground-muted">This Week</span>
            </div>
            <span className="text-2xl font-bold text-green-500">{stats.weeklyCompletion}%</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${stats.weeklyCompletion}%` }}
            />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-3 rounded-xl border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-orange-500" />
              <span className="text-sm font-medium text-foreground-muted">Streak</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}</div>
              <div className="text-xs text-foreground-muted">days</div>
            </div>
          </div>
        </div>

        {/* XP & Level */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-3 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-purple-500" />
              <span className="text-sm font-medium text-foreground-muted">Level {stats.level}</span>
            </div>
            <span className="text-lg font-bold text-purple-500">{stats.xp} XP</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${stats.levelProgress}%` }}
            />
          </div>
        </div>

        {/* Coins */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-3 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins size={18} className="text-yellow-500" />
              <span className="text-sm font-medium text-foreground-muted">Coins</span>
            </div>
            <span className="text-2xl font-bold text-yellow-500">{stats.coins}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
