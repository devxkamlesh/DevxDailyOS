'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity } from 'lucide-react'

interface DayData {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export default function YearHeatmap() {
  const [heatmapData, setHeatmapData] = useState<Map<string, DayData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [totalCompletions, setTotalCompletions] = useState(0)

  useEffect(() => {
    fetchYearData()
  }, [])

  const fetchYearData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = new Date()
      const startOfYear = new Date(today.getFullYear(), 0, 1)

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', startOfYear.toISOString().split('T')[0])
        .eq('completed', true)

      const dataMap = new Map<string, DayData>()
      logs?.forEach(log => {
        const existing = dataMap.get(log.date)
        if (existing) {
          existing.count++
        } else {
          dataMap.set(log.date, { date: log.date, count: 1, level: 0 })
        }
      })

      const counts = Array.from(dataMap.values()).map(d => d.count)
      const maxCount = Math.max(...counts, 1)
      dataMap.forEach(day => {
        if (day.count === 0) day.level = 0
        else if (day.count <= maxCount * 0.25) day.level = 1
        else if (day.count <= maxCount * 0.5) day.level = 2
        else if (day.count <= maxCount * 0.75) day.level = 3
        else day.level = 4
      })

      setHeatmapData(dataMap)
      setTotalCompletions(logs?.length || 0)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching year data:', error)
      setLoading(false)
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

  // Generate all weeks for the year with proper alignment
  const generateYearGrid = () => {
    const today = new Date()
    const year = today.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)
    
    // Find the first Sunday before or on Jan 1
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
        // Only include dates from current year
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

  // Get month label positions
  const getMonthLabels = () => {
    const year = new Date().getFullYear()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const labels: { month: string; weekIndex: number }[] = []
    
    const weeks = generateYearGrid()
    months.forEach((month, monthIndex) => {
      const firstOfMonth = new Date(year, monthIndex, 1)
      const weekIndex = weeks.findIndex(week => 
        week.some(d => d && d.getMonth() === monthIndex && d.getDate() <= 7)
      )
      if (weekIndex !== -1) {
        labels.push({ month, weekIndex })
      }
    })
    
    return labels
  }

  const weeks = generateYearGrid()
  const monthLabels = getMonthLabels()

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <div className="h-40 bg-background rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <Activity className="text-green-500" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Activity Heatmap</h2>
          <p className="text-sm text-foreground-muted">{totalCompletions} habits completed this year</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[800px]">
          {/* Month labels */}
          <div className="flex ml-10 mb-2">
            {monthLabels.map(({ month, weekIndex }, i) => (
              <div 
                key={month} 
                className="text-xs text-foreground-muted"
                style={{ 
                  position: 'absolute',
                  left: `${40 + weekIndex * 14}px`
                }}
              >
                {month}
              </div>
            ))}
          </div>
          
          <div className="flex mt-6">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] text-xs text-foreground-muted mr-2 w-8">
              <div className="h-[10px]"></div>
              <div className="h-[10px] flex items-center">Mon</div>
              <div className="h-[10px]"></div>
              <div className="h-[10px] flex items-center">Wed</div>
              <div className="h-[10px]"></div>
              <div className="h-[10px] flex items-center">Fri</div>
              <div className="h-[10px]"></div>
            </div>

            {/* Weeks grid */}
            <div className="flex gap-[3px]">
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
                        className={`w-[10px] h-[10px] rounded-sm ${getColorForLevel(level)}`}
                        title={`${dateStr}: ${count} habits completed`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 ml-10 text-xs text-foreground-muted">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-[10px] h-[10px] rounded-sm ${getColorForLevel(level as 0 | 1 | 2 | 3 | 4)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
