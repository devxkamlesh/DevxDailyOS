'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Target, Briefcase, Instagram, DollarSign,
  Clock, MoreVertical, X, Edit2, Trash2
} from 'lucide-react'

type ViewMode = 'month' | 'week' | 'day'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'habit' | 'task' | 'instagram' | 'freelance'
  status?: string
  color: string
  description?: string
  category?: string
}

const eventTypeConfig = {
  habit: { icon: Target, color: 'bg-purple-500', label: 'Habit' },
  task: { icon: Briefcase, color: 'bg-blue-500', label: 'Task' },
  instagram: { icon: Instagram, color: 'bg-pink-500', label: 'Instagram' },
  freelance: { icon: DollarSign, color: 'bg-green-500', label: 'Freelance' }
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
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [currentDate, viewMode])

  const fetchEvents = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = getStartDate()
    const endDate = getEndDate()

    // Fetch habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('is_active', true)

    // Fetch habit logs
    const { data: habitLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, projects(name)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Fetch instagram posts
    const { data: instaPosts } = await supabase
      .from('instagram_posts')
      .select('*')
      .in('status', ['scheduled', 'posted'])

    // Fetch freelance clients with next actions
    const { data: clients } = await supabase
      .from('freelance_clients')
      .select('*')
      .not('next_action_date', 'is', null)
      .gte('next_action_date', startDate)
      .lte('next_action_date', endDate)

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
            category: habit.category
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
          description: task.projects?.name
        })
      })
    }

    // Add instagram events
    if (instaPosts) {
      instaPosts.forEach(post => {
        allEvents.push({
          id: `insta-${post.id}`,
          title: post.title || 'Instagram Post',
          date: post.created_at.split('T')[0],
          type: 'instagram',
          status: post.status,
          color: 'pink',
          description: post.format
        })
      })
    }

    // Add freelance events
    if (clients) {
      clients.forEach(client => {
        if (client.next_action_date) {
          allEvents.push({
            id: `freelance-${client.id}`,
            title: client.name,
            date: client.next_action_date,
            type: 'freelance',
            color: 'green',
            description: client.next_action || undefined
          })
        }
      })
    }

    setEvents(allEvents)
    setLoading(false)
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

  const getWeekDays = () => {
    const days: Date[] = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
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
      const start = getWeekDays()[0]
      const end = getWeekDays()[6]
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
    freelance: events.filter(e => e.type === 'freelance').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Calendar</h1>
          <p className="text-foreground-muted">Manage all your activities in one place</p>
        </div>
        <button
          onClick={() => setShowEventModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filterType === 'all'
              ? 'bg-accent-primary text-white'
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          All ({eventCounts.all})
        </button>
        {Object.entries(eventTypeConfig).map(([type, config]) => {
          const Icon = config.icon
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                filterType === type
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface text-foreground-muted hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {config.label} ({eventCounts[type as keyof typeof eventCounts]})
            </button>
          )
        })}
      </div>

      {/* Calendar Controls */}
      <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-background rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold min-w-[250px] text-center">
              {formatDateHeader()}
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-background rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition text-sm font-medium"
            >
              Today
            </button>
          </div>

          <div className="flex bg-background rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                viewMode === 'day'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                viewMode === 'week'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                viewMode === 'month'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 bg-background rounded animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[100px] bg-background rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : viewMode === 'month' ? (
          <div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-foreground-muted py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((date, index) => {
                const dayEvents = getEventsForDate(date)
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                      date
                        ? isToday(date)
                          ? 'bg-accent-primary/10 border-accent-primary'
                          : 'bg-background border-border-subtle hover:border-accent-primary/30'
                        : 'bg-surface border-transparent'
                    } ${date ? 'cursor-pointer' : ''}`}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${
                          isToday(date) ? 'text-accent-primary' : ''
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => {
                            const Icon = eventTypeConfig[event.type].icon
                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1.5 rounded flex items-center gap-1 ${
                                  event.type === 'habit' ? 'bg-purple-500/20 text-purple-400' :
                                  event.type === 'task' ? 'bg-blue-500/20 text-blue-400' :
                                  event.type === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(event)
                                  setShowEventModal(true)
                                }}
                              >
                                <Icon size={10} />
                                <span className="truncate">{event.title}</span>
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-foreground-muted text-center">
                              +{dayEvents.length - 3} more
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
        ) : viewMode === 'week' ? (
          <div>
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((date, index) => {
                const dayEvents = getEventsForDate(date)
                return (
                  <div key={index} className="space-y-2">
                    <div className={`text-center p-3 rounded-lg ${
                      isToday(date) ? 'bg-accent-primary text-white' : 'bg-background'
                    }`}>
                      <div className="text-xs font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-2xl font-bold">
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-2 min-h-[400px]">
                      {dayEvents.map(event => {
                        const Icon = eventTypeConfig[event.type].icon
                        return (
                          <div
                            key={event.id}
                            className={`p-3 rounded-lg cursor-pointer transition ${
                              event.type === 'habit' ? 'bg-purple-500/20 hover:bg-purple-500/30' :
                              event.type === 'task' ? 'bg-blue-500/20 hover:bg-blue-500/30' :
                              event.type === 'instagram' ? 'bg-pink-500/20 hover:bg-pink-500/30' :
                              'bg-green-500/20 hover:bg-green-500/30'
                            }`}
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventModal(true)
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={14} />
                              <span className="text-sm font-medium">{event.title}</span>
                            </div>
                            {event.description && (
                              <p className="text-xs text-foreground-muted truncate">
                                {event.description}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {getEventsForDate(currentDate).length === 0 ? (
              <div className="text-center py-12 text-foreground-muted">
                <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>No events for this day</p>
              </div>
            ) : (
              getEventsForDate(currentDate).map(event => {
                const Icon = eventTypeConfig[event.type].icon
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl cursor-pointer transition border-2 ${
                      event.type === 'habit' ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50' :
                      event.type === 'task' ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50' :
                      event.type === 'instagram' ? 'bg-pink-500/10 border-pink-500/30 hover:border-pink-500/50' :
                      'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                    }`}
                    onClick={() => {
                      setSelectedEvent(event)
                      setShowEventModal(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          event.type === 'habit' ? 'bg-purple-500/20' :
                          event.type === 'task' ? 'bg-blue-500/20' :
                          event.type === 'instagram' ? 'bg-pink-500/20' :
                          'bg-green-500/20'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-foreground-muted">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-background rounded-full capitalize">
                              {event.type}
                            </span>
                            {event.status && (
                              <span className="text-xs px-2 py-1 bg-background rounded-full capitalize">
                                {event.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
