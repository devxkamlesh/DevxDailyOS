'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Habit } from '@/types/database'
import { Plus, X, Sunrise, Briefcase, Moon, Heart, Target, Edit2, Trash2, Eye, EyeOff, TrendingUp, Calendar, CheckCircle2, BarChart3, Award, Flame, Minus, Zap, Clock, BookOpen, Weight, Dumbbell, Droplets, FileText, Timer, AlertCircle } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useSystemSettings } from '@/lib/useSystemSettings'
import { useToast } from '@/components/ui/Toast'

const categories = ['morning', 'work', 'night', 'health', 'focus'] as const
const categoryIcons: Record<string, LucideIcon> = {
  morning: Sunrise,
  work: Briefcase,
  night: Moon,
  health: Heart,
  focus: Target
}
  
interface HabitWithLog extends Habit {
  completedToday?: boolean
  currentValue?: number
}

interface Analytics {
  weekly: { completed: number; total: number; percentage: number }
  monthly: { completed: number; total: number; percentage: number }
  yearly: { completed: number; total: number; percentage: number }
  currentStreak: number
  longestStreak: number
  totalCompletions: number
}

export default function HabitsPage() {
  const { showToast } = useToast()
  const [habits, setHabits] = useState<HabitWithLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [analyticsView, setAnalyticsView] = useState<'week' | 'month' | 'year'>('week')
  const [analytics, setAnalytics] = useState<Analytics>({
    weekly: { completed: 0, total: 0, percentage: 0 },
    monthly: { completed: 0, total: 0, percentage: 0 },
    yearly: { completed: 0, total: 0, percentage: 0 },
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'morning' as typeof categories[number],
    type: 'boolean' as 'boolean' | 'numeric',
    target_value: 1,
    target_unit: '',
    is_active: true,
    requires_focus: false,
    target_time: 0,
    min_session_time: 25
  })
  const [saving, setSaving] = useState(false)
  const [limitError, setLimitError] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const { settings: systemSettings } = useSystemSettings()

  // Auto-update focus settings when unit changes to minutes
  useEffect(() => {
    if (formData.type === 'numeric' && formData.target_unit === 'minutes') {
      setFormData(prev => ({
        ...prev,
        requires_focus: true,
        target_time: prev.target_value
      }))
    } else if (formData.type === 'numeric' && formData.target_unit !== 'minutes') {
      // Reset focus settings for non-time units
      setFormData(prev => ({
        ...prev,
        requires_focus: false,
        target_time: 0
      }))
    }
  }, [formData.target_unit, formData.target_value, formData.type])

  const calculateAnalytics = async (habitData: Habit[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Get date ranges
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch all logs for analytics
    const { data: allLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!allLogs) return

    // Calculate weekly stats
    const weekLogs = allLogs.filter(log => log.date >= weekAgo && log.date <= today)
    const weekCompleted = weekLogs.filter(log => log.completed).length
    const weekTotal = habitData.filter(h => h.is_active).length * 7
    
    // Calculate monthly stats
    const monthLogs = allLogs.filter(log => log.date >= monthAgo && log.date <= today)
    const monthCompleted = monthLogs.filter(log => log.completed).length
    const monthTotal = habitData.filter(h => h.is_active).length * 30
    
    // Calculate yearly stats
    const yearLogs = allLogs.filter(log => log.date >= yearAgo && log.date <= today)
    const yearCompleted = yearLogs.filter(log => log.completed).length
    const yearTotal = habitData.filter(h => h.is_active).length * 365

    // Calculate streaks
    const sortedDates = [...new Set(allLogs.map(log => log.date))].sort().reverse()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i]
      const dayLogs = allLogs.filter(log => log.date === date && log.completed)
      
      if (dayLogs.length > 0) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        if (i === 0) currentStreak = 0
        tempStreak = 0
      }
    }

    setAnalytics({
      weekly: {
        completed: weekCompleted,
        total: weekTotal,
        percentage: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
      },
      monthly: {
        completed: monthCompleted,
        total: monthTotal,
        percentage: monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0
      },
      yearly: {
        completed: yearCompleted,
        total: yearTotal,
        percentage: yearTotal > 0 ? Math.round((yearCompleted / yearTotal) * 100) : 0
      },
      currentStreak,
      longestStreak,
      totalCompletions: allLogs.filter(log => log.completed).length
    })
  }

  const fetchHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('created_at')
    
    if (!data) {
      setLoading(false)
      return
    }

    // Check today's completion status
    const today = new Date().toISOString().split('T')[0]
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('habit_id, completed, value')
      .eq('date', today)

    const habitsWithStatus = data.map(habit => {
      const log = logs?.find(l => l.habit_id === habit.id)
      const currentValue = log?.value || 0
      const completedToday = log ? (habit.type === 'boolean' ? log.completed : currentValue >= (habit.target_value || 1)) : false
      return { ...habit, completedToday, currentValue }
    })
    
    setHabits(habitsWithStatus)
    await calculateAnalytics(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        showToast('Please log in again', 'error')
        return
      }

      // Check active habit limit (30 max) - only for new habits
      if (!editingHabit) {
        const activeHabitsCount = habits.filter(h => h.is_active).length
        if (activeHabitsCount >= 30) {
          showToast('You have reached the maximum limit of 30 active habits. Please archive some habits before creating new ones.', 'warning')
          setSaving(false)
          return
        }
      }

      // Ensure profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
          showToast('Error creating profile. Please contact support.', 'error')
          return
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        type: formData.type,
        target_value: formData.type === 'numeric' ? formData.target_value : null,
        target_unit: formData.type === 'numeric' ? formData.target_unit : null,
        is_active: formData.is_active
        // Note: Focus fields (requires_focus, target_time, min_session_time) removed until database columns are added
      }

      if (editingHabit) {
        const { error } = await supabase.from('habits').update(payload).eq('id', editingHabit.id)
        if (error) {
          console.error('Update error:', error)
          showToast('Error updating habit: ' + error.message, 'error')
          return
        }
      } else {
        // Check habit limit before creating
        if (systemSettings.max_habits_per_user > 0 && habits.length >= systemSettings.max_habits_per_user) {
          setLimitError(`You've reached the maximum limit of ${systemSettings.max_habits_per_user} habits`)
          setSaving(false)
          return
        }
        
        const { error } = await supabase.from('habits').insert({ 
          ...payload, 
          user_id: user.id, 
          emoji: formData.category 
        })
        if (error) {
          console.error('Insert error:', error)
          showToast('Error creating habit: ' + error.message, 'error')
          return
        }
      }

      resetForm()
      fetchHabits()
    } catch (error: any) {
      console.error('Error saving habit:', error)
      showToast('Error: ' + (error.message || 'Unknown error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'morning',
      type: 'boolean',
      target_value: 1,
      target_unit: '',
      is_active: true,
      requires_focus: false,
      target_time: 0,
      min_session_time: 25
    })
    setShowForm(false)
    setEditingHabit(null)
  }

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit)
    
    // Auto-detect if this is a time-based habit
    const isTimeBasedHabit = habit.type === 'numeric' && habit.target_unit === 'minutes'
    
    setFormData({
      name: habit.name,
      description: habit.description || '',
      category: habit.category as typeof categories[number],
      type: habit.type,
      target_value: habit.target_value || 1,
      target_unit: habit.target_unit || '',
      is_active: habit.is_active,
      requires_focus: isTimeBasedHabit ? true : (habit.requires_focus || false),
      target_time: isTimeBasedHabit ? (habit.target_value || 0) : (habit.target_time || 0),
      min_session_time: habit.min_session_time || 25
    })
    setShowForm(true)
  }

  const toggleHabitActive = async (habit: Habit) => {
    await supabase
      .from('habits')
      .update({ is_active: !habit.is_active })
      .eq('id', habit.id)
    fetchHabits()
  }

  const deleteHabit = async (id: string) => {
    if (!confirm('Delete this habit?')) return
    await supabase.from('habits').delete().eq('id', id)
    fetchHabits()
  }

  const filteredHabits = activeTab === 'all' 
    ? habits 
    : habits.filter(h => h.category === activeTab)

  const activeHabits = habits.filter(h => h.is_active)
  const totalStreak = activeHabits.reduce((sum, h) => sum + (h.completedToday ? 1 : 0), 0)
  const avgCompletion = activeHabits.length > 0 
    ? Math.round(activeHabits.filter(h => h.completedToday).length / activeHabits.length * 100)
    : 0

  const currentAnalytics = analytics[analyticsView === 'week' ? 'weekly' : analyticsView === 'month' ? 'monthly' : 'yearly']

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Habits</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white rounded-lg hover:opacity-90 transition text-sm"
          >
            <Plus size={16} />
            New
          </button>
        </div>
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-accent-primary" />
            <span className="text-foreground-muted">{activeHabits.length} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent-success" />
            <span className="text-foreground-muted">{avgCompletion}% Today</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-foreground-muted">{analytics.currentStreak} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 rounded-2xl p-6 border border-accent-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/20 rounded-lg">
              <BarChart3 size={24} className="text-accent-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Analytics</h2>
              <p className="text-sm text-foreground-muted">Track your progress over time</p>
            </div>
          </div>
          <div className="flex bg-surface rounded-lg p-1">
            <button
              onClick={() => setAnalyticsView('week')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                analyticsView === 'week' 
                  ? 'bg-accent-primary text-white' 
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setAnalyticsView('month')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                analyticsView === 'month' 
                  ? 'bg-accent-primary text-white' 
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setAnalyticsView('year')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                analyticsView === 'year' 
                  ? 'bg-accent-primary text-white' 
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completion Rate */}
          <div className="bg-surface p-5 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-accent-success/10 rounded-lg">
                <CheckCircle2 size={20} className="text-accent-success" />
              </div>
              <span className="text-2xl font-bold text-accent-success">{currentAnalytics.percentage}%</span>
            </div>
            <h3 className="font-medium mb-1">Completion Rate</h3>
            <p className="text-sm text-foreground-muted">
              {currentAnalytics.completed} of {currentAnalytics.total} completed
            </p>
            <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-success transition-all duration-500"
                style={{ width: `${currentAnalytics.percentage}%` }}
              />
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-surface p-5 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Flame size={20} className="text-orange-500" />
              </div>
              <span className="text-2xl font-bold text-orange-500">{analytics.currentStreak}</span>
            </div>
            <h3 className="font-medium mb-1">Current Streak</h3>
            <p className="text-sm text-foreground-muted">
              {analytics.currentStreak === 0 ? 'Start today!' : 'Days in a row'}
            </p>
          </div>

          {/* Longest Streak */}
          <div className="bg-surface p-5 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Award size={20} className="text-yellow-500" />
              </div>
              <span className="text-2xl font-bold text-yellow-500">{analytics.longestStreak}</span>
            </div>
            <h3 className="font-medium mb-1">Longest Streak</h3>
            <p className="text-sm text-foreground-muted">
              {analytics.longestStreak === 0 ? 'No streak yet' : 'Personal best'}
            </p>
          </div>

          {/* Total Completions */}
          <div className="bg-surface p-5 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                <Target size={20} className="text-accent-primary" />
              </div>
              <span className="text-2xl font-bold text-accent-primary">{analytics.totalCompletions}</span>
            </div>
            <h3 className="font-medium mb-1">Total Completions</h3>
            <p className="text-sm text-foreground-muted">
              All time achievements
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
            activeTab === 'all' 
              ? 'bg-accent-primary text-white' 
              : 'bg-surface text-foreground-muted hover:text-foreground'
          }`}
        >
          All
        </button>
        {categories.map(cat => {
          const Icon = categoryIcons[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition capitalize ${
                activeTab === cat 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-surface text-foreground-muted hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {cat}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-2xl border border-border-subtle animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-background rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-background rounded w-32 mb-2" />
                  <div className="h-3 bg-background rounded w-20" />
                </div>
              </div>
              <div className="h-4 bg-background rounded w-full mb-2" />
              <div className="h-4 bg-background rounded w-3/4 mb-4" />
              <div className="h-12 bg-background rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Target size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted mb-4">No habits in this category</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-accent-primary hover:underline"
          >
            Create your first habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map(habit => {
            const Icon = categoryIcons[habit.category as keyof typeof categoryIcons]
            return (
              <div 
                key={habit.id}
                className={`relative bg-surface p-6 rounded-2xl border transition-all duration-200 group ${
                  habit.completedToday 
                    ? 'border-accent-success/50 bg-gradient-to-br from-accent-success/10 to-accent-success/5 shadow-lg shadow-accent-success/10' 
                    : 'border-border-subtle hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5'
                } ${!habit.is_active ? 'opacity-50' : ''}`}
              >
                {/* Completion Badge */}
                {habit.completedToday && (
                  <div className="absolute -top-2 -right-2 bg-accent-success text-white rounded-full p-1.5 shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl transition-colors ${
                      habit.completedToday 
                        ? 'bg-accent-success/20' 
                        : 'bg-accent-primary/10 group-hover:bg-accent-primary/20'
                    }`}>
                      {Icon && <Icon size={24} className={habit.completedToday ? 'text-accent-success' : 'text-accent-primary'} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{habit.name}</h3>
                      <p className="text-xs text-foreground-muted capitalize flex items-center gap-1">
                        {habit.category}
                        {habit.type === 'numeric' && (
                          <span className="ml-1 px-2 py-0.5 bg-background rounded-full">
                            {habit.target_value} {habit.target_unit}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(habit)}
                      className="p-2 text-foreground-muted hover:text-accent-primary hover:bg-background rounded-lg transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 text-foreground-muted hover:text-red-400 hover:bg-background rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {habit.description && (
                  <p className="text-sm text-foreground-muted mb-4 line-clamp-2 leading-relaxed">{habit.description}</p>
                )}

                {/* Progress Display for Numeric Habits */}
                {habit.type === 'numeric' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground-muted">Progress</span>
                      <span className="font-semibold">
                        {habit.currentValue || 0} / {habit.target_value} {habit.target_unit}
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-primary transition-all duration-300"
                        style={{ width: `${Math.min(((habit.currentValue || 0) / (habit.target_value || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {habit.type === 'numeric' ? (
                    <>
                      {/* Time-based habits redirect to Focus page */}
                      {habit.target_unit === 'minutes' ? (
                        <button
                          onClick={() => router.push(`/focus?habit=${habit.id}`)}
                          disabled={habit.completedToday}
                          className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            habit.completedToday
                              ? 'bg-accent-success text-white cursor-default shadow-lg shadow-accent-success/20'
                              : 'bg-gradient-to-r from-accent-primary to-blue-500 text-white hover:opacity-90 shadow-lg shadow-accent-primary/20'
                          }`}
                        >
                          {habit.completedToday ? (
                            <>
                              <CheckCircle2 size={18} />
                              Completed Today
                            </>
                          ) : (
                            <>
                              <Timer size={18} />
                              Start Focus Session
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          {/* Increment/Decrement Controls for non-time habits */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const today = new Date().toISOString().split('T')[0]
                                const { data: { user } } = await supabase.auth.getUser()
                                if (!user) return

                                const newValue = Math.max(0, (habit.currentValue || 0) - 1)
                                const completed = newValue >= (habit.target_value || 1)

                                await supabase.from('habit_logs').upsert({
                                  user_id: user.id,
                                  habit_id: habit.id,
                                  date: today,
                                  completed,
                                  value: newValue,
                                  completed_at: completed ? new Date().toISOString() : null,
                                  duration_minutes: habit.target_unit === 'minutes' ? newValue : null
                                }, { onConflict: 'user_id,habit_id,date' })

                                fetchHabits()
                              }}
                              disabled={(habit.currentValue || 0) === 0}
                              className="flex-1 py-3 bg-surface border-2 border-border-subtle rounded-xl hover:border-accent-primary/50 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            >
                              <Minus size={18} />
                              -1
                            </button>
                            
                            <button
                              onClick={async () => {
                                const today = new Date().toISOString().split('T')[0]
                                const { data: { user } } = await supabase.auth.getUser()
                                if (!user) return

                                const newValue = (habit.currentValue || 0) + 1
                                const completed = newValue >= (habit.target_value || 1)

                                await supabase.from('habit_logs').upsert({
                                  user_id: user.id,
                                  habit_id: habit.id,
                                  date: today,
                                  completed,
                                  value: newValue,
                                  completed_at: completed ? new Date().toISOString() : null,
                                  duration_minutes: habit.target_unit === 'minutes' ? newValue : null
                                }, { onConflict: 'user_id,habit_id,date' })

                                fetchHabits()
                              }}
                              className="flex-1 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 font-medium shadow-lg shadow-accent-primary/20"
                            >
                              <Plus size={18} />
                              +1
                            </button>
                          </div>

                          {/* Quick Complete Button for non-time habits only */}
                          {!habit.completedToday && habit.target_unit !== 'minutes' && (
                            <button
                              onClick={async () => {
                                const today = new Date().toISOString().split('T')[0]
                                const { data: { user } } = await supabase.auth.getUser()
                                if (!user) return

                                await supabase.from('habit_logs').upsert({
                                  user_id: user.id,
                                  habit_id: habit.id,
                                  date: today,
                                  completed: true,
                                  value: habit.target_value,
                                  completed_at: new Date().toISOString(),
                                  duration_minutes: habit.type === 'numeric' && habit.target_unit === 'minutes' ? habit.target_value : null
                                }, { onConflict: 'user_id,habit_id,date' })

                                fetchHabits()
                              }}
                              className="w-full py-2 bg-accent-success/10 text-accent-success rounded-lg hover:bg-accent-success/20 transition text-sm font-medium"
                            >
                              Complete Target ({habit.target_value} {habit.target_unit})
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={async () => {
                        const today = new Date().toISOString().split('T')[0]
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) return

                        await supabase.from('habit_logs').upsert({
                          user_id: user.id,
                          habit_id: habit.id,
                          date: today,
                          completed: !habit.completedToday,
                          value: null,
                          completed_at: !habit.completedToday ? new Date().toISOString() : null
                        }, { onConflict: 'user_id,habit_id,date' })

                        fetchHabits()
                      }}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        habit.completedToday
                          ? 'bg-accent-success text-white hover:opacity-90 shadow-lg shadow-accent-success/20'
                          : 'bg-accent-primary text-white hover:opacity-90 hover:shadow-lg hover:shadow-accent-primary/20'
                      }`}
                    >
                      {habit.completedToday ? (
                        <>
                          <CheckCircle2 size={18} />
                          Done Today
                        </>
                      ) : (
                        <>
                          <Target size={18} />
                          Mark Done
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleHabitActive(habit)}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                      habit.is_active 
                        ? 'bg-accent-success/10 text-accent-success hover:bg-accent-success/20' 
                        : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                    }`}
                  >
                    {habit.is_active ? (
                      <>
                        <Eye size={14} />
                        Tracking
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        Paused
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-8 rounded-2xl w-full max-w-5xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h2>
              <button 
                onClick={resetForm} 
                className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name and Description */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Habit Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="e.g., Morning Meditation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="Why is this habit important to you?"
                  />
                </div>
              </div>

              {/* Row 2: Category Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Category *</label>
                <div className="flex flex-wrap gap-3">
                  {categories.map(cat => {
                    const Icon = categoryIcons[cat]
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all capitalize font-medium ${
                          formData.category === cat
                            ? 'bg-accent-primary text-white border-accent-primary shadow-lg shadow-accent-primary/20'
                            : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50 hover:text-foreground'
                        }`}
                      >
                        <Icon size={20} />
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row 3: Tracking Type */}
              <div>
                <label className="block text-sm font-medium mb-3">Tracking Type *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.type === 'boolean'
                      ? 'bg-accent-primary/10 border-accent-primary shadow-lg shadow-accent-primary/10'
                      : 'bg-background border-border-subtle hover:border-accent-primary/50'
                  }`}>
                    <input
                      type="radio"
                      checked={formData.type === 'boolean'}
                      onChange={() => setFormData({ ...formData, type: 'boolean' })}
                      className="w-5 h-5 accent-accent-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">Yes / No</div>
                      <div className="text-sm text-foreground-muted">Simple completion tracking</div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.type === 'numeric'
                      ? 'bg-accent-primary/10 border-accent-primary shadow-lg shadow-accent-primary/10'
                      : 'bg-background border-border-subtle hover:border-accent-primary/50'
                  }`}>
                    <input
                      type="radio"
                      checked={formData.type === 'numeric'}
                      onChange={() => setFormData({ ...formData, type: 'numeric' })}
                      className="w-5 h-5 accent-accent-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">Numeric Target</div>
                      <div className="text-sm text-foreground-muted">Track values (e.g., 30 min, 10 pages)</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Row 4: Numeric Target Fields (conditional) */}
              {formData.type === 'numeric' && (
                <div className="p-5 bg-background rounded-xl border border-border-subtle">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {formData.target_unit === 'minutes' ? 'Min Session Time (minutes) *' : 'Target Value *'}
                      </label>
                      <input
                        type="number"
                        value={formData.target_value}
                        onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                        min={1}
                        placeholder={formData.target_unit === 'minutes' ? 'e.g., 25' : 'e.g., 30'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Unit *</label>
                      <div className="relative">
                        {/* Icon overlay - positioned above select */}
                        {formData.target_unit && formData.target_unit !== '' && (
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                            {formData.target_unit === 'minutes' && <Clock size={16} className="text-blue-500" />}
                            {formData.target_unit === 'pages' && <BookOpen size={16} className="text-green-500" />}
                            {formData.target_unit === 'kg' && <Weight size={16} className="text-purple-500" />}
                            {formData.target_unit === 'reps' && <Dumbbell size={16} className="text-orange-500" />}
                            {formData.target_unit === 'liters' && <Droplets size={16} className="text-blue-400" />}
                            {formData.target_unit === 'other' && <FileText size={16} className="text-gray-500" />}
                          </div>
                        )}
                        
                        <select
                          value={formData.target_unit}
                          onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                          className={`w-full py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition relative ${
                            formData.target_unit && formData.target_unit !== '' ? 'pl-10 pr-4' : 'px-4'
                          }`}
                          required={formData.type === 'numeric'}
                        >
                          <option value="">Select a unit</option>
                          <option value="minutes">minutes (auto-enables focus)</option>
                          <option value="pages">pages</option>
                          <option value="kg">kg</option>
                          <option value="reps">reps</option>
                          <option value="liters">liters</option>
                          <option value="other">Other (specify below)</option>
                        </select>
                      </div>
                      {formData.target_unit === 'other' && (
                        <input
                          type="text"
                          value=""
                          onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                          className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition mt-2"
                          placeholder="Enter your unit (e.g., glasses, steps, words)"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 5: Focus Settings (only for numeric habits) */}
              {formData.type === 'numeric' && (
                <div className="p-5 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Zap size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Focus Integration</h3>
                      <p className="text-sm text-foreground-muted">
                        {formData.target_unit === 'minutes' 
                          ? 'Automatically detected time-based habit - enable focus sessions'
                          : 'Enable focused work sessions for this habit'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Auto-detect for minutes */}
                  {formData.target_unit === 'minutes' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle2 size={20} className="text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium text-green-700 dark:text-green-400">
                            Focus integration auto-enabled for time-based habit
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500">
                            Using {formData.target_value} minutes as both target and session time
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Manual focus integration for other units */
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requires_focus}
                          onChange={(e) => setFormData({ ...formData, requires_focus: e.target.checked })}
                          className="w-5 h-5 accent-blue-500"
                        />
                        <span className="font-medium">This habit requires focused work time</span>
                      </label>

                      {formData.requires_focus && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                          <div>
                            <label className="block text-sm font-medium mb-2">Target Focus Time (minutes) *</label>
                            <input
                              type="number"
                              value={formData.target_time}
                              onChange={(e) => setFormData({ ...formData, target_time: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                              min={1}
                              placeholder="e.g., 60"
                              required={formData.requires_focus}
                            />
                            <p className="text-xs text-foreground-muted mt-1">Daily focus time goal</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Min Session Time (minutes)</label>
                            <select
                              value={formData.min_session_time}
                              onChange={(e) => setFormData({ ...formData, min_session_time: parseInt(e.target.value) })}
                              className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={25}>25 minutes (Pomodoro)</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                              <option value={90}>90 minutes</option>
                            </select>
                            <p className="text-xs text-foreground-muted mt-1">Minimum session duration</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3.5 bg-background border-2 border-border-subtle text-foreground rounded-xl hover:bg-surface hover:border-foreground-muted transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="flex-1 py-3.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-lg shadow-accent-primary/20"
                >
                  {saving ? 'Saving...' : editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
