'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, Circle, Target, TrendingUp, Sunrise, Briefcase, Moon, Heart, Zap, 
  Plus, Minus, Timer, Calendar, Clock, MapPin, Video, ExternalLink, RefreshCw 
} from 'lucide-react'
import Link from 'next/link'
import { useRealtimeHabitLogs } from '@/lib/realtime'
import { useMidnightResetListener } from '@/hooks/useMidnightReset'
import { useDate, useDateChangeListener } from '@/contexts/DateContext'

interface Habit {
  id: string
  name: string
  type: 'boolean' | 'numeric'
  target_value: number | null
  target_unit: string | null
  category: string
  completedToday: boolean
  currentValue: number
}

interface GoogleCalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
  hangoutLink?: string
  htmlLink: string
  colorId?: string
}

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  morning: Sunrise,
  work: Briefcase,
  night: Moon,
  health: Heart,
  focus: Zap,
}

const categoryColors: Record<string, string> = {
  morning: 'text-orange-500',
  work: 'text-blue-500',
  night: 'text-purple-500',
  health: 'text-green-500',
  focus: 'text-yellow-500',
}

const eventColors: Record<string, { bg: string; border: string; text: string }> = {
  '1': { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
  '2': { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
  '3': { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
  '4': { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
  '5': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  '6': { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
  '7': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400' },
  '8': { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400' },
  '9': { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-400' },
  '10': { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400' },
  '11': { bg: 'bg-teal-500/20', border: 'border-teal-500/40', text: 'text-teal-400' },
  'default': { bg: 'bg-[var(--accent-primary)]/20', border: 'border-[var(--accent-primary)]/40', text: 'text-[var(--accent-primary)]' }
}

export default function TodaysHabits() {
  const router = useRouter()
  const { selectedDate, isToday, displayDate } = useDate()
  const [activeTab, setActiveTab] = useState<'habits' | 'events'>('habits')
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  
  // Events state
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsSyncing, setEventsSyncing] = useState(false)
  const [isCalendarConnected, setIsCalendarConnected] = useState(false)

  // Check Google Calendar connection
  const checkCalendarConnection = () => {
    const token = localStorage.getItem('google_calendar_token')
    const expiry = localStorage.getItem('google_calendar_expiry')
    if (token && expiry && Date.now() < parseInt(expiry)) {
      setIsCalendarConnected(true)
      return token
    }
    setIsCalendarConnected(false)
    setEventsLoading(false)
    return null
  }

  // Fetch events for selected date
  const fetchEventsForDate = useCallback(async (token?: string) => {
    const accessToken = token || checkCalendarConnection()
    if (!accessToken) return

    setEventsSyncing(true)
    try {
      // Parse selected date to get start/end of that day
      const [year, month, day] = selectedDate.split('-').map(Number)
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59)

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=10`
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('google_calendar_token')
          localStorage.removeItem('google_calendar_email')
          localStorage.removeItem('google_calendar_expiry')
          setIsCalendarConnected(false)
          return
        }
        return
      }

      const data = await response.json()
      setEvents(data.items || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setEventsLoading(false)
      setEventsSyncing(false)
    }
  }, [selectedDate])

  // Fetch events when date changes
  useEffect(() => {
    const token = checkCalendarConnection()
    if (token) {
      setEventsLoading(true)
      fetchEventsForDate(token)
    }
  }, [selectedDate, fetchEventsForDate])

  const fetchHabits = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      
      setUserId(user.id)

      const { data: habitsData } = await supabase
        .from('habits')
        .select('id, name, type, target_value, target_unit, category, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at')

      if (!habitsData) { setLoading(false); return }

      // Fetch logs for selected date (from context)
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, completed, value')
        .eq('user_id', user.id)
        .eq('date', selectedDate)

      const habitsWithStatus = habitsData.map(habit => {
        const log = logs?.find(l => l.habit_id === habit.id)
        const currentValue = log?.value || 0
        const completedToday = log ? (habit.type === 'boolean' ? log.completed : currentValue >= (habit.target_value || 1)) : false
        return { id: habit.id, name: habit.name, type: habit.type, target_value: habit.target_value, target_unit: habit.target_unit, category: habit.category, completedToday, currentValue }
      })

      setHabits(habitsWithStatus)
    } catch (error) {
      console.error('Error in fetchHabits:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { fetchHabits() }, [fetchHabits])
  useRealtimeHabitLogs(userId, () => fetchHabits())
  
  // Auto-refresh on midnight reset (12:00 AM IST)
  useMidnightResetListener(() => {
    console.log('[TodaysHabits] Midnight reset - refreshing habits')
    fetchHabits()
  })

  // Refresh when date changes via DateNavigator
  useDateChangeListener(() => {
    setLoading(true)
    fetchHabits()
  })

  const toggleHabit = async (habit: Habit) => {
    if (processing.has(habit.id)) return
    const wasCompleted = habit.completedToday
    const newCompleted = !wasCompleted
    const newValue = habit.type === 'numeric' ? (newCompleted ? (habit.target_value || 1) : 0) : null
    
    setProcessing(prev => new Set(prev).add(habit.id))
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedToday: newCompleted, currentValue: newValue ?? h.currentValue } : h))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedToday: wasCompleted, currentValue: habit.currentValue } : h))
      setProcessing(prev => { const next = new Set(prev); next.delete(habit.id); return next })
      return
    }

    // Use selectedDate for the log entry
    const { error: logError } = await supabase.from('habit_logs').upsert({ user_id: user.id, habit_id: habit.id, date: selectedDate, completed: newCompleted, value: newValue }, { onConflict: 'user_id,habit_id,date' })

    if (logError) {
      setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedToday: wasCompleted, currentValue: habit.currentValue } : h))
      setProcessing(prev => { const next = new Set(prev); next.delete(habit.id); return next })
      return
    }
    
    window.dispatchEvent(new CustomEvent('habitUpdated'))

    // Only award/deduct coins and XP for today's habits
    if (isToday) {
      if (newCompleted && !wasCompleted) {
        const { awardHabitCoins } = await import('@/lib/coins-fixed')
        await awardHabitCoins(user.id, habit.id, selectedDate)
        const { awardHabitXP } = await import('@/lib/xp')
        await awardHabitXP(user.id, habit.id, selectedDate)
      } else if (!newCompleted && wasCompleted) {
        const { deductHabitCoins } = await import('@/lib/coins-fixed')
        await deductHabitCoins(user.id, habit.id, selectedDate)
        const { deductHabitXP } = await import('@/lib/xp')
        await deductHabitXP(user.id, habit.id, selectedDate)
      }
    }

    setProcessing(prev => { const next = new Set(prev); next.delete(habit.id); return next })
  }

  const updateNumericValue = async (habitId: string, delta: number) => {
    if (processing.has(habitId)) return
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const newValue = Math.max(0, habit.currentValue + delta)
    const wasCompleted = habit.completedToday
    const isNowCompleted = newValue >= (habit.target_value || 1)
    
    setProcessing(prev => new Set(prev).add(habitId))
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, currentValue: newValue, completedToday: isNowCompleted } : h))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, currentValue: habit.currentValue, completedToday: wasCompleted } : h))
      setProcessing(prev => { const next = new Set(prev); next.delete(habitId); return next })
      return
    }

    // Use selectedDate for the log entry
    const { error } = await supabase.from('habit_logs').upsert({ user_id: user.id, habit_id: habitId, date: selectedDate, completed: isNowCompleted, value: newValue }, { onConflict: 'user_id,habit_id,date' })

    if (error) {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, currentValue: habit.currentValue, completedToday: wasCompleted } : h))
      setProcessing(prev => { const next = new Set(prev); next.delete(habitId); return next })
      return
    }
    
    window.dispatchEvent(new CustomEvent('habitUpdated'))

    // Only award/deduct coins and XP for today's habits
    if (isToday) {
      if (!wasCompleted && isNowCompleted) {
        const { awardHabitCoins } = await import('@/lib/coins-fixed')
        await awardHabitCoins(user.id, habitId, selectedDate)
        const { awardHabitXP } = await import('@/lib/xp')
        await awardHabitXP(user.id, habitId, selectedDate)
      } else if (wasCompleted && !isNowCompleted) {
        const { deductHabitCoins } = await import('@/lib/coins-fixed')
        await deductHabitCoins(user.id, habitId, selectedDate)
        const { deductHabitXP } = await import('@/lib/xp')
        await deductHabitXP(user.id, habitId, selectedDate)
      }
    }

    setProcessing(prev => { const next = new Set(prev); next.delete(habitId); return next })
  }

  const completedCount = habits.filter(h => h.completedToday).length
  const totalCount = habits.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const formatTime = (dateTime: string) => new Date(dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const getEventColorClass = (colorId?: string) => { const c = eventColors[colorId || 'default']; return `${c.bg} ${c.border} ${c.text}` }
  const isEventNow = (event: GoogleCalendarEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return false
    const now = new Date()
    return now >= new Date(event.start.dateTime) && now <= new Date(event.end.dateTime)
  }

  if (loading) {
    return (
      <div className="bg-surface/50 p-6 rounded-2xl border border-border-subtle h-[600px]">
        {/* Tab skeleton */}
        <div className="flex items-center gap-1 p-1 bg-background/50 rounded-xl mb-4">
          <div className="flex-1 h-9 bg-background rounded-lg animate-pulse" />
          <div className="flex-1 h-9 bg-background/50 rounded-lg animate-pulse" />
        </div>
        {/* Progress bar skeleton */}
        <div className="h-1.5 bg-background rounded-full mb-4 animate-pulse" />
        {/* Habits list skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
              <div className="w-6 h-6 bg-background rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-background rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-background rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-background rounded animate-pulse" />
              </div>
              <div className="h-6 w-12 bg-background rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Footer skeleton */}
        <div className="mt-auto pt-4 border-t border-border-subtle">
          <div className="h-4 w-32 bg-background rounded mx-auto animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle h-[600px] flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out" style={{ zIndex: 1 }}>
      {/* Tab Slider */}
      <div className="flex items-center gap-1 p-1 bg-background rounded-xl mb-4">
        <button
          onClick={() => setActiveTab('habits')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'habits' 
              ? 'bg-surface text-foreground shadow-sm' 
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <Target size={16} />
          <span>{isToday ? 'Today' : displayDate}</span>
          <span className="text-xs opacity-70 bg-background px-1.5 py-0.5 rounded-md">
            {completedCount}/{totalCount}
          </span>
        </button>
        {isCalendarConnected && (
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'events' 
                ? 'bg-surface text-foreground shadow-sm' 
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <Calendar size={16} />
            <span>Events</span>
            <span className="text-xs opacity-70 bg-background px-1.5 py-0.5 rounded-md">
              {events.length}
            </span>
          </button>
        )}
      </div>

      {activeTab === 'habits' ? (
        <>
          {/* Past date indicator - Read only */}
          {!isToday && (
            <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 text-blue-400 text-xs">
              <Clock size={14} />
              <span>Viewing {displayDate} - Read only (past data)</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="h-1.5 bg-background rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-accent-primary to-accent-success transition-all duration-300" style={{ width: `${percentage}%` }} />
          </div>

          {/* Habits list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {habits.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted">
                <Target size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm mb-2">No habits yet</p>
                <Link href="/habits" className="text-xs text-accent-primary hover:underline">Create your first habit →</Link>
              </div>
            ) : (
              habits.map(habit => {
                const IconComponent = categoryIcons[habit.category] || Target
                const colorClass = categoryColors[habit.category] || 'text-gray-500'
                // Past dates are read-only
                const isReadOnly = !isToday
                return (
                  <div key={habit.id} className={`p-3 rounded-xl border transition-all ${habit.completedToday ? 'bg-accent-success/10 border-accent-success/30' : 'bg-background border-border-subtle hover:border-border-subtle/80'} ${isReadOnly ? 'opacity-80' : ''}`}>
                    <div className="flex items-center gap-3">
                      {/* Checkbox/Timer - disabled for past dates */}
                      <div className={`flex-shrink-0 ${habit.completedToday ? 'text-accent-success' : 'text-foreground-muted'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}>
                        {isReadOnly ? (
                          // Read-only view
                          habit.completedToday ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Circle size={22} strokeWidth={2} className="opacity-50" />
                        ) : (
                          // Interactive view (today only)
                          <button onClick={() => { if (habit.type === 'numeric' && habit.target_unit === 'minutes' && !habit.completedToday) { router.push(`/focus?habit=${habit.id}`) } else { toggleHabit(habit) } }} className={`transition-all ${habit.completedToday ? '' : 'hover:text-accent-primary'}`}>
                            {habit.completedToday ? <CheckCircle2 size={22} strokeWidth={2.5} /> : habit.type === 'numeric' && habit.target_unit === 'minutes' ? <Timer size={22} strokeWidth={2} className="text-blue-500" /> : <Circle size={22} strokeWidth={2} />}
                          </button>
                        )}
                      </div>
                      <div className={`flex-shrink-0 p-1.5 rounded-lg ${habit.completedToday ? 'bg-accent-success/20' : 'bg-surface'}`}>
                        <IconComponent size={14} className={colorClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium truncate ${habit.completedToday ? 'text-foreground-muted line-through' : 'text-foreground'}`}>{habit.name}</h3>
                        {habit.type === 'numeric' && <div className="text-xs text-foreground-muted">{habit.currentValue} / {habit.target_value} {habit.target_unit || ''}</div>}
                      </div>
                      {/* Actions - disabled for past dates */}
                      {habit.type === 'numeric' ? (
                        habit.target_unit === 'minutes' ? (
                          !habit.completedToday && !isReadOnly && <button onClick={(e) => { e.stopPropagation(); router.push(`/focus?habit=${habit.id}`) }} className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium hover:bg-blue-500/20 transition flex items-center gap-1"><Timer size={10} />Focus</button>
                        ) : isReadOnly ? (
                          // Read-only numeric display
                          <span className="text-xs text-foreground-muted font-medium">{habit.currentValue}</span>
                        ) : (
                          // Interactive numeric controls (today only)
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); updateNumericValue(habit.id, -1) }} disabled={habit.currentValue <= 0} className="w-6 h-6 rounded-md bg-surface border border-border-subtle flex items-center justify-center hover:border-accent-primary disabled:opacity-40 disabled:cursor-not-allowed text-xs"><Minus size={12} /></button>
                            <span className="w-5 text-center text-xs font-medium">{habit.currentValue}</span>
                            <button onClick={(e) => { e.stopPropagation(); updateNumericValue(habit.id, 1) }} className="w-6 h-6 rounded-md bg-surface border border-border-subtle flex items-center justify-center hover:border-accent-primary text-xs"><Plus size={12} /></button>
                          </div>
                        )
                      ) : !habit.completedToday && !isReadOnly && <div className="px-2 py-0.5 bg-yellow-500/10 rounded text-xs font-bold text-yellow-500">+1</div>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {habits.length > 0 && (
            <Link href="/habits" className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border-subtle text-xs text-accent-primary hover:underline font-medium">
              <TrendingUp size={14} />Manage All Habits
            </Link>
          )}
        </>
      ) : (
        <>
          {/* Events Header */}
          <div className="flex items-center justify-between mb-3">
            {!isToday && (
              <span className="text-xs text-foreground-muted">{displayDate}</span>
            )}
            <div className="flex-1" />
            <button onClick={() => fetchEventsForDate()} disabled={eventsSyncing} className="p-1.5 hover:bg-background rounded-lg transition">
              <RefreshCw size={14} className={`text-foreground-muted ${eventsSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {eventsLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-background rounded-lg animate-pulse" />)}</div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted">
                <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No events {isToday ? 'today' : `on ${displayDate}`}</p>
              </div>
            ) : (
              events.map(event => {
                const isNow = isEventNow(event)
                const isAllDay = !event.start.dateTime
                return (
                  <div key={event.id} className={`p-3 rounded-xl border transition-all ${getEventColorClass(event.colorId)} ${isNow ? 'ring-2 ring-accent-primary ring-offset-1 ring-offset-surface' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{event.summary}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {isAllDay ? (
                            <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">All day</span>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] opacity-80">
                              <Clock size={10} />{formatTime(event.start.dateTime!)} - {formatTime(event.end.dateTime!)}
                            </div>
                          )}
                          {isNow && <span className="text-[10px] px-1.5 py-0.5 bg-accent-primary/30 text-accent-primary rounded font-medium animate-pulse">Now</span>}
                        </div>
                        {event.location && <div className="flex items-center gap-1 text-[10px] mt-1 opacity-70 truncate"><MapPin size={10} /><span className="truncate">{event.location}</span></div>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {event.hangoutLink && <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 rounded transition" title="Join Meet"><Video size={12} /></a>}
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 rounded transition opacity-60" title="Open in Google Calendar"><ExternalLink size={12} /></a>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <Link href="/calendar" className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border-subtle text-xs text-accent-primary hover:underline font-medium">
            <Calendar size={14} />View Full Calendar
          </Link>
        </>
      )}
    </div>
  )
}
