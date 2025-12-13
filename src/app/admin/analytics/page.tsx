    'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart3, TrendingUp, Users, Target, CheckCircle2, 
  Calendar, Clock, Flame, ArrowUp, ArrowDown
} from 'lucide-react'

interface AnalyticsData {
  dailyStats: { date: string; completions: number; users: number }[]
  categoryBreakdown: { category: string; count: number }[]
  topHabits: { name: string; completions: number }[]
  weeklyGrowth: { users: number; habits: number; completions: number }
  averages: { habitsPerUser: number; completionsPerUser: number; avgStreak: number }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const prevStartDate = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch daily completions
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, user_id, completed')
        .gte('date', startDate)
        .eq('completed', true)

      // Group by date
      const dailyMap = new Map<string, { completions: number; users: Set<string> }>()
      logs?.forEach(log => {
        if (!dailyMap.has(log.date)) {
          dailyMap.set(log.date, { completions: 0, users: new Set() })
        }
        const day = dailyMap.get(log.date)!
        day.completions++
        day.users.add(log.user_id)
      })

      const dailyStats = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, completions: data.completions, users: data.users.size }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Category breakdown
      const { data: habits } = await supabase.from('habits').select('category')
      const categoryMap = new Map<string, number>()
      habits?.forEach(h => {
        categoryMap.set(h.category, (categoryMap.get(h.category) || 0) + 1)
      })
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)

      // Top habits
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('habit_id, habits(name)')
        .gte('date', startDate)
        .eq('completed', true)

      const habitMap = new Map<string, { name: string; completions: number }>()
      habitLogs?.forEach((log: any) => {
        const name = log.habits?.name || 'Unknown'
        if (!habitMap.has(log.habit_id)) {
          habitMap.set(log.habit_id, { name, completions: 0 })
        }
        habitMap.get(log.habit_id)!.completions++
      })
      const topHabits = Array.from(habitMap.values())
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 10)

      // Weekly growth comparison
      const { count: currentUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
      const { count: prevUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', prevStartDate).lt('created_at', startDate)
      const { count: currentHabits } = await supabase.from('habits').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
      const { count: prevHabits } = await supabase.from('habits').select('*', { count: 'exact', head: true }).gte('created_at', prevStartDate).lt('created_at', startDate)
      const currentCompletions = logs?.length || 0
      const { data: prevLogs } = await supabase.from('habit_logs').select('id').gte('date', prevStartDate).lt('date', startDate).eq('completed', true)
      const prevCompletions = prevLogs?.length || 0

      // Averages
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: totalHabits } = await supabase.from('habits').select('*', { count: 'exact', head: true })
      const { count: totalCompletions } = await supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('completed', true)
      const { data: streaks } = await supabase.from('user_rewards').select('current_streak')

      const avgStreak = streaks?.length ? streaks.reduce((sum, s) => sum + (s.current_streak || 0), 0) / streaks.length : 0

      setData({
        dailyStats,
        categoryBreakdown,
        topHabits,
        weeklyGrowth: {
          users: prevUsers ? Math.round(((currentUsers || 0) - prevUsers) / prevUsers * 100) : 100,
          habits: prevHabits ? Math.round(((currentHabits || 0) - prevHabits) / prevHabits * 100) : 100,
          completions: prevCompletions ? Math.round((currentCompletions - prevCompletions) / prevCompletions * 100) : 100
        },
        averages: {
          habitsPerUser: totalUsers ? Math.round((totalHabits || 0) / totalUsers * 10) / 10 : 0,
          completionsPerUser: totalUsers ? Math.round((totalCompletions || 0) / totalUsers * 10) / 10 : 0,
          avgStreak: Math.round(avgStreak * 10) / 10
        }
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const GrowthIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center gap-1 text-sm ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {value >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(value)}%
    </span>
  )

  const categoryColors: Record<string, string> = {
    morning: 'bg-yellow-500',
    work: 'bg-blue-500',
    night: 'bg-purple-500',
    health: 'bg-green-500',
    focus: 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-purple-400" />
            Platform Analytics
          </h1>
          <p className="text-foreground-muted">Insights and trends</p>
        </div>
        <div className="flex gap-2 bg-surface p-1 rounded-xl">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeRange === range ? 'bg-accent-primary text-white' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Growth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground-muted">User Growth</span>
            <GrowthIndicator value={data?.weeklyGrowth.users || 0} />
          </div>
          <p className="text-3xl font-bold">Users</p>
          <p className="text-sm text-foreground-muted">vs previous period</p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground-muted">Habit Growth</span>
            <GrowthIndicator value={data?.weeklyGrowth.habits || 0} />
          </div>
          <p className="text-3xl font-bold">Habits</p>
          <p className="text-sm text-foreground-muted">vs previous period</p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground-muted">Completion Growth</span>
            <GrowthIndicator value={data?.weeklyGrowth.completions || 0} />
          </div>
          <p className="text-3xl font-bold">Completions</p>
          <p className="text-sm text-foreground-muted">vs previous period</p>
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Target size={20} className="text-accent-primary" />
            <span className="text-foreground-muted">Avg Habits/User</span>
          </div>
          <p className="text-3xl font-bold">{data?.averages.habitsPerUser}</p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={20} className="text-accent-success" />
            <span className="text-foreground-muted">Avg Completions/User</span>
          </div>
          <p className="text-3xl font-bold">{data?.averages.completionsPerUser}</p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Flame size={20} className="text-orange-400" />
            <span className="text-foreground-muted">Avg Streak</span>
          </div>
          <p className="text-3xl font-bold">{data?.averages.avgStreak} days</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <h3 className="text-lg font-bold mb-4">Daily Activity</h3>
          <div className="h-48 flex items-end gap-1">
            {data?.dailyStats.slice(-14).map((day, i) => {
              const maxCompletions = Math.max(...(data?.dailyStats.map(d => d.completions) || [1]))
              const height = (day.completions / maxCompletions) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-accent-primary/80 rounded-t transition-all hover:bg-accent-primary"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.date}: ${day.completions} completions`}
                  />
                  <span className="text-[10px] text-foreground-muted rotate-45 origin-left">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
          <h3 className="text-lg font-bold mb-4">Habits by Category</h3>
          <div className="space-y-3">
            {data?.categoryBreakdown.map((cat) => {
              const total = data.categoryBreakdown.reduce((sum, c) => sum + c.count, 0)
              const percentage = total ? Math.round((cat.count / total) * 100) : 0
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{cat.category}</span>
                    <span className="text-foreground-muted">{cat.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${categoryColors[cat.category] || 'bg-gray-500'} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Habits */}
      <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
        <h3 className="text-lg font-bold mb-4">Top 10 Most Completed Habits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.topHabits.map((habit, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-background text-foreground-muted'
                }`}>
                  {i + 1}
                </span>
                <span className="font-medium truncate">{habit.name}</span>
              </div>
              <span className="text-accent-primary font-bold">{habit.completions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
