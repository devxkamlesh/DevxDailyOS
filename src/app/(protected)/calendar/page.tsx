'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter,
  Grid3X3, List, Clock, Zap, Target, Briefcase, Camera, 
  DollarSign, Coffee, Heart, Sunrise, Moon, BookOpen,
  Search, ArrowLeft, ArrowRight, CheckCircle2, X,
  MoreHorizontal, Sparkles, Flame
} from 'lucide-react'
import TimelineView from '@/components/calendar/TimelineView'


type ViewMode = 'month' | 'week' | 'day' | 'timeline' | 'agenda'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'habit' | 'task' | 'instagram' | 'freelance' | 'focus' | 'break'
  status?: string
  color: string
  description?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
  duration?: number
  completed?: boolean
}

const eventTypeConfig = {
  habit: { 
    icon: Target, 
    color: 'from-purple-500 to-purple-600', 
    lightColor: 'bg-purple-500/10 border-purple-500/30', 
    textColor: 'text-purple-400',
    label: 'Habit' 
  },
  task: { 
    icon: Briefcase, 
    color: 'from-blue-500 to-blue-600', 
    lightColor: 'bg-blue-500/10 border-blue-500/30', 
    textColor: 'text-blue-400',
    label: 'Task' 
  },
  instagram: { 
    icon: Camera, 
    color: 'from-pink-500 to-pink-600', 
    lightColor: 'bg-pink-500/10 border-pink-500/30', 
    textColor: 'text-pink-400',
    label: 'Instagram' 
  },
  freelance: { 
    icon: DollarSign, 
    color: 'from-green-500 to-green-600', 
    lightColor: 'bg-green-500/10 border-green-500/30', 
    textColor: 'text-green-400',
    label: 'Freelance' 
  },
  focus: { 
    icon: Zap, 
    color: 'from-yellow-500 to-yellow-600', 
    lightColor: 'bg-yellow-500/10 border-yellow-500/30', 
    textColor: 'text-yellow-400',
    label: 'Focus' 
  },
  break: { 
    icon: Coffee, 
    color: 'from-orange-500 to-orange-600', 
    lightColor: 'bg-orange-500/10 border-orange-500/30', 
    textColor: 'text-orange-400',
    label: 'Break' 
  }
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [dashboardStats, setDashboardStats] = useState({
    habitsCompleted: 0,
    habitsTotal: 0,
    deepWorkMinutes: 0,
    streak: 0
  })
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
    fetchDashboardStats()
  }, [currentDate, viewMode])

  const fetchEvents = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dateStr = getStartDate()
    const endDateStr = getEndDate()

    // Fetch habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('is_active', true)

    // Fetch habit logs
    const { data: habitLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('date', dateStr)
      .lte('date', endDateStr)

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, projects(name)')
      .gte('created_at', dateStr)
      .lte('created_at', endDateStr)

    const allEvents: CalendarEvent[] = []

    // Add habit events
    if (habits && habitLogs) {
      habitLogs.forEach(log => {
        const habit = habits.find(h => h.id === log.habit_id)
        if (habit) {
          allEvents.push({
            id: `habit-${log.id}`,
            title: habit.name,
            date: log.date,
            type: 'habit',
            status: log.completed ? 'completed' : 'pending',
            color: 'purple',
            category: habit.category,
            completed: log.completed
          })
        }
      })
    }

    // Add task events
    if (tasks) {
      tasks.forEach(task => {
        allEvents.push({
          id: `task-${task.id}`,
          title: task.title,
          date: task.created_at.split('T')[0],
          type: 'task',
          status: task.status,
          color: 'blue',
          description: task.projects?.name,
          completed: task.status === 'done'
        })
      })
    }

    setEvents(allEvents)
    setLoading(false)
  }

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      
      // Fetch habits and today's logs (same as dashboard)
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('id, type, target_value, target_unit').eq('user_id', user.id).eq('is_active', true),
        supabase.from('habit_logs').select('habit_id, completed, value').eq('user_id', user.id).eq('date', today)
      ])

      if (habitsRes.error || logsRes.error) {
        console.error('Error fetching stats:', habitsRes.error || logsRes.error)
        return
      }

      const habits = habitsRes.data || []
      const logs = logsRes.data || []

      // Calculate completed habits (same logic as dashboard)
      let completed = 0
      habits.forEach(habit => {
        const log = logs.find(l => l.habit_id === habit.id)
        if (log) {
          if (habit.type === 'boolean' && log.completed) completed++
          else if (habit.type === 'numeric' && (log.value || 0) >= (habit.target_value || 1)) completed++
        }
      })

      // Calculate streak (same logic as dashboard)
      const { data: recentLogs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(30)

      let streak = 0
      if (recentLogs && recentLogs.length > 0) {
        const uniqueDates = [...new Set(recentLogs.map(l => l.date))].sort().reverse()
        const todayDate = new Date()
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const checkDate = new Date(todayDate)
          checkDate.setDate(checkDate.getDate() - i)
          const checkDateStr = checkDate.toISOString().split('T')[0]
          
          if (uniqueDates.includes(checkDateStr)) {
            streak++
          } else {
            break
          }
        }
      }

      // Deep work - sum only time-based habit values (where target_unit is 'minutes')
      let deepWorkMinutes = 0
      logs.forEach(log => {
        const habit = habits.find(h => h.id === log.habit_id)
        if (habit?.type === 'numeric' && habit?.target_unit === 'minutes' && log.value) {
          // Add the logged value (in minutes)
          deepWorkMinutes += log.value
        }
      })

      setDashboardStats({
        habitsCompleted: completed,
        habitsTotal: habits.length,
        deepWorkMinutes,
        streak
      })
      setCurrentStreak(streak)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const getStartDate = () => {
    if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      return start.toISOString().split('T')[0]
    } else if (viewMode === 'week') {
      const start = new Date(currentDate)
      start.setDate(currentDate.getDate() - currentDate.getDay())
      return start.toISOString().split('T')[0]
    } else {
      return currentDate.toISOString().split('T')[0]
    }
  }

  const getEndDate = () => {
    if (viewMode === 'month') {
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return end.toISOString().split('T')[0]
    } else if (viewMode === 'week') {
      const end = new Date(currentDate)
      end.setDate(currentDate.getDate() - currentDate.getDay() + 6)
      return end.toISOString().split('T')[0]
    } else {
      return currentDate.toISOString().split('T')[0]
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      if (filterType !== 'all' && event.type !== filterType) return false
      return event.date === dateStr
    })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatDateHeader = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const start = new Date(currentDate)
      start.setDate(currentDate.getDate() - currentDate.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  const filteredEvents = filterType === 'all' ? events : events.filter(e => e.type === filterType)
  const eventCounts = {
    all: events.length,
    habit: events.filter(e => e.type === 'habit').length,
    task: events.filter(e => e.type === 'task').length,
    instagram: events.filter(e => e.type === 'instagram').length,
    freelance: events.filter(e => e.type === 'freelance').length,
    focus: events.filter(e => e.type === 'focus').length,
    break: events.filter(e => e.type === 'break').length
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-surface rounded-2xl border border-border-subtle">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 via-transparent to-accent-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        
        <div className="relative px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-accent-primary to-accent-primary/80 rounded-2xl shadow-lg">
                <CalendarIcon className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Smart Calendar
                </h1>
                <p className="text-foreground-muted mt-1 flex items-center gap-2">
                  <Sparkles size={16} />
                  Plan, focus, and achieve your goals
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-primary to-accent-primary/90 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Plus size={18} />
                <span className="font-medium">Add Event</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2.5 bg-surface border border-border-subtle rounded-xl hover:bg-background transition-all"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-background/80 backdrop-blur-sm border border-border-subtle rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CheckCircle2 className="text-blue-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {dashboardStats.habitsCompleted} / {dashboardStats.habitsTotal}
                  </div>
                  <div className="text-sm text-foreground-muted">Habits Done</div>
                </div>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm border border-border-subtle rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="text-purple-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {dashboardStats.deepWorkMinutes} min
                  </div>
                  <div className="text-sm text-foreground-muted">Deep Work</div>
                </div>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm border border-border-subtle rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Briefcase className="text-green-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {events.filter(e => e.type === 'task').length}
                  </div>
                  <div className="text-sm text-foreground-muted">Tasks</div>
                </div>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm border border-border-subtle rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Flame className="text-orange-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">{dashboardStats.streak} days</div>
                  <div className="text-sm text-foreground-muted">Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter size={20} />
                Filters & Search
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-background rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={18} />
              <input
                type="text"
                placeholder="Search events, habits, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition"
              />
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  filterType === 'all'
                    ? 'bg-gradient-to-r from-accent-primary to-accent-primary/90 text-white shadow-lg'
                    : 'bg-background hover:bg-surface border border-border-subtle'
                }`}
              >
                <Grid3X3 size={16} />
                All ({eventCounts.all})
              </button>
              
              {Object.entries(eventTypeConfig).map(([type, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      filterType === type
                        ? `bg-gradient-to-r ${config.color} text-white shadow-lg transform scale-105`
                        : 'bg-background hover:bg-surface border border-border-subtle'
                    }`}
                  >
                    <Icon size={16} />
                    {config.label} ({eventCounts[type as keyof typeof eventCounts]})
                  </button>
                )
              })}
            </div>
          </div>
      )}

      {/* Modern Calendar Controls */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-lg overflow-hidden">
          {/* Navigation Header */}
          <div className="bg-gradient-to-r from-accent-primary/5 to-transparent p-6 border-b border-border-subtle/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-background rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 hover:bg-surface rounded-lg transition-all transform hover:scale-105"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm font-medium text-accent-primary hover:bg-accent-primary/10 rounded-lg transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-2 hover:bg-surface rounded-lg transition-all transform hover:scale-105"
                  >
                    <ArrowLeft size={18} className="rotate-180" />
                  </button>
                </div>

                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {formatDateHeader()}
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>

              {/* View Mode Selector */}
              <div className="flex bg-background rounded-xl p-1 shadow-sm border border-border-subtle">
                <button
                  onClick={() => setViewMode('month')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'month'
                      ? 'bg-gradient-to-r from-accent-primary to-accent-primary/90 text-white shadow-md transform scale-105'
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  <Grid3X3 size={16} />
                  Month
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'timeline'
                      ? 'bg-gradient-to-r from-accent-primary to-accent-primary/90 text-white shadow-md transform scale-105'
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  <Clock size={16} />
                  Timeline
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          {loading ? (
            <div className="p-6">
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[140px] bg-background rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="p-6">
              <TimelineView selectedDate={currentDate} />
            </div>
          ) : (
            <div className="p-6">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-3 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-foreground-muted py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Modern Calendar Grid */}
              <div className="grid grid-cols-7 gap-3">
                {getDaysInMonth().map((date, index) => {
                  const dayEvents = getEventsForDate(date)
                  const completedEvents = dayEvents.filter(e => e.completed).length
                  const totalEvents = dayEvents.length
                  const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[140px] p-3 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                        date
                          ? isToday(date)
                            ? 'bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 border-accent-primary shadow-lg'
                            : 'bg-background/60 backdrop-blur-sm border-border-subtle hover:border-accent-primary/40 hover:shadow-md'
                          : 'bg-transparent border-transparent'
                      } ${date ? 'cursor-pointer' : ''}`}
                      onClick={() => date && setSelectedDate(date)}
                    >
                      {date && (
                        <>
                          {/* Date Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className={`text-lg font-bold ${
                              isToday(date) 
                                ? 'text-accent-primary' 
                                : 'text-foreground'
                            }`}>
                              {date.getDate()}
                            </div>
                            
                            {totalEvents > 0 && (
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  completionRate === 100 ? 'bg-green-500' :
                                  completionRate > 50 ? 'bg-yellow-500' :
                                  completionRate > 0 ? 'bg-orange-500' : 'bg-red-500'
                                }`} />
                                <span className="text-xs text-foreground-muted">
                                  {completedEvents}/{totalEvents}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Events */}
                          <div className="space-y-1.5">
                            {dayEvents.slice(0, 3).map(event => {
                              const config = eventTypeConfig[event.type]
                              const Icon = config.icon
                              
                              return (
                                <div
                                  key={event.id}
                                  className={`group relative p-2 rounded-lg border transition-all hover:shadow-sm ${
                                    event.completed 
                                      ? 'bg-green-500/20 border-green-500/30' 
                                      : `${config.lightColor}`
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedEvent(event)
                                    setShowEventModal(true)
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded bg-gradient-to-r ${config.color} flex-shrink-0`}>
                                      <Icon className="text-white" size={10} />
                                    </div>
                                    <span className={`text-xs font-medium truncate ${config.textColor}`}>
                                      {event.title}
                                    </span>
                                    {event.completed && (
                                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={12} />
                                    )}
                                  </div>
                                  
                                  {event.time && (
                                    <div className="flex items-center gap-1 mt-1 ml-5">
                                      <Clock size={8} className="text-foreground-muted" />
                                      <span className="text-xs text-foreground-muted">
                                        {event.time}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            
                            {dayEvents.length > 3 && (
                              <div className="text-center">
                                <button className="text-xs text-accent-primary hover:text-accent-primary/80 font-medium">
                                  +{dayEvents.length - 3} more
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>


    </div>
  )
}