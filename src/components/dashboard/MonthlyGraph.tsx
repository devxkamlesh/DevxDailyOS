'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DailyData {
  date: string
  day: number
  completed: number
  total: number
  percentage: number
}

export default function MonthlyGraph() {
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMonthlyData = useCallback(async () => {
    let mounted = true
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        
        if (!user) {
          setLoading(false)
          return
        }

      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const daysInMonth = lastDay.getDate()

      // Fetch habits for this user
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (habitsError) {
        console.error('Error fetching habits:', habitsError)
        setLoading(false)
        return
      }

      const habitCount = habits?.length || 1

      // Fetch logs for current month for this user
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0])

      if (logsError) {
        console.error('Error fetching logs:', logsError)
      }

      // Process daily data
      const daily: DailyData[] = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayLogs = logs?.filter(log => log.date === dateStr) || []
        const completed = dayLogs.filter(log => log.completed).length
        const total = habitCount
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

        daily.push({
          date: dateStr,
          day,
          completed,
          total,
          percentage
        })
      }

      if (mounted) {
        setDailyData(daily)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in fetchMonthlyData:', error)
      if (mounted) setLoading(false)
    }
    
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    fetchMonthlyData()
    
    // Listen for habit completion events to update chart in realtime
    const handleHabitUpdate = () => {
      fetchMonthlyData()
    }
    
    window.addEventListener('habitUpdated', handleHabitUpdate)
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('habitUpdated', handleHabitUpdate)
    }
  }, [fetchMonthlyData])

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-accent-primary" />
          <h2 className="text-xl font-semibold">Monthly Progress</h2>
        </div>
        <div className="h-72 bg-background/30 rounded-lg animate-pulse" />
        <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="h-8 bg-background rounded w-16 mx-auto mb-2" />
              <div className="h-3 bg-background rounded w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-surface border border-border-subtle rounded-lg p-3 shadow-lg">
          <p className="font-semibold">Day {data.day}</p>
          <p className="text-sm text-foreground-muted">
            {data.completed}/{data.total} completed
          </p>
          <p className="text-sm text-accent-primary font-medium">
            {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-accent-primary" />
          <h2 className="text-xl font-semibold">Monthly Progress</h2>
        </div>
        <span className="text-sm text-foreground-muted">{currentMonth}</span>
      </div>

      <div className="h-72 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dailyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888888', fontSize: 12 }}
              interval={4}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888888', fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorPercentage)"
              dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: '#6366f1', strokeWidth: 2, stroke: '#fff', r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-primary">
            {dailyData.reduce((sum, d) => sum + d.completed, 0)}
          </div>
          <div className="text-xs text-foreground-muted">Total Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-success">
            {Math.round(dailyData.reduce((sum, d) => sum + d.percentage, 0) / dailyData.length)}%
          </div>
          <div className="text-xs text-foreground-muted">Avg Completion</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">
            {dailyData.filter(d => d.percentage === 100).length}
          </div>
          <div className="text-xs text-foreground-muted">Perfect Days</div>
        </div>
      </div>

      {/* Year Heatmap - Inline */}
      <YearHeatmapInline />
    </div>
  )
}

// Inline Year Heatmap Component
function YearHeatmapInline() {
  const [heatmapData, setHeatmapData] = useState<Map<string, { count: number; level: 0 | 1 | 2 | 3 | 4 }>>(new Map())
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  useEffect(() => {
    fetchYearData()
    
    // Listen for habit updates to refresh heatmap
    const handleHabitUpdate = () => fetchYearData()
    window.addEventListener('habitUpdated', handleHabitUpdate)
    
    return () => window.removeEventListener('habitUpdated', handleHabitUpdate)
  }, [])

  const fetchYearData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const year = new Date().getFullYear()
      const startOfYear = new Date(year, 0, 1)

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', startOfYear.toISOString().split('T')[0])
        .eq('completed', true)

      const dataMap = new Map<string, { count: number; level: 0 | 1 | 2 | 3 | 4 }>()
      logs?.forEach(log => {
        const existing = dataMap.get(log.date)
        if (existing) {
          existing.count++
        } else {
          dataMap.set(log.date, { count: 1, level: 0 })
        }
      })

      const counts = Array.from(dataMap.values()).map(d => d.count)
      const maxCount = Math.max(...counts, 1)
      dataMap.forEach(day => {
        if (day.count <= maxCount * 0.25) day.level = 1
        else if (day.count <= maxCount * 0.5) day.level = 2
        else if (day.count <= maxCount * 0.75) day.level = 3
        else day.level = 4
      })

      setHeatmapData(dataMap)
    } catch (error) {
      console.error('Error fetching year data:', error)
    }
  }

  const getColorForLevel = (level: 0 | 1 | 2 | 3 | 4) => {
    const colors = {
      0: 'bg-[#1a1a1a]',
      1: 'bg-green-900/50',
      2: 'bg-green-700/70',
      3: 'bg-green-500',
      4: 'bg-green-400'
    }
    return colors[level]
  }

  const generateYearGrid = () => {
    const year = new Date().getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)
    
    const firstDay = new Date(startOfYear)
    while (firstDay.getDay() !== 0) {
      firstDay.setDate(firstDay.getDate() - 1)
    }
    
    const weeks: (Date | null)[][] = []
    const currentDate = new Date(firstDay)
    
    while (currentDate <= endOfYear || weeks.length < 53) {
      const week: (Date | null)[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentDate)
        if (d.getFullYear() === year) {
          week.push(d)
        } else {
          week.push(null)
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push(week)
      if (currentDate > endOfYear && week.every(d => d === null || d > endOfYear)) break
    }
    
    return weeks
  }

  const weeks = generateYearGrid()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="mt-4 pt-4 border-t border-border-subtle relative">
      <div className="flex gap-[3px] justify-center">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={dayIndex} className="w-[10px] h-[10px]" />
              }
              
              const dateStr = date.toISOString().split('T')[0]
              const dayData = heatmapData.get(dateStr)
              const level = dayData?.level || 0
              const count = dayData?.count || 0

              return (
                <div
                  key={dayIndex}
                  className={`w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-all hover:scale-125 hover:ring-1 hover:ring-white/20 ${getColorForLevel(level)}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setHoveredDay({ date: dateStr, count, x: rect.left, y: rect.top })
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              )
            })}
          </div>
        ))}
      </div>
      
      {/* Tooltip */}
      {hoveredDay && (
        <div 
          className="fixed z-50 bg-surface border border-border-subtle rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          style={{ 
            left: hoveredDay.x - 60, 
            top: hoveredDay.y - 55,
          }}
        >
          <div className="text-xs font-medium">{formatDate(hoveredDay.date)}</div>
          <div className="text-xs text-foreground-muted">
            {hoveredDay.count} habit{hoveredDay.count !== 1 ? 's' : ''} completed
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-foreground-muted">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-[10px] h-[10px] rounded-[2px] ${getColorForLevel(level as 0 | 1 | 2 | 3 | 4)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
