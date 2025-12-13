'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Activity, TrendingUp, BarChart3, Zap, Calendar, 
  Target, Users, Clock, Brain, Sparkles
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
  LineChart,
  Line,
  Legend,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { useChartEngine } from '@/lib/useChartEngine'

interface AdvancedMetrics {
  habitCorrelations: Array<{
    habit1: string
    habit2: string
    correlation: number
    strength: 'weak' | 'moderate' | 'strong'
  }>
  timePatterns: Array<{
    hour: number
    completions: number
    successRate: number
    avgFocusTime: number
  }>
  streakAnalysis: Array<{
    date: string
    streakLength: number
    category: string
    momentum: number
  }>
  performanceZones: Array<{
    date: string
    productivity: number
    energy: number
    mood: number
    zone: 'peak' | 'good' | 'average' | 'low'
  }>
  categoryInsights: Array<{
    category: string
    avgCompletionTime: number
    bestTimeOfDay: string
    consistencyScore: number
    trendDirection: 'up' | 'down' | 'stable'
  }>
}

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [chartDataLoading, setChartDataLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1month' | '3months' | '6months' | '1year'>('3months')
  const [metrics, setMetrics] = useState<AdvancedMetrics>({
    habitCorrelations: [],
    timePatterns: [],
    streakAnalysis: [],
    performanceZones: [],
    categoryInsights: []
  })
  
  const supabase = createClient()
  
  // Use chart engine with real data
  const {
    getSimpleAreaChart,
    getFillByValueChart,
    getComposedChart,
    getBandedChart,
    loading: chartLoading,
    initializeEngine,
    refreshCharts
  } = useChartEngine({ 
    useRealData: true,
    timeRange 
  })

  const fetchAdvancedMetrics = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Calculate date range
      const now = new Date()
      const daysBack = timeRange === '1month' ? 30 : 
                      timeRange === '3months' ? 90 : 
                      timeRange === '6months' ? 180 : 365
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

      // Fetch habit logs with time tracking data
      const { data: logs } = await supabase
        .from('habit_logs')
        .select(`
          *,
          habits(name, category, target_unit)
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!logs) {
        setLoading(false)
        return
      }

      // Process habit correlations
      const habitCorrelations = calculateHabitCorrelations(logs)
      
      // Process time patterns
      const timePatterns = calculateTimePatterns(logs)
      
      // Process streak analysis
      const streakAnalysis = calculateStreakAnalysis(logs)
      
      // Process performance zones
      const performanceZones = calculatePerformanceZones(logs)
      
      // Process category insights
      const categoryInsights = calculateCategoryInsights(logs)

      setMetrics({
        habitCorrelations,
        timePatterns,
        streakAnalysis,
        performanceZones,
        categoryInsights
      })

    } catch (error) {
      console.error('Error fetching advanced metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange, supabase])

  useEffect(() => {
    fetchAdvancedMetrics()
    initializeEngine()
  }, [fetchAdvancedMetrics, initializeEngine])

  const calculateHabitCorrelations = (logs: any[]) => {
    // Group logs by date
    const dateGroups = logs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = []
      acc[log.date].push(log)
      return acc
    }, {})

    const habits = [...new Set(logs.map(log => log.habits?.name).filter(Boolean))]
    const correlations: any[] = []

    // Calculate correlations between habits
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const habit1 = habits[i]
        const habit2 = habits[j]
        
        let coCompletions = 0
        let totalDays = 0
        
        Object.values(dateGroups).forEach((dayLogs: any) => {
          const habit1Completed = dayLogs.some((log: any) => log.habits?.name === habit1 && log.completed)
          const habit2Completed = dayLogs.some((log: any) => log.habits?.name === habit2 && log.completed)
          
          if (habit1Completed && habit2Completed) coCompletions++
          totalDays++
        })
        
        const correlation = totalDays > 0 ? (coCompletions / totalDays) * 100 : 0
        const strength = correlation > 70 ? 'strong' : correlation > 40 ? 'moderate' : 'weak'
        
        correlations.push({
          habit1,
          habit2,
          correlation: Math.round(correlation),
          strength
        })
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation).slice(0, 10)
  }

  const calculateTimePatterns = (logs: any[]) => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      completions: 0,
      total: 0,
      focusTime: 0
    }))

    logs.forEach(log => {
      if (log.completed_at) {
        const hour = new Date(log.completed_at).getHours()
        hourlyData[hour].completions += log.completed ? 1 : 0
        hourlyData[hour].total += 1
        hourlyData[hour].focusTime += log.duration_minutes || 0
      }
    })

    return hourlyData.map(data => ({
      hour: data.hour,
      completions: data.completions,
      successRate: data.total > 0 ? Math.round((data.completions / data.total) * 100) : 0,
      avgFocusTime: data.total > 0 ? Math.round(data.focusTime / data.total) : 0
    })).filter((_, index) => hourlyData[index].total > 0)
  }

  const calculateStreakAnalysis = (logs: any[]) => {
    const streakData: any[] = []
    const categories = [...new Set(logs.map(log => log.habits?.category).filter(Boolean))]
    
    categories.forEach(category => {
      const categoryLogs = logs.filter(log => log.habits?.category === category && log.completed)
      let currentStreak = 0
      let momentum = 0
      
      categoryLogs.forEach((log, index) => {
        if (log.completed) {
          currentStreak++
          momentum = index > 0 ? momentum + 1 : 1
        } else {
          if (currentStreak > 0) {
            streakData.push({
              date: log.date,
              streakLength: currentStreak,
              category,
              momentum
            })
          }
          currentStreak = 0
          momentum = 0
        }
      })
    })

    return streakData.slice(-30) // Last 30 streak events
  }

  const calculatePerformanceZones = (logs: any[]) => {
    const dailyPerformance = logs.reduce((acc, log) => {
      if (!acc[log.date]) {
        acc[log.date] = {
          date: log.date,
          completions: 0,
          totalHabits: 0,
          focusTime: 0,
          focusScore: 0
        }
      }
      
      acc[log.date].totalHabits++
      if (log.completed) acc[log.date].completions++
      acc[log.date].focusTime += log.duration_minutes || 0
      acc[log.date].focusScore += log.focus_score || 0
      
      return acc
    }, {})

    return Object.values(dailyPerformance).map((day: any) => {
      const productivity = day.totalHabits > 0 ? (day.completions / day.totalHabits) * 100 : 0
      const energy = day.focusTime > 0 ? Math.min(100, (day.focusTime / 120) * 100) : 0 // Normalize to 2 hours
      const mood = day.focusScore > 0 ? (day.focusScore / day.completions) * 20 : 50 // Scale to 100
      
      let zone: 'peak' | 'good' | 'average' | 'low' = 'low'
      if (productivity > 80 && energy > 70 && mood > 70) zone = 'peak'
      else if (productivity > 60 && energy > 50 && mood > 50) zone = 'good'
      else if (productivity > 40 || energy > 30 || mood > 30) zone = 'average'
      
      return {
        date: day.date,
        productivity: Math.round(productivity),
        energy: Math.round(energy),
        mood: Math.round(mood),
        zone
      }
    }).slice(-30) // Last 30 days
  }

  const calculateCategoryInsights = (logs: any[]) => {
    const categories = [...new Set(logs.map(log => log.habits?.category).filter(Boolean))]
    
    return categories.map(category => {
      const categoryLogs = logs.filter(log => log.habits?.category === category)
      const completedLogs = categoryLogs.filter(log => log.completed)
      
      const avgCompletionTime = completedLogs.length > 0 
        ? completedLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / completedLogs.length
        : 0
      
      // Find best time of day
      const hourCounts = Array(24).fill(0)
      completedLogs.forEach(log => {
        if (log.completed_at) {
          const hour = new Date(log.completed_at).getHours()
          hourCounts[hour]++
        }
      })
      const bestHour = hourCounts.indexOf(Math.max(...hourCounts))
      const bestTimeOfDay = bestHour < 12 ? 'Morning' : bestHour < 17 ? 'Afternoon' : 'Evening'
      
      // Calculate consistency (completion rate over time)
      const consistencyScore = categoryLogs.length > 0 
        ? (completedLogs.length / categoryLogs.length) * 100
        : 0
      
      // Trend direction (last 7 days vs previous 7 days)
      const recent = categoryLogs.filter(log => {
        const logDate = new Date(log.date)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return logDate >= weekAgo
      })
      const previous = categoryLogs.filter(log => {
        const logDate = new Date(log.date)
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return logDate >= twoWeeksAgo && logDate < weekAgo
      })
      
      const recentRate = recent.length > 0 ? recent.filter(log => log.completed).length / recent.length : 0
      const previousRate = previous.length > 0 ? previous.filter(log => log.completed).length / previous.length : 0
      
      let trendDirection: 'up' | 'down' | 'stable' = 'stable'
      if (recentRate > previousRate + 0.1) trendDirection = 'up'
      else if (recentRate < previousRate - 0.1) trendDirection = 'down'
      
      return {
        category,
        avgCompletionTime: Math.round(avgCompletionTime),
        bestTimeOfDay,
        consistencyScore: Math.round(consistencyScore),
        trendDirection
      }
    })
  }

  // Chart data state - will be updated when chart engine refreshes
  const [chartData, setChartData] = useState<{
    habitTrendData: any[]
    performanceZoneData: any[]
    multiMetricData: any[]
  }>({
    habitTrendData: [],
    performanceZoneData: [],
    multiMetricData: []
  })

  // Update chart data when chart engine is ready and not loading
  useEffect(() => {
    if (!chartLoading) {
      setChartDataLoading(true)
      
      // Force refresh charts first
      refreshCharts()
      
      const habitTrendData = getSimpleAreaChart({
        chartId: 'habit_trend_real',
        xAxis: 'date',
        yAxis: ['completions'],
        aggregation: 'sum'
      })

      const performanceZoneData = getFillByValueChart({
        chartId: 'performance_zones_real',
        xAxis: 'date',
        yAxis: 'productivity',
        thresholds: [
          { min: -Infinity, max: 40, type: 'low', color: '#ef4444' },
          { min: 40, max: 70, type: 'average', color: '#eab308' },
          { min: 70, max: 85, type: 'good', color: '#22c55e' },
          { min: 85, max: Infinity, type: 'peak', color: '#10b981' }
        ]
      })

      const multiMetricData = getComposedChart({
        chartId: 'multi_metric_real',
        xAxis: 'date',
        series: [
          { type: 'bar', key: 'completions', color: '#22c55e' },
          { type: 'line', key: 'focusTime', color: '#6366f1' },
          { type: 'area', key: 'productivity', color: '#f97316' }
        ]
      })

      console.log('Updating chart data for timeRange:', timeRange, {
        habitTrendData: habitTrendData.length,
        performanceZoneData: performanceZoneData.length,
        multiMetricData: multiMetricData.length
      })
      
      setChartData({
        habitTrendData,
        performanceZoneData,
        multiMetricData
      })
      
      setChartDataLoading(false)
    }
  }, [chartLoading, timeRange, getSimpleAreaChart, getFillByValueChart, getComposedChart, refreshCharts])

  if (loading || chartLoading || chartDataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Advanced Analytics</h1>
            <p className="text-foreground-muted">Deep insights powered by real data</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl p-6 border border-border-subtle animate-pulse">
              <div className="h-6 bg-background rounded w-48 mb-4" />
              <div className="h-64 bg-background rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-foreground-muted">Deep insights powered by real habit data and AI analysis</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-surface rounded-lg p-1 relative">
          {(loading || chartLoading || chartDataLoading) && (
            <div className="absolute inset-0 bg-surface/80 rounded-lg flex items-center justify-center">
              <div className="animate-spin w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full"></div>
            </div>
          )}
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
      </div>

      {/* Advanced Chart Engine - Real Data */}
      <div key={timeRange} className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Activity size={24} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Chart Engine - Real Data</h2>
            <p className="text-sm text-foreground-muted">Powered by your actual habit completion data</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habit Completion Trend */}
          <div className="bg-surface/50 rounded-xl p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              Habit Completion Trend
            </h3>
            <div className="h-64 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.habitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="completions" stroke="#6366f1" strokeWidth={2} fill="url(#trendGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Zones */}
          <div className="bg-surface/50 rounded-xl p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-yellow-500" />
              Performance Zones
            </h3>
            <div className="h-64 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.performanceZoneData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value}%`,
                      `Performance (${props.payload.zone})`
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    fill="#22c55e"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Multi-Metric Dashboard */}
          <div className="bg-surface/50 rounded-xl p-4 lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-orange-500" />
              Multi-Metric Dashboard
            </h3>
            <div className="h-64 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.multiMetricData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="completions" fill="#22c55e" name="Completions" />
                  <Area yAxisId="right" type="monotone" dataKey="productivity" fill="#f97316" fillOpacity={0.3} stroke="#f97316" name="Productivity %" />
                  <Line yAxisId="right" type="monotone" dataKey="focusTime" stroke="#6366f1" strokeWidth={3} name="Focus Time (min)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Time Pattern Analysis */}
      <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock size={24} className="text-blue-500" />
          Time Pattern Analysis
        </h2>
        <div className="h-72 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.timePatterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="hour" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888888', fontSize: 10 }}
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px' }}
                labelFormatter={(hour) => `${hour}:00`}
                formatter={(value, name) => [
                  name === 'completions' ? `${value} completions` :
                  name === 'successRate' ? `${value}% success rate` :
                  `${value} min avg focus`,
                  name === 'completions' ? 'Completions' :
                  name === 'successRate' ? 'Success Rate' : 'Avg Focus Time'
                ]}
              />
              <Bar dataKey="completions" fill="#22c55e" name="completions" />
              <Bar dataKey="successRate" fill="#6366f1" name="successRate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habit Correlations */}
      <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Brain size={24} className="text-purple-500" />
          Habit Correlations
        </h2>
        <div className="space-y-4">
          {metrics.habitCorrelations.slice(0, 5).map((correlation, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-background rounded-xl">
              <div className="flex-1">
                <div className="font-medium">{correlation.habit1} ↔ {correlation.habit2}</div>
                <div className="text-sm text-foreground-muted">
                  {correlation.strength} correlation ({correlation.correlation}% co-completion rate)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  correlation.strength === 'strong' ? 'bg-green-500/20 text-green-400' :
                  correlation.strength === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {correlation.strength}
                </div>
                <div className="text-lg font-bold">{correlation.correlation}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Insights */}
      <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Target size={24} className="text-green-500" />
          Category Performance Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.categoryInsights.map((insight, index) => (
            <div key={index} className="p-4 bg-background rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold capitalize">{insight.category}</h3>
                <div className={`p-1 rounded ${
                  insight.trendDirection === 'up' ? 'bg-green-500/20' :
                  insight.trendDirection === 'down' ? 'bg-red-500/20' :
                  'bg-gray-500/20'
                }`}>
                  {insight.trendDirection === 'up' ? '📈' : 
                   insight.trendDirection === 'down' ? '📉' : '➡️'}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Avg Time:</span>
                  <span>{insight.avgCompletionTime}min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Best Time:</span>
                  <span>{insight.bestTimeOfDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Consistency:</span>
                  <span className={`font-medium ${
                    insight.consistencyScore > 80 ? 'text-green-400' :
                    insight.consistencyScore > 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {insight.consistencyScore}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles size={24} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">AI-Powered Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface/50 p-4 rounded-xl">
            <h3 className="font-semibold mb-2">🎯 Optimization Opportunity</h3>
            <p className="text-sm text-foreground-muted">
              {metrics.categoryInsights.length > 0 && metrics.categoryInsights[0].consistencyScore < 70
                ? `Your ${metrics.categoryInsights[0].category} habits show room for improvement. Try scheduling them during your peak performance hours.`
                : 'Great consistency across all categories! Consider adding a new challenging habit to continue growing.'}
            </p>
          </div>
          <div className="bg-surface/50 p-4 rounded-xl">
            <h3 className="font-semibold mb-2">⏰ Timing Recommendation</h3>
            <p className="text-sm text-foreground-muted">
              {metrics.timePatterns.length > 0
                ? `Your most productive time is ${metrics.timePatterns.reduce((max, curr) => 
                    curr.successRate > max.successRate ? curr : max, metrics.timePatterns[0]
                  ).hour}:00. Schedule important habits during this window.`
                : 'Complete more habits to unlock personalized timing recommendations.'}
            </p>
          </div>
          <div className="bg-surface/50 p-4 rounded-xl">
            <h3 className="font-semibold mb-2">🔗 Habit Stacking</h3>
            <p className="text-sm text-foreground-muted">
              {metrics.habitCorrelations.length > 0
                ? `${metrics.habitCorrelations[0].habit1} and ${metrics.habitCorrelations[0].habit2} work well together (${metrics.habitCorrelations[0].correlation}% correlation). Consider pairing them.`
                : 'Build more habits to discover powerful habit combinations.'}
            </p>
          </div>
          <div className="bg-surface/50 p-4 rounded-xl">
            <h3 className="font-semibold mb-2">📊 Performance Trend</h3>
            <p className="text-sm text-foreground-muted">
              {metrics.performanceZones.length > 0
                ? `You've been in the ${metrics.performanceZones[metrics.performanceZones.length - 1].zone} performance zone recently. ${
                    metrics.performanceZones[metrics.performanceZones.length - 1].zone === 'peak' 
                      ? 'Excellent work! Maintain this momentum.'
                      : 'Focus on consistency to reach peak performance.'
                  }`
                : 'Complete more habits to unlock performance zone analysis.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}