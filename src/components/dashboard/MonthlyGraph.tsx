'use client'

import { useEffect, useState } from 'react'
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
  const supabase = createClient()

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const fetchMonthlyData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Fetch habits for this user
    const { data: habits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const habitCount = habits?.length || 1

    // Fetch logs for current month for this user
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('date, completed')
      .eq('user_id', user.id)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0])

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

    setDailyData(daily)
    setLoading(false)
  }

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
    </div>
  )
}
