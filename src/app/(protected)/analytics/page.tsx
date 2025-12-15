'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  BarChart3, TrendingUp, Calendar, Target, Clock, Zap,
  Users, Award, Activity, PieChart, LineChart, BarChart,
  Filter, Download, RefreshCw, ChevronDown, Check,
  ArrowUp, ArrowDown, Minus, Eye, EyeOff
} from 'lucide-react'
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line,
  PieChart as RechartsPieChart, Cell, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts'

interface AnalyticsData {
  habitStats: {
    totalHabits: number
    activeHabits: number
    completionRate: number
    streakData: { date: string; streak: number }[]
    categoryBreakdown: { category: string; count: number; completion: number }[]
    weeklyTrends: { week: string; completed: number; total: number }[]
    monthlyProgress: { month: string; percentage: number; habits: number }[]
  }
  timeAnalysis: {
    dailyPatterns: { hour: number; activities: number }[]
    weekdayDistribution: { day: string; completion: number }[]
    focusSessionStats: { date: string; minutes: number; sessions: number }[]
    productivityScore: number
  }
  achievements: {
    totalXP: number
    level: number
    badges: { name: string; earned: boolean; date?: string }[]
    milestones: { title: string; progress: number; target: number }[]
  }
  insights: {
    bestPerformingHabits: { name: string; rate: number; category: string }[]
    improvementAreas: { name: string; rate: number; suggestion: string }[]
    correlations: { habit1: string; habit2: string; correlation: number }[]
    predictions: { habit: string; predictedRate: number; confidence: number }[]
  }
}

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316'
}

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.purple]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['habits', 'time', 'achievements'])
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setRefreshing(true)

      // Calculate date ranges
      const endDate = new Date()
      const startDate = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      startDate.setDate(endDate.getDate() - days)

      // Fetch habits data
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)

      // Fetch habit logs
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*, habits!inner(*)')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      // Process habit statistics
      const habitStats = processHabitStats(habits || [], logs || [])
      
      // Process time analysis
      const timeAnalysis = processTimeAnalysis(logs || [])
      
      // Process achievements (mock data for now)
      const achievements = processAchievements(habits || [], logs || [])
      
      // Generate insights
      const insights = generateInsights(habits || [], logs || [])

      setData({
        habitStats,
        timeAnalysis,
        achievements,
        insights
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const processHabitStats = (habits: any[], logs: any[]) => {
    const totalHabits = habits.length
    const activeHabits = habits.filter(h => h.is_active).length
    
    // Calculate completion rate
    const completedLogs = logs.filter(log => log.completed).length
    const completionRate = logs.length > 0 ? (completedLogs / logs.length) * 100 : 0

    // Generate streak data (last 30 days)
    const streakData = generateStreakData(logs)
    
    // Category breakdown
    const categoryBreakdown = generateCategoryBreakdown(habits, logs)
    
    // Weekly trends
    const weeklyTrends = generateWeeklyTrends(logs)
    
    // Monthly progress
    const monthlyProgress = generateMonthlyProgress(logs)

    return {
      totalHabits,
      activeHabits,
      completionRate,
      streakData,
      categoryBreakdown,
      weeklyTrends,
      monthlyProgress
    }
  }

  const processTimeAnalysis = (logs: any[]) => {
    // Daily patterns (mock data - would need actual time tracking)
    const dailyPatterns = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activities: Math.floor(Math.random() * 10) + 1
    }))

    // Weekday distribution
    const weekdayDistribution = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      completion: Math.floor(Math.random() * 100)
    }))

    // Focus session stats (mock data)
    const focusSessionStats = generateFocusSessionData()

    return {
      dailyPatterns,
      weekdayDistribution,
      focusSessionStats,
      productivityScore: Math.floor(Math.random() * 40) + 60 // 60-100
    }
  }

  const processAchievements = (habits: any[], logs: any[]) => {
    const totalXP = logs.filter(log => log.completed).length * 10 // 10 XP per completion
    const level = Math.floor(totalXP / 100) + 1

    const badges = [
      { name: 'First Steps', earned: logs.length > 0, date: logs[0]?.created_at },
      { name: 'Consistent', earned: logs.length > 7 },
      { name: 'Dedicated', earned: logs.length > 30 },
      { name: 'Master', earned: logs.length > 100 },
      { name: 'Perfectionist', earned: logs.filter(l => l.completed).length === logs.length && logs.length > 10 }
    ]

    const milestones = [
      { title: 'Complete 100 habits', progress: Math.min(logs.filter(l => l.completed).length, 100), target: 100 },
      { title: 'Maintain 30-day streak', progress: Math.min(calculateCurrentStreak(logs), 30), target: 30 },
      { title: 'Create 10 habits', progress: Math.min(habits.length, 10), target: 10 }
    ]

    return { totalXP, level, badges, milestones }
  }

  const generateInsights = (habits: any[], logs: any[]) => {
    // Best performing habits
    const habitPerformance = habits.map(habit => {
      const habitLogs = logs.filter(log => log.habit_id === habit.id)
      const completedLogs = habitLogs.filter(log => log.completed)
      const rate = habitLogs.length > 0 ? (completedLogs.length / habitLogs.length) * 100 : 0
      return { name: habit.name, rate, category: habit.category }
    }).sort((a, b) => b.rate - a.rate)

    const bestPerformingHabits = habitPerformance.slice(0, 5)
    const improvementAreas = habitPerformance.slice(-3).map(habit => ({
      ...habit,
      suggestion: generateSuggestion(habit.rate)
    }))

    // Mock correlations and predictions
    const correlations = generateMockCorrelations(habits)
    const predictions = generateMockPredictions(habits)

    return {
      bestPerformingHabits,
      improvementAreas,
      correlations,
      predictions
    }
  }

  // Helper functions
  const generateStreakData = (logs: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    return last30Days.map(date => {
      const dayLogs = logs.filter(log => log.date === date)
      const completed = dayLogs.filter(log => log.completed).length
      return { date, streak: completed }
    })
  }

  const generateCategoryBreakdown = (habits: any[], logs: any[]) => {
    const categories = [...new Set(habits.map(h => h.category))]
    return categories.map(category => {
      const categoryHabits = habits.filter(h => h.category === category)
      const categoryLogs = logs.filter(log => 
        categoryHabits.some(h => h.id === log.habit_id)
      )
      const completed = categoryLogs.filter(log => log.completed).length
      const completion = categoryLogs.length > 0 ? (completed / categoryLogs.length) * 100 : 0
      
      return {
        category: category || 'Uncategorized',
        count: categoryHabits.length,
        completion
      }
    })
  }

  const generateWeeklyTrends = (logs: any[]) => {
    const weeks = []
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date)
        return logDate >= weekStart && logDate <= weekEnd
      })
      
      weeks.unshift({
        week: `Week ${12 - i}`,
        completed: weekLogs.filter(log => log.completed).length,
        total: weekLogs.length
      })
    }
    return weeks
  }

  const generateMonthlyProgress = (logs: any[]) => {
    const months = []
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      
      const monthLogs = logs.filter(log => {
        const logDate = new Date(log.date)
        return logDate >= monthStart && logDate <= monthEnd
      })
      
      const completed = monthLogs.filter(log => log.completed).length
      const percentage = monthLogs.length > 0 ? (completed / monthLogs.length) * 100 : 0
      
      months.unshift({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        percentage,
        habits: monthLogs.length
      })
    }
    return months
  }

  const generateFocusSessionData = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toISOString().split('T')[0],
        minutes: Math.floor(Math.random() * 120) + 30,
        sessions: Math.floor(Math.random() * 5) + 1
      }
    })
  }

  const calculateCurrentStreak = (logs: any[]) => {
    // Simplified streak calculation
    const sortedLogs = logs
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = today
    
    for (const log of sortedLogs) {
      if (log.date === currentDate) {
        streak++
        const date = new Date(currentDate)
        date.setDate(date.getDate() - 1)
        currentDate = date.toISOString().split('T')[0]
      } else {
        break
      }
    }
    
    return streak
  }

  const generateSuggestion = (rate: number) => {
    if (rate < 30) return 'Try setting smaller, more achievable goals'
    if (rate < 50) return 'Consider adjusting the habit timing or frequency'
    if (rate < 70) return 'Add reminders or accountability partners'
    return 'Great progress! Keep up the momentum'
  }

  const generateMockCorrelations = (habits: any[]) => {
    if (habits.length < 2) return []
    return [
      { habit1: habits[0]?.name || 'Habit A', habit2: habits[1]?.name || 'Habit B', correlation: 0.75 },
      { habit1: habits[1]?.name || 'Habit B', habit2: habits[2]?.name || 'Habit C', correlation: -0.45 }
    ].filter(c => c.habit1 && c.habit2)
  }

  const generateMockPredictions = (habits: any[]) => {
    return habits.slice(0, 3).map(habit => ({
      habit: habit.name,
      predictedRate: Math.floor(Math.random() * 30) + 70,
      confidence: Math.floor(Math.random() * 20) + 80
    }))
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--background)] animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-[var(--background)] rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-[var(--background)] rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-[var(--background)] rounded-xl animate-pulse" />
              <div className="h-10 w-10 bg-[var(--background)] rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[var(--surface)]/50 p-6 rounded-2xl border border-[var(--border-subtle)]">
                <div className="h-4 w-20 bg-[var(--background)] rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-[var(--background)] rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-[var(--background)] rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[var(--surface)]/50 p-6 rounded-2xl border border-[var(--border-subtle)]">
                <div className="h-5 w-32 bg-[var(--background)] rounded animate-pulse mb-4" />
                <div className="h-64 bg-[var(--background)]/50 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-gradient-to-r from-[var(--surface)]/80 to-[var(--surface)]/40 rounded-2xl border border-[var(--border-subtle)] backdrop-blur-sm animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent-primary)]">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                Advanced <span className="text-[var(--accent-primary)]">Analytics</span>
              </h1>
              <p className="text-[var(--foreground-muted)] text-sm mt-0.5">
                Deep insights into your habits and productivity patterns
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <button 
              onClick={fetchAnalyticsData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--accent-primary)]/50 transition disabled:opacity-50 text-sm"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
              <MetricCard
                title="Total Habits"
                value={data.habitStats.totalHabits}
                change={+12}
                icon={Target}
                color="text-blue-500"
              />
              <MetricCard
                title="Completion Rate"
                value={`${data.habitStats.completionRate.toFixed(1)}%`}
                change={+5.2}
                icon={TrendingUp}
                color="text-green-500"
              />
              <MetricCard
                title="Current Level"
                value={data.achievements.level}
                change={+1}
                icon={Award}
                color="text-purple-500"
              />
              <MetricCard
                title="Productivity Score"
                value={data.timeAnalysis.productivityScore}
                change={+8}
                icon={Zap}
                color="text-orange-500"
              />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Habit Completion Trends */}
              <ChartCard title="Habit Completion Trends" icon={LineChart}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.habitStats.streakData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--foreground-muted)"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                    />
                    <YAxis stroke="var(--foreground-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--surface)', 
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="streak" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Category Performance */}
              <ChartCard title="Category Performance" icon={PieChart}>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.habitStats.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="completion"
                      label={(entry: any) => `${entry.category}: ${entry.completion.toFixed(1)}%`}
                    >
                      {data.habitStats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Weekly Trends */}
              <ChartCard title="Weekly Progress Trends" icon={BarChart}>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.habitStats.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="week" stroke="var(--foreground-muted)" fontSize={12} />
                    <YAxis stroke="var(--foreground-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--surface)', 
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="completed" fill={COLORS.success} />
                    <Bar dataKey="total" fill={COLORS.info} opacity={0.3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Daily Activity Patterns */}
              <ChartCard title="Daily Activity Patterns" icon={Activity}>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={data.timeAnalysis.dailyPatterns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="var(--foreground-muted)"
                      fontSize={12}
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis stroke="var(--foreground-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--surface)', 
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => `${value}:00`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activities" 
                      stroke={COLORS.orange} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.orange, strokeWidth: 2, r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Insights and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Best Performing Habits */}
              <InsightCard title="Top Performing Habits" icon={Award}>
                <div className="space-y-3">
                  {data.insights.bestPerformingHabits.map((habit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{habit.name}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">{habit.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">{habit.rate.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </InsightCard>

              {/* Improvement Areas */}
              <InsightCard title="Improvement Opportunities" icon={TrendingUp}>
                <div className="space-y-3">
                  {data.insights.improvementAreas.map((area, index) => (
                    <div key={index} className="p-3 bg-[var(--background)] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{area.name}</p>
                        <p className="text-xs text-orange-500">{area.rate.toFixed(1)}%</p>
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)]">{area.suggestion}</p>
                    </div>
                  ))}
                </div>
              </InsightCard>

              {/* Achievements Progress */}
              <InsightCard title="Achievement Progress" icon={Target}>
                <div className="space-y-4">
                  {data.achievements.milestones.map((milestone, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{milestone.title}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {milestone.progress}/{milestone.target}
                        </p>
                      </div>
                      <div className="w-full bg-[var(--background)] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </InsightCard>
            </div>

            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Habit Correlations */}
              <ChartCard title="Habit Correlations" icon={Activity}>
                <div className="space-y-4">
                  {data.insights.correlations.map((corr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{corr.habit1} ↔ {corr.habit2}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {corr.correlation > 0 ? 'Positive' : 'Negative'} correlation
                        </p>
                      </div>
                      <div className={`font-bold ${corr.correlation > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Predictions */}
              <ChartCard title="AI Predictions" icon={TrendingUp}>
                <div className="space-y-4">
                  {data.insights.predictions.map((pred, index) => (
                    <div key={index} className="p-3 bg-[var(--background)] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{pred.habit}</p>
                        <p className="font-bold text-blue-500">{pred.predictedRate}%</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--foreground-muted)]">Next 30 days</p>
                        <p className="text-xs text-green-500">{pred.confidence}% confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Component definitions continue in next part...

// Supporting Components

function TimeRangeSelector({ value, onChange }: { value: string; onChange: (value: any) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const options = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ]
  
  const selectedOption = options.find(opt => opt.value === value)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--accent-primary)]/50 transition text-sm"
      >
        <Calendar size={16} />
        {selectedOption?.label}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-10 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--background)] transition first:rounded-t-xl last:rounded-b-xl ${
                value === option.value ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : ''
              }`}
            >
              {option.label}
              {value === option.value && <Check size={14} className="float-right mt-0.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string | number
  change: number
  icon: any
  color: string 
}) {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 transition">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--foreground-muted)]">{title}</p>
        <Icon size={20} className={color} />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(change)}%
        </div>
      </div>
    </div>
  )
}

function ChartCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border-subtle)] animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-[var(--accent-primary)]" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InsightCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border-subtle)] animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out delay-100">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-[var(--accent-primary)]" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}