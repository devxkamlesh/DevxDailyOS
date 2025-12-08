'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, Calendar, Target, Download, 
  BarChart3, Activity, Zap, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts'

interface HeatmapData {
  date: string
  count: number
  level: number
}

interface WeeklyComparison {
  week: string
  completed: number
  total: number
  percentage: number
}

interface CategoryStats {
  category: string
  completed: number
  total: number
  percentage: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [weeklyComparison, setWeeklyComparison] = useState<WeeklyComparison[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [timeRange, setTimeRange] = useState<'1week' | '1month' | '3months' | '6months' | '1year'>('1month')
  const [dynamicTrendData, setDynamicTrendData] = useState<{ label: string; percentage: number; completed: number; total: number }[]>([])
  const [stats, setStats] = useState({
    totalCompletions: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageDaily: 0,
    bestDay: '',
    mostProductiveTime: '',
    weekOverWeekGrowth: 0,
    monthOverMonthGrowth: 0
  })
  const [analytics, setAnalytics] = useState({
    weekly: { completed: 0, total: 0, percentage: 0 },
    monthly: { completed: 0, total: 0, percentage: 0 },
    yearly: { completed: 0, total: 0, percentage: 0 }
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const daysBack = timeRange === '1week' ? 7 : timeRange === '1month' ? 30 : timeRange === '3months' ? 90 : timeRange === '6months' ? 180 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch active habits count
    const { data: habits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const activeHabitsCount = habits?.length || 1

    // Fetch all habit logs
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*, habits(name, category)')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (!logs) {
      setLoading(false)
      return
    }

    // Generate heatmap data
    const heatmap: HeatmapData[] = []
    const dateMap = new Map<string, number>()
    
    // Count completions per date
    logs.forEach(log => {
      if (log.completed) {
        // Normalize date format (handle both YYYY-MM-DD and ISO formats)
        const logDate = log.date.split('T')[0]
        dateMap.set(logDate, (dateMap.get(logDate) || 0) + 1)
      }
    })

    // Fill in all dates from startDate to today (inclusive)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    for (let i = 0; i <= daysBack; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      // Stop if we've passed today
      if (dateStr > todayStr) break
      
      const count = dateMap.get(dateStr) || 0
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4
      heatmap.push({ date: dateStr, count, level })
    }

    setHeatmapData(heatmap)

    // Calculate weekly comparison (last 8 weeks)
    const weeks: WeeklyComparison[] = []
    for (let i = 0; i < 8; i++) {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)
      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date)
        return logDate >= weekStart && logDate <= weekEnd
      })
      const completed = weekLogs.filter(log => log.completed).length
      const total = activeHabitsCount * 7 // Total habits for the week
      weeks.unshift({
        week: `Week ${8 - i}`,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      })
    }
    setWeeklyComparison(weeks)

    // Calculate dynamic trend data based on time range
    // Total should be activeHabitsCount * number of days in period
    const dynamicData: { label: string; percentage: number; completed: number; total: number }[] = []
    
    if (timeRange === '1week') {
      // Show daily data for 1 week - total = activeHabitsCount per day
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayLogs = logs.filter(log => log.date === dateStr)
        const completed = dayLogs.filter(log => log.completed).length
        const total = activeHabitsCount // Total habits per day
        dynamicData.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        })
      }
    } else if (timeRange === '1month') {
      // Show daily data grouped by ~4 day periods (8 data points)
      const periodDays = 4
      for (let i = 7; i >= 0; i--) {
        const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000)
        const periodStart = new Date(periodEnd.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000)
        const periodLogs = logs.filter(log => {
          const logDate = new Date(log.date)
          return logDate >= periodStart && logDate <= periodEnd
        })
        const completed = periodLogs.filter(log => log.completed).length
        const total = activeHabitsCount * periodDays // Total habits for the period
        dynamicData.push({
          label: periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        })
      }
    } else if (timeRange === '3months') {
      // Show weekly data (12 weeks)
      for (let i = 11; i >= 0; i--) {
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)
        const weekLogs = logs.filter(log => {
          const logDate = new Date(log.date)
          return logDate >= weekStart && logDate <= weekEnd
        })
        const completed = weekLogs.filter(log => log.completed).length
        const total = activeHabitsCount * 7 // Total habits for the week
        dynamicData.push({
          label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        })
      }
    } else if (timeRange === '6months') {
      // Show bi-weekly data (12 data points)
      for (let i = 11; i >= 0; i--) {
        const periodEnd = new Date(now.getTime() - i * 14 * 24 * 60 * 60 * 1000)
        const periodStart = new Date(periodEnd.getTime() - 13 * 24 * 60 * 60 * 1000)
        const periodLogs = logs.filter(log => {
          const logDate = new Date(log.date)
          return logDate >= periodStart && logDate <= periodEnd
        })
        const completed = periodLogs.filter(log => log.completed).length
        const total = activeHabitsCount * 14 // Total habits for 2 weeks
        dynamicData.push({
          label: periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        })
      }
    } else {
      // 1 year - show monthly data (12 months)
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const daysInMonth = monthEnd.getDate()
        const monthLogs = logs.filter(log => {
          const logDate = new Date(log.date)
          return logDate >= monthDate && logDate <= monthEnd
        })
        const completed = monthLogs.filter(log => log.completed).length
        const total = activeHabitsCount * daysInMonth // Total habits for the month
        dynamicData.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        })
      }
    }
    setDynamicTrendData(dynamicData)

    // Calculate category stats
    const categoryMap = new Map<string, { completed: number; total: number }>()
    logs.forEach(log => {
      const category = log.habits?.category || 'other'
      const stats = categoryMap.get(category) || { completed: 0, total: 0 }
      stats.total++
      if (log.completed) stats.completed++
      categoryMap.set(category, stats)
    })

    const categories: CategoryStats[] = []
    categoryMap.forEach((stats, category) => {
      categories.push({
        category,
        completed: stats.completed,
        total: stats.total,
        percentage: Math.round((stats.completed / stats.total) * 100)
      })
    })
    setCategoryStats(categories.sort((a, b) => b.percentage - a.percentage))

    // Calculate general stats
    const completedLogs = logs.filter(log => log.completed)
    const totalCompletions = completedLogs.length
    const averageDaily = Math.round(totalCompletions / daysBack * 10) / 10

    // Calculate streaks
    const sortedDates = [...new Set(logs.map(log => log.date))].sort().reverse()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i]
      const dayLogs = logs.filter(log => log.date === date && log.completed)
      
      if (dayLogs.length > 0) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        if (i === 0) currentStreak = 0
        tempStreak = 0
      }
    }

    // Find best day
    const dayOfWeekMap = new Map<string, number>()
    completedLogs.forEach(log => {
      const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })
      dayOfWeekMap.set(day, (dayOfWeekMap.get(day) || 0) + 1)
    })
    const bestDay = Array.from(dayOfWeekMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    // Calculate growth
    const lastWeek = weeks[weeks.length - 1]
    const prevWeek = weeks[weeks.length - 2]
    const weekOverWeekGrowth = prevWeek ? lastWeek.percentage - prevWeek.percentage : 0

    const lastMonth = weeks.slice(-4).reduce((sum, w) => sum + w.percentage, 0) / 4
    const prevMonth = weeks.slice(-8, -4).reduce((sum, w) => sum + w.percentage, 0) / 4
    const monthOverMonthGrowth = Math.round(lastMonth - prevMonth)

    // Calculate weekly, monthly, yearly analytics (using activeHabits * days for total)
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return logDate >= weekAgo && logDate <= now
    })
    const weekCompleted = weekLogs.filter(log => log.completed).length
    const weekTotal = activeHabitsCount * 7

    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.date)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return logDate >= monthAgo && logDate <= now
    })
    const monthCompleted = monthLogs.filter(log => log.completed).length
    const monthTotal = activeHabitsCount * 30

    const yearCompleted = completedLogs.length
    const yearTotal = activeHabitsCount * 365

    setAnalytics({
      weekly: {
        completed: weekCompleted,
        total: weekTotal,
        percentage: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
      },
      monthly: {
        completed: monthCompleted,
        total: monthTotal,
        percentage: monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0
      },
      yearly: {
        completed: yearCompleted,
        total: yearTotal,
        percentage: yearTotal > 0 ? Math.round((yearCompleted / yearTotal) * 100) : 0
      }
    })

    setStats({
      totalCompletions,
      currentStreak,
      longestStreak,
      averageDaily,
      bestDay,
      mostProductiveTime: 'Morning', // Could be calculated from habit categories
      weekOverWeekGrowth: Math.round(weekOverWeekGrowth),
      monthOverMonthGrowth
    })

    setLoading(false)
  }

  const exportToPDF = () => {
    alert('PDF export feature coming soon!')
  }

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Completions'],
      ...heatmapData.map(d => [d.date, d.count.toString()])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-zinc-900/50 border border-zinc-800'
      case 1: return 'bg-emerald-500/30 border border-emerald-500/40'
      case 2: return 'bg-emerald-500/50 border border-emerald-500/60'
      case 3: return 'bg-emerald-500/70 border border-emerald-500/80'
      case 4: return 'bg-emerald-500 border border-emerald-400'
      default: return 'bg-zinc-900/50 border border-zinc-800'
    }
  }

  const getWeeksArray = () => {
    if (heatmapData.length === 0) return []
    
    const weeks: HeatmapData[][] = []
    
    // Group by weeks (Sunday to Saturday)
    const grouped: { [key: string]: HeatmapData[] } = {}
    
    heatmapData.forEach(day => {
      if (!day.date) return
      
      const date = new Date(day.date + 'T12:00:00') // Add time to avoid timezone issues
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Get Sunday of that week
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = Array(7).fill(null).map(() => ({ date: '', count: 0, level: 0 }))
      }
      
      const dayOfWeek = date.getDay()
      grouped[weekKey][dayOfWeek] = day
    })
    
    // Convert to array and sort by week
    Object.keys(grouped).sort().forEach(weekKey => {
      weeks.push(grouped[weekKey])
    })
    
    return weeks
  }

  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = []
    const weeks = getWeeksArray()
    let lastMonth = ''
    
    weeks.forEach((week, index) => {
      const firstDay = week.find(d => d.date)
      if (firstDay && firstDay.date) {
        const date = new Date(firstDay.date + 'T12:00:00') // Add time to avoid timezone issues
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        if (month !== lastMonth) {
          labels.push({ month, weekIndex: index })
          lastMonth = month
        }
      }
    })
    
    return labels
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-foreground-muted">Track your progress and identify patterns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-lg hover:border-accent-primary/50 transition"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex bg-surface rounded-lg p-1 w-fit">
        <button
          onClick={() => setTimeRange('1week')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            timeRange === '1week'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          1 Week
        </button>
        <button
          onClick={() => setTimeRange('1month')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            timeRange === '1month'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          1 Month
        </button>
        <button
          onClick={() => setTimeRange('3months')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            timeRange === '3months'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          3 Months
        </button>
        <button
          onClick={() => setTimeRange('6months')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            timeRange === '6months'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          6 Months
        </button>
        <button
          onClick={() => setTimeRange('1year')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            timeRange === '1year'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          1 Year
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface p-6 rounded-2xl border border-border-subtle animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-background rounded-lg" />
                  <div className="w-16 h-8 bg-background rounded" />
                </div>
                <div className="h-5 bg-background rounded w-32 mb-2" />
                <div className="h-4 bg-background rounded w-24" />
              </div>
            ))}
          </div>
          {/* Graph Skeleton */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-background rounded w-40" />
              <div className="h-6 bg-background rounded w-32" />
            </div>
            <div className="h-64 bg-background rounded-lg" />
          </div>
          {/* Weekly Skeleton */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle animate-pulse">
            <div className="h-6 bg-background rounded w-48 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-background rounded w-16" />
                    <div className="h-4 bg-background rounded w-24" />
                  </div>
                  <div className="h-3 bg-background rounded-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-accent-success/10 to-accent-success/5 p-6 rounded-2xl border border-accent-success/20">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-accent-success/20 rounded-lg">
                  <Target size={24} className="text-accent-success" />
                </div>
                <span className="text-3xl font-bold text-accent-success">{stats.totalCompletions}</span>
              </div>
              <h3 className="font-semibold mb-1">Total Completions</h3>
              <p className="text-sm text-foreground-muted">{stats.averageDaily} per day average</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-6 rounded-2xl border border-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Zap size={24} className="text-orange-500" />
                </div>
                <span className="text-3xl font-bold text-orange-500">{stats.currentStreak}</span>
              </div>
              <h3 className="font-semibold mb-1">Current Streak</h3>
              <p className="text-sm text-foreground-muted">Best: {stats.longestStreak} days</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 rounded-2xl border border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp size={24} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-1">
                  {stats.weekOverWeekGrowth >= 0 ? (
                    <ArrowUp size={20} className="text-accent-success" />
                  ) : (
                    <ArrowDown size={20} className="text-red-400" />
                  )}
                  <span className={`text-3xl font-bold ${stats.weekOverWeekGrowth >= 0 ? 'text-accent-success' : 'text-red-400'}`}>
                    {Math.abs(stats.weekOverWeekGrowth)}%
                  </span>
                </div>
              </div>
              <h3 className="font-semibold mb-1">Week over Week</h3>
              <p className="text-sm text-foreground-muted">
                {stats.weekOverWeekGrowth >= 0 ? 'Growth' : 'Decline'} in completion rate
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-6 rounded-2xl border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar size={24} className="text-purple-500" />
                </div>
                <span className="text-2xl font-bold text-purple-500">{stats.bestDay}</span>
              </div>
              <h3 className="font-semibold mb-1">Best Day</h3>
              <p className="text-sm text-foreground-muted">Most productive day of week</p>
            </div>
          </div>

          {/* Dynamic Trend Chart - Recharts */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-bold mb-6">
              {timeRange === '1week' ? 'Daily Completion Trend' : 
               timeRange === '1month' ? 'Monthly Completion Trend' :
               timeRange === '3months' ? 'Weekly Completion Trend (3 Months)' :
               timeRange === '6months' ? 'Bi-Weekly Completion Trend' :
               'Monthly Completion Trend (1 Year)'}
            </h2>
            <div className="h-72 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} fill="url(#weeklyGradient)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Performance - Radial Chart */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-bold mb-6">Category Performance</h2>
            {categoryStats.length > 0 ? (
              <div className="h-96 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="20%" 
                    outerRadius="90%" 
                    data={categoryStats.map((cat, idx) => ({
                      ...cat,
                      fill: ['#6366f1', '#22c55e', '#eab308', '#f97316', '#ec4899', '#8b5cf6'][idx % 6]
                    }))}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="percentage"
                      cornerRadius={10}
                      label={{ position: 'insideStart', fill: '#fff', fontSize: 14 }}
                    />
                    <Legend 
                      iconSize={12}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      formatter={(value, entry: any) => (
                        <span className="text-sm">
                          {entry.payload.category}: {entry.payload.percentage}% ({entry.payload.completed}/{entry.payload.total})
                        </span>
                      )}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                      labelStyle={{ color: '#ffffff' }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value}% (${props.payload.completed}/${props.payload.total})`,
                        props.payload.category
                      ]}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-foreground-muted">
                No category data available
              </div>
            )}
          </div>

          {/* Pie Chart - Completion Distribution */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-bold mb-6">Completion Distribution</h2>
            <div className="h-72 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Weekly', value: analytics.weekly.percentage, fill: '#22c55e' },
                      { name: 'Monthly', value: analytics.monthly.percentage, fill: '#6366f1' },
                      { name: 'Yearly', value: analytics.yearly.percentage, fill: '#eab308' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#6366f1" />
                    <Cell fill="#eab308" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Multi-Line Comparison Chart */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-bold mb-6">Completed vs Total</h2>
            <div className="h-72 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} name="Completed" />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Heatmap - Redesigned */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Activity Heatmap</h2>
                <p className="text-sm text-foreground-muted">
                  {heatmapData.filter(d => d.count > 0).length} active days in the last {timeRange === '1week' ? '7 days' : timeRange === '1month' ? 'month' : timeRange === '3months' ? '3 months' : timeRange === '6months' ? '6 months' : 'year'}
                  {heatmapData.filter(d => d.count > 0).length === 0 && ' - Start completing habits to see your activity!'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-foreground-muted">Less</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map(level => (
                    <div 
                      key={level} 
                      className={`w-5 h-5 rounded ${getHeatmapColor(level)} transition-transform hover:scale-110`}
                      title={`Level ${level}: ${level === 0 ? 'No activity' : level === 1 ? '1-2 completions' : level === 2 ? '3-4 completions' : level === 3 ? '5-6 completions' : '7+ completions'}`}
                    />
                  ))}
                </div>
                <span className="text-foreground-muted">More</span>
              </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
              <div className="inline-block">
                {/* Month labels */}
                <div className="flex gap-1 mb-2 ml-8">
                  {getMonthLabels().map((label, idx) => (
                    <div 
                      key={idx}
                      className="text-xs text-foreground-muted"
                      style={{ marginLeft: idx === 0 ? 0 : `${(label.weekIndex - (getMonthLabels()[idx - 1]?.weekIndex || 0)) * 16}px` }}
                    >
                      {label.month}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap grid */}
                <div className="flex gap-1">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 justify-start pt-0.5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <div 
                        key={day} 
                        className={`text-xs text-foreground-muted h-3.5 flex items-center ${idx % 2 === 1 ? '' : 'opacity-0'}`}
                      >
                        {idx % 2 === 1 ? day : ''}
                      </div>
                    ))}
                  </div>
                  
                  {/* Weeks */}
                  <div className="flex gap-1">
                    {getWeeksArray().map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-3.5 h-3.5 rounded transition-all ${
                              day.date 
                                ? `${getHeatmapColor(day.level)} hover:scale-125 hover:shadow-lg cursor-pointer` 
                                : 'bg-transparent'
                            }`}
                            title={day.date ? `${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}\n${day.count} completion${day.count !== 1 ? 's' : ''}` : ''}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-foreground-muted mb-1">Total Active Days</div>
                  <div className="text-xl font-bold text-accent-success">
                    {heatmapData.filter(d => d.count > 0).length || stats.totalCompletions > 0 ? heatmapData.filter(d => d.count > 0).length : stats.totalCompletions}
                  </div>
                </div>
                <div>
                  <div className="text-foreground-muted mb-1">Best Day</div>
                  <div className="text-xl font-bold text-accent-primary">
                    {heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 0}
                  </div>
                </div>
                <div>
                  <div className="text-foreground-muted mb-1">Average/Day</div>
                  <div className="text-xl font-bold text-yellow-500">
                    {heatmapData.length > 0 ? (heatmapData.reduce((sum, d) => sum + d.count, 0) / heatmapData.length).toFixed(1) : '0.0'}
                  </div>
                </div>
                <div>
                  <div className="text-foreground-muted mb-1">Completion Rate</div>
                  <div className="text-xl font-bold text-purple-500">
                    {Math.round((heatmapData.filter(d => d.count > 0).length / heatmapData.length) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Circular Progress Charts */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-bold mb-6">Completion Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#111111" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray={`${(analytics.weekly.percentage / 100) * 351.86} 351.86`} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold text-accent-success">{analytics.weekly.percentage}%</div>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">This Week</h3>
                <p className="text-sm text-foreground-muted">{analytics.weekly.completed} / {analytics.weekly.total}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#111111" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#6366f1" strokeWidth="12" strokeDasharray={`${(analytics.monthly.percentage / 100) * 351.86} 351.86`} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold text-accent-primary">{analytics.monthly.percentage}%</div>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">This Month</h3>
                <p className="text-sm text-foreground-muted">{analytics.monthly.completed} / {analytics.monthly.total}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#111111" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#eab308" strokeWidth="12" strokeDasharray={`${(analytics.yearly.percentage / 100) * 351.86} 351.86`} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold text-yellow-500">{analytics.yearly.percentage}%</div>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">This Year</h3>
                <p className="text-sm text-foreground-muted">{analytics.yearly.completed} / {analytics.yearly.total}</p>
              </div>
            </div>
          </div>

          {/* Day of Week Analysis */}
          <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
            <h2 className="text-xl font-bold mb-6">Success Rate by Day of Week</h2>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                const dayData = heatmapData.filter(d => {
                  if (!d.date) return false
                  const date = new Date(d.date + 'T12:00:00')
                  return date.getDay() === index
                })
                const totalDays = dayData.length || 1
                const activeDays = dayData.filter(d => d.count > 0).length
                const percentage = Math.round((activeDays / totalDays) * 100)
                const avgCompletions = dayData.length > 0 
                  ? (dayData.reduce((sum, d) => sum + d.count, 0) / dayData.length).toFixed(1)
                  : '0'
                
                return (
                  <div key={day} className="text-center p-3 bg-background rounded-xl">
                    <div className="text-sm font-medium text-foreground-muted mb-2">{day}</div>
                    <div className={`text-2xl font-bold mb-1 ${
                      percentage >= 80 ? 'text-accent-success' :
                      percentage >= 60 ? 'text-blue-500' :
                      percentage >= 40 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {percentage}%
                    </div>
                    <div className="text-xs text-foreground-muted">
                      ~{avgCompletions}/day
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-surface rounded-2xl p-6 border border-accent-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent-primary/20 rounded-lg">
                <BarChart3 size={24} className="text-accent-primary" />
              </div>
              <h2 className="text-xl font-bold">Key Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface/50 p-4 rounded-xl">
                <h3 className="font-semibold mb-2">📈 Productivity Trend</h3>
                <p className="text-sm text-foreground-muted">
                  Your completion rate is {stats.monthOverMonthGrowth >= 0 ? 'up' : 'down'} {Math.abs(stats.monthOverMonthGrowth)}% 
                  compared to last month. {stats.monthOverMonthGrowth >= 0 ? 'Keep up the great work!' : 'Let\'s get back on track!'}
                </p>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl">
                <h3 className="font-semibold mb-2">⭐ Best Performance</h3>
                <p className="text-sm text-foreground-muted">
                  You're most consistent on {stats.bestDay}s. Consider scheduling important habits on this day.
                </p>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl">
                <h3 className="font-semibold mb-2">🔥 Streak Status</h3>
                <p className="text-sm text-foreground-muted">
                  Current streak: {stats.currentStreak} days. 
                  {stats.currentStreak >= stats.longestStreak 
                    ? ' New personal record!' 
                    : ` ${stats.longestStreak - stats.currentStreak} days to beat your record!`}
                </p>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl">
                <h3 className="font-semibold mb-2">💡 Recommendation</h3>
                <p className="text-sm text-foreground-muted">
                  {categoryStats.length > 0 && categoryStats[categoryStats.length - 1].percentage < 50
                    ? `Focus on improving your ${categoryStats[categoryStats.length - 1].category} habits.`
                    : 'Great balance across all categories! Keep it up!'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
