'use client'

import { useState, useEffect, useCallback } from 'react'
import { chartEngine, DemoDataGenerator, ChartDataEngine } from './chart-engine'

export interface UseChartEngineOptions {
  useRealData?: boolean
  userId?: string
  timeRange?: '1week' | '1month' | '3months' | '6months' | '1year'
}

// Transform habit logs to chart data format
function transformHabitLogsToChartData(logs: any[]): any[] {
  const dailyData = logs.reduce((acc, log) => {
    const date = log.date
    if (!acc[date]) {
      acc[date] = {
        timestamp: new Date(date + 'T12:00:00').toISOString(),
        date: date,
        completions: 0,
        totalHabits: 0,
        focusTime: 0,
        productivity: 0,
        successRate: 0,
        category: log.habits?.category || 'other',
        weekday: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        month: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }),
        hour: log.completed_at ? new Date(log.completed_at).getHours() : 12,
        revenue: Math.floor(Math.random() * 1000) + 500, // Placeholder for business metrics
        users: Math.floor(Math.random() * 100) + 50,
        profit: Math.floor(Math.random() * 300) + 100,
        minValue: Math.floor(Math.random() * 20) + 40,
        maxValue: Math.floor(Math.random() * 20) + 80,
        currentValue: 0
      }
    }
    
    acc[date].totalHabits++
    if (log.completed) {
      acc[date].completions++
    }
    acc[date].focusTime += log.duration_minutes || 0
    
    return acc
  }, {})

  // Calculate derived metrics
  return Object.values(dailyData).map((day: any) => {
    day.successRate = day.totalHabits > 0 ? Math.round((day.completions / day.totalHabits) * 100) : 0
    day.productivity = day.successRate // Use success rate as productivity metric
    day.currentValue = day.completions
    return day
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function useChartEngine(options: UseChartEngineOptions = {}) {
  const [chartData, setChartData] = useState<Map<string, any[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize chart engine with data
  const initializeEngine = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let dataset: any[] = []

      if (options.useRealData) {
        // Fetch real user data from Supabase
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Calculate date range
          const now = new Date()
          const daysBack = options.timeRange === '1week' ? 7 : 
                          options.timeRange === '1month' ? 30 :
                          options.timeRange === '3months' ? 90 :
                          options.timeRange === '6months' ? 180 : 365
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

          if (logs && logs.length > 0) {
            // Transform real data to chart format
            dataset = transformHabitLogsToChartData(logs)
          } else {
            // No real data available, use demo data
            dataset = DemoDataGenerator.generateHabitAnalytics(daysBack)
          }
        } else {
          // User not authenticated, use demo data
          const days = options.timeRange === '1week' ? 7 : 
                      options.timeRange === '1month' ? 30 :
                      options.timeRange === '3months' ? 90 :
                      options.timeRange === '6months' ? 180 : 365
          dataset = DemoDataGenerator.generateHabitAnalytics(days)
        }
      } else {
        // Use demo data
        const days = options.timeRange === '1week' ? 7 : 
                    options.timeRange === '1month' ? 30 :
                    options.timeRange === '3months' ? 90 :
                    options.timeRange === '6months' ? 180 : 365
        dataset = DemoDataGenerator.generateHabitAnalytics(days)
      }

      // CMD: INIT_CHART_DATA_ENGINE
      chartEngine.initEngine({
        source: options.useRealData ? 'database' : 'static',
        dataset,
        timeKey: 'timestamp',
        metrics: ['completions', 'successRate', 'focusTime', 'productivity', 'revenue', 'users', 'profit'],
        dimensions: ['category', 'weekday', 'month']
      })

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize chart engine')
      setLoading(false)
    }
  }, [options.useRealData, options.timeRange])

  // Configure and get simple area chart
  const getSimpleAreaChart = useCallback((config: {
    chartId: string
    xAxis: string
    yAxis: string[]
    aggregation?: 'sum' | 'avg' | 'none'
  }) => {
    return chartEngine.configureSimpleAreaChart({
      chartId: config.chartId,
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      area: {
        key: config.yAxis[0],
        aggregation: config.aggregation || 'none'
      }
    })
  }, [])

  // Configure and get fill by value area chart
  const getFillByValueChart = useCallback((config: {
    chartId: string
    xAxis: string
    yAxis: string
    thresholds: Array<{ min: number; max: number; type: string; color?: string }>
  }) => {
    return chartEngine.configureFillByValueArea(config)
  }, [])

  // Configure and get composed chart
  const getComposedChart = useCallback((config: {
    chartId: string
    xAxis: string
    series: Array<{ type: 'bar' | 'line' | 'area'; key: string; color?: string }>
  }) => {
    return chartEngine.configureComposedChart(config)
  }, [])

  // Configure and get banded chart
  const getBandedChart = useCallback((config: {
    chartId: string
    xAxis: string
    bands: { low: string; high: string }
    actual: string
  }) => {
    return chartEngine.configureBandedChart(config)
  }, [])

  // Configure and get multi x-axis chart
  const getMultiXAxisChart = useCallback((config: {
    chartId: string
    xAxes: Array<{ id: string; key: string }>
    yAxis: string[]
  }) => {
    return chartEngine.configureMultiXAxisChart(config)
  }, [])

  // Update chart data
  const updateChartData = useCallback((params: {
    chartId: string | 'all'
    newData: any[]
    mode: 'append' | 'replace' | 'merge'
  }) => {
    chartEngine.updateChartData(params)
    // Refresh all charts after update
    const refreshedData = chartEngine.refreshCharts()
    setChartData(refreshedData)
  }, [])

  // Refresh all charts
  const refreshCharts = useCallback(() => {
    const refreshedData = chartEngine.refreshCharts()
    setChartData(refreshedData)
    return refreshedData
  }, [])

  // Reset specific chart
  const resetChart = useCallback((chartId: string) => {
    chartEngine.resetChart(chartId)
    const refreshedData = chartEngine.refreshCharts()
    setChartData(refreshedData)
  }, [])

  // Initialize on mount
  useEffect(() => {
    initializeEngine()
  }, [initializeEngine])

  return {
    // State
    chartData,
    loading,
    error,
    
    // Chart configuration methods
    getSimpleAreaChart,
    getFillByValueChart,
    getComposedChart,
    getBandedChart,
    getMultiXAxisChart,
    
    // Data management methods
    updateChartData,
    refreshCharts,
    resetChart,
    initializeEngine
  }
}

// Predefined chart configurations for common use cases
export const ChartPresets = {
  // Habit Analytics Presets
  habitCompletionTrend: {
    chartId: 'habit_completion_trend',
    xAxis: 'date',
    yAxis: ['completions'],
    aggregation: 'none' as const
  },
  
  performanceZones: {
    chartId: 'performance_zones',
    xAxis: 'date',
    yAxis: 'productivity',
    thresholds: [
      { min: -Infinity, max: 70, type: 'poor', color: '#ef4444' },
      { min: 70, max: 85, type: 'good', color: '#eab308' },
      { min: 85, max: Infinity, type: 'excellent', color: '#22c55e' }
    ]
  },
  
  multiMetricDashboard: {
    chartId: 'multi_metric_dashboard',
    xAxis: 'date',
    series: [
      { type: 'bar' as const, key: 'completions', color: '#22c55e' },
      { type: 'line' as const, key: 'successRate', color: '#6366f1' },
      { type: 'area' as const, key: 'focusTime', color: '#f97316' }
    ]
  },
  
  targetVsActual: {
    chartId: 'target_vs_actual',
    xAxis: 'date',
    bands: { low: 'minValue', high: 'maxValue' },
    actual: 'currentValue'
  },
  
  // Business Analytics Presets
  revenueAnalysis: {
    chartId: 'revenue_analysis',
    xAxis: 'date',
    series: [
      { type: 'area' as const, key: 'revenue', color: '#22c55e' },
      { type: 'line' as const, key: 'profit', color: '#6366f1' },
      { type: 'bar' as const, key: 'users', color: '#f97316' }
    ]
  }
}