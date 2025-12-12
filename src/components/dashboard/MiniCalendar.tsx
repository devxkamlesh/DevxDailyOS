'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Flame, Target } from 'lucide-react'
import Link from 'next/link'

interface DayData {
  date: string
  completed: number
  total: number
  percentage: number
}

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Map<string, DayData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [monthStats, setMonthStats] = useState({ completed: 0, total: 0, percentage: 0 })

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  const fetchCalendarData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

      // Fetch habits count
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const habitCount = habits?.length || 0

      // Fetch logs for the month
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .eq('completed', true)

      // Group by date
      const dataMap = new Map<string, DayData>()
      logs?.forEach(log => {
        const existing = dataMap.get(log.date)
        if (existing) {
          existing.completed++
        } else {
          dataMap.set(log.date, {
            date: log.date,
            completed: 1,
            total: habitCount,
            percentage: habitCount > 0 ? Math.round((1 / habitCount) * 100) : 0
          })
        }
      })

      // Update percentages
      dataMap.forEach(day => {
        day.percentage = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0
      })

      setCalendarData(dataMap)

      // Calculate streak
      const today = new Date()
      let currentStreak = 0
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        const dayData = dataMap.get(dateStr)
        
        if (dayData && dayData.percentage >= 80) {
          currentStreak++
        } else if (i > 0) {
          break
        }
      }
      setStreak(currentStreak)

      // Calculate month stats
      let totalCompleted = 0
      let totalPossible = 0
      dataMap.forEach(day => {
        totalCompleted += day.completed
        totalPossible += day.total
      })
      setMonthStats({
        completed: totalCompleted,
        total: totalPossible,
        percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching calendar data:', error)
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const getColorForPercentage = (percentage: number) => {
    if (percentage === 0) return 'bg-background'
    if (percentage < 25) return 'bg-red-500/20'
    if (percentage < 50) return 'bg-orange-500/30'
    if (percentage < 75) return 'bg-yellow-500/40'
    if (percentage < 100) return 'bg-green-500/50'
    return 'bg-accent-success'
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const days = getDaysInMonth()
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-primary/10 rounded-lg">
            <Calendar className="text-accent-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Habit Calendar</h2>
            <p className="text-sm text-foreground-muted">Track your consistency</p>
          </div>
        </div>
        <Link 
          href="/calendar" 
          className="text-sm text-accent-primary hover:underline"
        >
          View Full
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs text-foreground-muted">Streak</span>
          </div>
          <div className="text-2xl font-bold">{streak}</div>
          <div className="text-xs text-foreground-muted">days</div>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-accent-primary" />
            <span className="text-xs text-foreground-muted">This Month</span>
          </div>
          <div className="text-2xl font-bold">{monthStats.percentage}%</div>
          <div className="text-xs text-foreground-muted">{monthStats.completed}/{monthStats.total}</div>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-accent-success" />
            <span className="text-xs text-foreground-muted">Best Day</span>
          </div>
          <div className="text-2xl font-bold">
            {Math.max(...Array.from(calendarData.values()).map(d => d.percentage), 0)}%
          </div>
          <div className="text-xs text-foreground-muted">completion</div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-background rounded-lg transition"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-semibold">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-background rounded-lg transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-foreground-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dateStr = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            ).toISOString().split('T')[0]
            
            const dayData = calendarData.get(dateStr)
            const isToday = dateStr === new Date().toISOString().split('T')[0]
            const percentage = dayData?.percentage || 0

            return (
              <div
                key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer hover:scale-110 ${
                  getColorForPercentage(percentage)
                } ${isToday ? 'ring-2 ring-accent-primary' : ''}`}
                title={`${day}: ${percentage}% complete`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-background" />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/40" />
          <span>50%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-success" />
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
