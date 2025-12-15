'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Timer, Target, Play, Pause, RotateCcw, SkipForward,
  CheckCircle2, Clock, Flame, Settings, X, Coffee,
  Volume2, VolumeX, ChevronRight, Sparkles, Maximize, Minimize
} from 'lucide-react'
import Link from 'next/link'
import DateManipulationBlocker from '@/components/ui/DateManipulationBlocker'

interface FocusHabit {
  id: string
  name: string
  category: string
  target_time: number
  time_spent_today: number
  completion_status: 'pending' | 'in_progress' | 'completed'
}

type SessionType = 'work' | 'shortBreak' | 'longBreak'

export default function FocusPage() {
  const searchParams = useSearchParams()
  const habitIdFromUrl = searchParams.get('habit')
  
  const [focusHabits, setFocusHabits] = useState<FocusHabit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHabit, setSelectedHabit] = useState<FocusHabit | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHabitSelector, setShowHabitSelector] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [currentSessionTime, setCurrentSessionTime] = useState(0) // Track time spent in current session
  
  // Stats
  const [todayStats, setTodayStats] = useState({
    totalFocusTime: 0,
    completedHabits: 0,
    totalPomodoros: 0,
    currentStreak: 0
  })
  
  // Settings
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('focusSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      setSettings(parsed)
      setTimeLeft(parsed.workDuration * 60)
    }
  }, [])

  // Fetch habits on mount and when URL param changes
  useEffect(() => {
    fetchFocusHabits()
    fetchTodayStats()
  }, [habitIdFromUrl])

  // Auto-select habit from URL and set timer to habit's target time
  useEffect(() => {
    if (habitIdFromUrl && focusHabits.length > 0) {
      const habit = focusHabits.find(h => h.id === habitIdFromUrl)
      if (habit) {
        setSelectedHabit(habit)
        // Set timer to habit's target time (remaining time if partially completed)
        const remainingTime = Math.max(habit.target_time - habit.time_spent_today, habit.target_time)
        setTimeLeft(remainingTime * 60)
      }
    }
  }, [habitIdFromUrl, focusHabits])

  // When habit is selected manually, update timer to habit's target time
  useEffect(() => {
    if (selectedHabit && sessionType === 'work' && !isRunning) {
      setTimeLeft(selectedHabit.target_time * 60)
    }
  }, [selectedHabit?.id])

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])


  const fetchFocusHabits = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch time-based habits (target_unit = 'minutes')
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('type', 'numeric')
      .eq('target_unit', 'minutes')

    if (habits) {
      // Use IST timezone for today
      const { getLocalDateString } = await import('@/lib/date-utils')
      const today = getLocalDateString()
      
      // Get today's habit logs for time values
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, value, completed')
        .eq('user_id', user.id)
        .eq('date', today)

      const logMap = new Map()
      logs?.forEach(l => logMap.set(l.habit_id, l))

      const formatted: FocusHabit[] = habits.map(h => {
        const log = logMap.get(h.id)
        const timeSpent = log?.value || 0
        const targetTime = h.target_value || 30
        return {
          id: h.id,
          name: h.name,
          category: h.category,
          target_time: targetTime,
          time_spent_today: timeSpent,
          completion_status: timeSpent >= targetTime ? 'completed' : timeSpent > 0 ? 'in_progress' : 'pending'
        }
      })
      
      setFocusHabits(formatted)
      
      // Auto-select first habit if none selected
      if (formatted.length > 0 && !selectedHabit && !habitIdFromUrl) {
        setSelectedHabit(formatted[0])
      }
    }
    setLoading(false)
  }

  const fetchTodayStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Use IST timezone for today
    const { getLocalDateString } = await import('@/lib/date-utils')
    const today = getLocalDateString()
    
    // Get today's focus sessions
    const { data: sessions } = await supabase
      .from('habit_focus_sessions')
      .select('duration, pomodoros_completed')
      .eq('user_id', user.id)
      .eq('date', today)

    // Get completed time-based habits for today
    const { data: completedLogs } = await supabase
      .from('habit_logs')
      .select('habit_id, completed')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('completed', true)

    // Calculate streak using IST timezone
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
        if (uniqueDates.includes(getLocalDateString(checkDate))) {
          streak++
        } else break
      }
    }

    const totalFocusTime = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0
    const totalPomodoros = sessions?.reduce((sum, s) => sum + s.pomodoros_completed, 0) || 0
    
    // Count completed time-based habits
    const completedHabitIds = new Set(completedLogs?.map(l => l.habit_id) || [])
    const completedCount = focusHabits.filter(h => completedHabitIds.has(h.id)).length

    setTodayStats({
      totalFocusTime,
      completedHabits: completedCount,
      totalPomodoros,
      currentStreak: streak
    })
  }

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [settings.soundEnabled])


  // Save focus session to database - ONLY when pomodoro completes 100%
  const saveCompletedSession = useCallback(async () => {
    if (!selectedHabit) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Use IST timezone for today
    const { getLocalDateString } = await import('@/lib/date-utils')
    const today = getLocalDateString()
    // Use habit's target time as session duration
    const sessionMinutes = selectedHabit.target_time

    // 1. Save focus session record for analytics
    await supabase.from('habit_focus_sessions').insert({
      user_id: user.id,
      habit_id: selectedHabit.id,
      date: today,
      duration: sessionMinutes,
      pomodoros_completed: 1
    })

    // 2. Update habit log with new time value
    const newTotalTime = selectedHabit.time_spent_today + sessionMinutes
    const isNowCompleted = newTotalTime >= selectedHabit.target_time

    await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: selectedHabit.id,
      date: today,
      completed: isNowCompleted,
      value: newTotalTime,
      completed_at: isNowCompleted ? new Date().toISOString() : null,
      duration_minutes: sessionMinutes,
      focus_score: 8 // Default good focus score, can be made interactive later
    }, { onConflict: 'user_id,habit_id,date' })

    // 3. Refresh data
    await fetchFocusHabits()
    await fetchTodayStats()

    // Update selected habit with new values
    setSelectedHabit(prev => prev ? {
      ...prev,
      time_spent_today: newTotalTime,
      completion_status: isNowCompleted ? 'completed' : 'in_progress'
    } : null)

  }, [selectedHabit, settings.workDuration, supabase])

  const handleSessionComplete = useCallback(() => {
    playSound()
    
    if (sessionType === 'work') {
      // ONLY save when work session (pomodoro) completes 100%
      saveCompletedSession()
      
      const newCompleted = completedPomodoros + 1
      setCompletedPomodoros(newCompleted)
      setCurrentSessionTime(0)
      
      // Determine next break type
      if (newCompleted % settings.longBreakInterval === 0) {
        setSessionType('longBreak')
        setTimeLeft(settings.longBreak * 60)
      } else {
        setSessionType('shortBreak')
        setTimeLeft(settings.shortBreak * 60)
      }
      
      if (!settings.autoStartBreaks) setIsRunning(false)
    } else {
      // Break completed, switch to work
      setSessionType('work')
      // Use habit's target time if selected, otherwise use settings
      const workTime = selectedHabit ? selectedHabit.target_time : settings.workDuration
      setTimeLeft(workTime * 60)
      setCurrentSessionTime(0)
      if (!settings.autoStartWork) setIsRunning(false)
    }
  }, [sessionType, completedPomodoros, settings, playSound, saveCompletedSession, selectedHabit])

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
        if (sessionType === 'work') {
          setCurrentSessionTime(prev => prev + 1)
        }
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete()
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft, sessionType, handleSessionComplete])

  const toggleTimer = () => setIsRunning(!isRunning)
  
  const resetTimer = () => {
    setIsRunning(false)
    setCurrentSessionTime(0)
    if (sessionType === 'work') {
      // Use habit's target time if selected, otherwise use settings
      const workTime = selectedHabit ? selectedHabit.target_time : settings.workDuration
      setTimeLeft(workTime * 60)
    } else if (sessionType === 'shortBreak') {
      setTimeLeft(settings.shortBreak * 60)
    } else {
      setTimeLeft(settings.longBreak * 60)
    }
  }

  const skipSession = () => {
    setIsRunning(false)
    setCurrentSessionTime(0)
    if (sessionType === 'work') {
      setSessionType('shortBreak')
      setTimeLeft(settings.shortBreak * 60)
    } else {
      setSessionType('work')
      setTimeLeft(settings.workDuration * 60)
    }
  }

  const switchSessionType = (type: SessionType) => {
    setIsRunning(false)
    setSessionType(type)
    setCurrentSessionTime(0)
    if (type === 'work') {
      // Use habit's target time if selected, otherwise use settings
      const workTime = selectedHabit ? selectedHabit.target_time : settings.workDuration
      setTimeLeft(workTime * 60)
    } else if (type === 'shortBreak') {
      setTimeLeft(settings.shortBreak * 60)
    } else {
      setTimeLeft(settings.longBreak * 60)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    let total: number
    if (sessionType === 'work') {
      // Use habit's target time if selected, otherwise use settings
      total = (selectedHabit ? selectedHabit.target_time : settings.workDuration) * 60
    } else if (sessionType === 'shortBreak') {
      total = settings.shortBreak * 60
    } else {
      total = settings.longBreak * 60
    }
    return ((total - timeLeft) / total) * 100
  }

  const getCategoryEmoji = (cat: string) => {
    const emojis: Record<string, string> = { morning: '🌅', work: '💼', night: '🌙', health: '💪', focus: '🎯' }
    return emojis[cat] || '📋'
  }


  return (
    <DateManipulationBlocker>
    <div 
      ref={containerRef}
      className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}
    >
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
      
      {/* Stats Row - Top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-4 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-primary/20 rounded-xl">
              <Clock className="text-accent-primary" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold">
                {Math.floor(todayStats.totalFocusTime / 60)}h {todayStats.totalFocusTime % 60}m
              </div>
              <div className="text-xs text-foreground-muted">Focus Time</div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 rounded-xl">
              <Timer className="text-red-400" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold">{todayStats.totalPomodoros}</div>
              <div className="text-xs text-foreground-muted">Pomodoros</div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-success/20 rounded-xl">
              <CheckCircle2 className="text-accent-success" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold">{todayStats.completedHabits}</div>
              <div className="text-xs text-foreground-muted">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 rounded-xl">
              <Flame className="text-orange-400" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold">{todayStats.currentStreak}</div>
              <div className="text-xs text-foreground-muted">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Timer Section */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-8 flex flex-col items-center">
        
        {/* Header with Fullscreen */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="text-accent-primary" size={24} />
            <h1 className="text-xl font-bold">Focus Timer</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 bg-background rounded-xl border border-border-subtle hover:bg-surface transition"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-background rounded-xl border border-border-subtle hover:bg-surface transition"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Session Type Tabs */}
        <div className="flex gap-2 mb-8 bg-background p-1.5 rounded-xl">
          {[
            { type: 'work' as SessionType, label: 'Focus', icon: Target },
            { type: 'shortBreak' as SessionType, label: 'Short Break', icon: Coffee },
            { type: 'longBreak' as SessionType, label: 'Long Break', icon: Sparkles }
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => switchSessionType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                sessionType === type
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Selected Habit */}
        {selectedHabit ? (
          <button
            onClick={() => setShowHabitSelector(true)}
            className="flex items-center gap-3 px-5 py-3 bg-background rounded-xl border border-border-subtle hover:border-accent-primary/50 transition mb-8 group"
          >
            <span className="text-xl">{getCategoryEmoji(selectedHabit.category)}</span>
            <div className="text-left">
              <div className="font-medium">{selectedHabit.name}</div>
              <div className="text-sm text-foreground-muted">
                {selectedHabit.time_spent_today}/{selectedHabit.target_time} min today
                {selectedHabit.completion_status === 'completed' && (
                  <span className="ml-2 text-accent-success">✓ Complete</span>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-foreground-muted group-hover:text-accent-primary transition" />
          </button>
        ) : (
          <button
            onClick={() => setShowHabitSelector(true)}
            className="flex items-center gap-2 px-5 py-3 bg-background rounded-xl border border-dashed border-border-subtle hover:border-accent-primary transition mb-8"
          >
            <Target size={18} />
            <span>Select a habit to focus on</span>
          </button>
        )}


        {/* Timer Circle */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-border-subtle"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              className={`transition-all duration-1000 ${
                sessionType === 'work' ? 'text-accent-primary' :
                sessionType === 'shortBreak' ? 'text-accent-success' : 'text-blue-500'
              }`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl md:text-6xl font-mono font-bold ${
              sessionType === 'work' ? 'text-accent-primary' :
              sessionType === 'shortBreak' ? 'text-accent-success' : 'text-blue-500'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-foreground-muted mt-2 text-sm">
              {sessionType === 'work' ? 'Focus Time' : sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={resetTimer}
            className="p-3 bg-background rounded-xl border border-border-subtle hover:bg-surface transition"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
          
          <button
            onClick={toggleTimer}
            disabled={!selectedHabit && sessionType === 'work'}
            className={`p-5 rounded-full transition-all ${
              isRunning 
                ? 'bg-background border-2 border-border-subtle hover:bg-surface' 
                : 'bg-accent-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          
          <button
            onClick={skipSession}
            className="p-3 bg-background rounded-xl border border-border-subtle hover:bg-surface transition"
            title="Skip"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Warning if no habit selected */}
        {!selectedHabit && sessionType === 'work' && (
          <p className="text-sm text-foreground-muted mb-4">
            Select a habit above to start focusing
          </p>
        )}

        {/* Pomodoro Counter */}
        <div className="flex items-center gap-2">
          {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < (completedPomodoros % settings.longBreakInterval)
                  ? 'bg-accent-primary'
                  : 'bg-border-subtle'
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-foreground-muted">
            {completedPomodoros} pomodoros completed
          </span>
        </div>
      </div>


      {/* Habit Selector Modal */}
      {showHabitSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border-subtle max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target size={20} />
                Select Focus Habit
              </h3>
              <button onClick={() => setShowHabitSelector(false)} className="p-2 hover:bg-background rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="text-center py-8 text-foreground-muted">Loading...</div>
              ) : focusHabits.length === 0 ? (
                <div className="text-center py-8">
                  <Target size={40} className="mx-auto mb-3 text-foreground-muted opacity-50" />
                  <p className="text-foreground-muted mb-4">No time-based habits found</p>
                  <Link href="/habits" className="text-accent-primary hover:underline">
                    Create a habit with minutes target →
                  </Link>
                </div>
              ) : (
                focusHabits.map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => { 
                      setSelectedHabit(habit)
                      // Set timer to habit's target time when selecting
                      if (sessionType === 'work' && !isRunning) {
                        setTimeLeft(habit.target_time * 60)
                      }
                      setShowHabitSelector(false) 
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
                      selectedHabit?.id === habit.id
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-border-subtle hover:border-accent-primary/50'
                    }`}
                  >
                    <span className="text-xl">{getCategoryEmoji(habit.category)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{habit.name}</div>
                      <div className="text-sm text-foreground-muted">
                        {habit.time_spent_today}/{habit.target_time} min
                      </div>
                      <div className="w-full bg-border-subtle rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${habit.completion_status === 'completed' ? 'bg-accent-success' : 'bg-accent-primary'}`}
                          style={{ width: `${Math.min((habit.time_spent_today / habit.target_time) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    {habit.completion_status === 'completed' && (
                      <CheckCircle2 className="text-accent-success" size={20} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border-subtle">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings size={20} />
                Focus Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-background rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Timer size={16} />
                  Timer Durations (minutes)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-foreground-muted mb-1">Focus</label>
                    <input
                      type="number"
                      value={settings.workDuration}
                      onChange={(e) => setSettings(s => ({ ...s, workDuration: parseInt(e.target.value) || 25 }))}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      min="1" max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground-muted mb-1">Short Break</label>
                    <input
                      type="number"
                      value={settings.shortBreak}
                      onChange={(e) => setSettings(s => ({ ...s, shortBreak: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      min="1" max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground-muted mb-1">Long Break</label>
                    <input
                      type="number"
                      value={settings.longBreak}
                      onChange={(e) => setSettings(s => ({ ...s, longBreak: parseInt(e.target.value) || 15 }))}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      min="1" max="60"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Long break after</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.longBreakInterval}
                    onChange={(e) => setSettings(s => ({ ...s, longBreakInterval: parseInt(e.target.value) || 4 }))}
                    className="w-20 px-3 py-2 bg-background border border-border-subtle rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    min="2" max="10"
                  />
                  <span className="text-foreground-muted">pomodoros</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => setSettings(s => ({ ...s, autoStartBreaks: e.target.checked }))}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  <span className="text-sm">Auto-start breaks</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartWork}
                    onChange={(e) => setSettings(s => ({ ...s, autoStartWork: e.target.checked }))}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  <span className="text-sm">Auto-start focus sessions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings(s => ({ ...s, soundEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span className="text-sm">Sound notifications</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border-subtle">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2.5 bg-background border border-border-subtle rounded-xl hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('focusSettings', JSON.stringify(settings))
                    if (!isRunning) setTimeLeft(settings.workDuration * 60)
                    setShowSettings(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DateManipulationBlocker>
  )
}
