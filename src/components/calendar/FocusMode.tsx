'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Play, Pause, Square, RotateCcw, Volume2, VolumeX, 
  Coffee, Zap, Target, Clock, Settings, X, CheckCircle2
} from 'lucide-react'

interface FocusSession {
  id: string
  title: string
  duration: number // in minutes
  type: 'pomodoro' | 'deep_work' | 'break'
  isActive: boolean
  timeLeft: number // in seconds
  completedSessions: number
  totalSessions: number
}

interface FocusSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartWork: boolean
  soundEnabled: boolean
  notifications: boolean
}

export default function FocusMode({ 
  onClose, 
  initialTask 
}: { 
  onClose: () => void
  initialTask?: { title: string; duration: number }
}) {
  const [session, setSession] = useState<FocusSession>({
    id: 'focus-1',
    title: initialTask?.title || 'Focus Session',
    duration: initialTask?.duration || 25,
    type: 'pomodoro',
    isActive: false,
    timeLeft: (initialTask?.duration || 25) * 60,
    completedSessions: 0,
    totalSessions: 4
  })

  const [settings, setSettings] = useState<FocusSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notifications: true
  })

  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (session.isActive && session.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSession(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }))
      }, 1000)
    } else if (session.timeLeft === 0) {
      handleSessionComplete()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session.isActive, session.timeLeft])

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/notification.mp3')
    
    // Request notification permission
    if ('Notification' in window && settings.notifications) {
      Notification.requestPermission()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleSessionComplete = () => {
    setSession(prev => ({ ...prev, isActive: false }))
    
    // Play sound
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }

    // Show notification
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`${session.type === 'pomodoro' ? 'Work' : 'Break'} session complete!`, {
        body: `Time for a ${session.type === 'pomodoro' ? 'break' : 'work session'}`,
        icon: '/favicon.ico'
      })
    }

    // Auto-start next session
    if (session.type === 'pomodoro') {
      const isLongBreak = (session.completedSessions + 1) % settings.longBreakInterval === 0
      const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration
      
      setSession(prev => ({
        ...prev,
        type: 'break',
        duration: breakDuration,
        timeLeft: breakDuration * 60,
        completedSessions: prev.completedSessions + 1,
        isActive: settings.autoStartBreaks
      }))
    } else {
      setSession(prev => ({
        ...prev,
        type: 'pomodoro',
        duration: settings.workDuration,
        timeLeft: settings.workDuration * 60,
        isActive: settings.autoStartWork
      }))
    }
  }

  const startSession = () => {
    setSession(prev => ({ ...prev, isActive: true }))
  }

  const pauseSession = () => {
    setSession(prev => ({ ...prev, isActive: false }))
  }

  const resetSession = () => {
    const duration = session.type === 'pomodoro' ? settings.workDuration : 
                    session.completedSessions % settings.longBreakInterval === 0 ? 
                    settings.longBreakDuration : settings.shortBreakDuration
    
    setSession(prev => ({
      ...prev,
      isActive: false,
      timeLeft: duration * 60,
      duration
    }))
  }

  const skipSession = () => {
    setSession(prev => ({ ...prev, timeLeft: 0 }))
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    const totalSeconds = session.duration * 60
    return ((totalSeconds - session.timeLeft) / totalSeconds) * 100
  }

  const getSessionIcon = () => {
    switch (session.type) {
      case 'pomodoro':
        return <Target className="text-red-500" size={32} />
      case 'break':
        return <Coffee className="text-green-500" size={32} />
      default:
        return <Zap className="text-blue-500" size={32} />
    }
  }

  const getSessionColor = () => {
    switch (session.type) {
      case 'pomodoro':
        return 'from-red-500 to-red-600'
      case 'break':
        return 'from-green-500 to-green-600'
      default:
        return 'from-blue-500 to-blue-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface rounded-3xl max-w-2xl w-full mx-4 p-8 border border-border-subtle relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {getSessionIcon()}
            <div>
              <h2 className="text-2xl font-bold">{session.title}</h2>
              <p className="text-foreground-muted capitalize">
                {session.type === 'pomodoro' ? 'Focus Time' : 'Break Time'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 hover:bg-background rounded-xl transition"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 hover:bg-background rounded-xl transition"
            >
              <Zap size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-3 hover:bg-background rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="relative text-center mb-8">
          {/* Circular Progress */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-background"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                className={`transition-all duration-1000 ${
                  session.type === 'pomodoro' ? 'text-red-500' : 'text-green-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Timer Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold mb-2">
                  {formatTime(session.timeLeft)}
                </div>
                <div className="text-sm text-foreground-muted">
                  Session {session.completedSessions + 1} of {session.totalSessions}
                </div>
              </div>
            </div>
          </div>

          {/* Session Progress */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: session.totalSessions }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < session.completedSessions
                    ? 'bg-green-500'
                    : i === session.completedSessions
                    ? session.type === 'pomodoro'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                    : 'bg-background'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="relative flex justify-center gap-4 mb-6">
          {!session.isActive ? (
            <button
              onClick={startSession}
              className={`flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${getSessionColor()} text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105`}
            >
              <Play size={24} />
              <span className="text-lg font-semibold">Start</span>
            </button>
          ) : (
            <button
              onClick={pauseSession}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Pause size={24} />
              <span className="text-lg font-semibold">Pause</span>
            </button>
          )}
          
          <button
            onClick={resetSession}
            className="flex items-center gap-3 px-6 py-4 bg-background hover:bg-surface border border-border-subtle rounded-2xl transition-all"
          >
            <RotateCcw size={20} />
            <span>Reset</span>
          </button>
          
          <button
            onClick={skipSession}
            className="flex items-center gap-3 px-6 py-4 bg-background hover:bg-surface border border-border-subtle rounded-2xl transition-all"
          >
            <Square size={20} />
            <span>Skip</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="relative grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-background rounded-xl">
            <div className="text-2xl font-bold text-red-500">{session.completedSessions}</div>
            <div className="text-sm text-foreground-muted">Completed</div>
          </div>
          <div className="p-4 bg-background rounded-xl">
            <div className="text-2xl font-bold text-blue-500">
              {Math.floor((session.completedSessions * settings.workDuration) / 60)}h
            </div>
            <div className="text-sm text-foreground-muted">Focus Time</div>
          </div>
          <div className="p-4 bg-background rounded-xl">
            <div className="text-2xl font-bold text-green-500">
              {session.totalSessions - session.completedSessions}
            </div>
            <div className="text-sm text-foreground-muted">Remaining</div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute inset-0 bg-surface rounded-3xl p-8 z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Focus Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-background rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Duration Settings */}
              <div>
                <h4 className="font-semibold mb-3">Session Durations</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-foreground-muted mb-1">Work (min)</label>
                    <input
                      type="number"
                      value={settings.workDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-muted mb-1">Short Break (min)</label>
                    <input
                      type="number"
                      value={settings.shortBreakDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-muted mb-1">Long Break (min)</label>
                    <input
                      type="number"
                      value={settings.longBreakDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-start Settings */}
              <div>
                <h4 className="font-semibold mb-3">Auto-start</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.autoStartBreaks}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoStartBreaks: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Auto-start breaks</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.autoStartWork}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoStartWork: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Auto-start work sessions</span>
                  </label>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="font-semibold mb-3">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <Volume2 size={16} />
                    <span>Sound notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Browser notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}