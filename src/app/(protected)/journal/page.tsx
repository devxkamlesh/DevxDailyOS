'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { BookOpen, Smile, Meh, Frown, Heart, Trophy, AlertCircle, ChevronLeft, ChevronRight, Save, Sparkles } from 'lucide-react'

interface JournalEntry {
  id?: string
  date: string
  mood: string
  reflection: string
  gratitude: string
  wins: string
  challenges: string
}

const moods = [
  { value: 'great', label: 'Great', emoji: '😄', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  { value: 'bad', label: 'Bad', emoji: '😔', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
  { value: 'terrible', label: 'Terrible', emoji: '😢', color: 'text-red-500 bg-red-500/10 border-red-500/30' },
]

export default function JournalPage() {
  const { showToast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [entry, setEntry] = useState<JournalEntry>({
    date: selectedDate,
    mood: '',
    reflection: '',
    gratitude: '',
    wins: '',
    challenges: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [habitStats, setHabitStats] = useState({ completed: 0, total: 0 })
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchEntry()
    fetchHabitStats()
    
    // Cleanup timer on unmount or date change
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
    }
  }, [selectedDate])

  const fetchEntry = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('daily_journal')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .single()

      if (data) {
        setEntry(data)
      } else {
        setEntry({
          date: selectedDate,
          mood: '',
          reflection: '',
          gratitude: '',
          wins: '',
          challenges: ''
        })
      }
    } catch (error) {
      console.error('Error fetching journal:', error)
    }
    setLoading(false)
  }

  const fetchHabitStats = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('id').eq('user_id', user.id).eq('is_active', true),
        supabase.from('habit_logs').select('completed').eq('user_id', user.id).eq('date', selectedDate).eq('completed', true)
      ])

      setHabitStats({
        completed: logsRes.data?.length || 0,
        total: habitsRes.data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching habit stats:', error)
    }
  }

  const saveEntry = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        date: selectedDate,
        mood: entry.mood,
        reflection: entry.reflection,
        gratitude: entry.gratitude,
        wins: entry.wins,
        challenges: entry.challenges
      }

      const { error } = await supabase
        .from('daily_journal')
        .upsert(payload, { onConflict: 'user_id,date' })

      if (error) {
        console.error('Error saving journal:', error)
        showToast('Error saving journal entry', 'error')
      } else {
        setSaved(true)
        showToast('Journal entry saved!', 'success')
        
        // Clear existing timer if any
        if (savedTimerRef.current) {
          clearTimeout(savedTimerRef.current)
        }
        
        // Set timer with cleanup
        savedTimerRef.current = setTimeout(() => {
          setSaved(false)
          savedTimerRef.current = null
        }, 2000)
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setSaving(false)
  }

  const changeDate = (days: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const canEdit = isToday // Only allow editing today's entry
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-accent-primary" />
            Daily Journal
          </h1>
          <p className="text-foreground-muted">Reflect on your day and track your mood</p>
        </div>
        {canEdit ? (
          <button
            onClick={saveEntry}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <>
                <Sparkles size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                Save Entry
              </>
            )}
          </button>
        ) : (
          <span className="text-sm text-foreground-muted px-4 py-2 bg-surface rounded-lg border border-border-subtle">
            View Only
          </span>
        )}
      </div>

      {/* Date Navigation */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle flex items-center justify-between">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-background rounded-lg transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="font-semibold">{formattedDate}</div>
          {isToday ? (
            <span className="text-xs text-accent-primary">Today</span>
          ) : (
            <span className="text-xs text-yellow-500">View only</span>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={isToday}
          className="p-2 hover:bg-background rounded-lg transition disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Habit Stats for the Day */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle">
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">Habits completed this day</span>
          <span className="font-bold text-lg">
            {habitStats.completed}/{habitStats.total}
            {habitStats.total > 0 && habitStats.completed === habitStats.total && (
              <span className="ml-2 text-accent-success">🎉 Perfect!</span>
            )}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface p-8 rounded-xl border border-border-subtle text-center text-foreground-muted">
          Loading...
        </div>
      ) : (
        <>
          {/* Mood Selection */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Smile size={20} className="text-yellow-500" />
              How are you feeling?
            </h2>
            <div className="flex gap-3 flex-wrap">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => canEdit && setEntry({ ...entry, mood: mood.value })}
                  disabled={!canEdit}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    entry.mood === mood.value
                      ? mood.color + ' border-current'
                      : 'bg-background border-border-subtle hover:border-accent-primary/30'
                  } ${!canEdit ? 'cursor-default opacity-80' : ''}`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>



          {/* Reflection */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" />
              Daily Reflection
            </h2>
            <textarea
              value={entry.reflection}
              onChange={(e) => canEdit && setEntry({ ...entry, reflection: e.target.value })}
              placeholder="How was your day? What happened? What did you learn?"
              readOnly={!canEdit}
              className={`w-full h-32 p-4 bg-background border border-border-subtle rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary ${!canEdit ? 'cursor-default opacity-80' : ''}`}
            />
          </div>

          {/* Gratitude */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Heart size={20} className="text-pink-500" />
              Gratitude
            </h2>
            <textarea
              value={entry.gratitude}
              onChange={(e) => canEdit && setEntry({ ...entry, gratitude: e.target.value })}
              placeholder="What are you grateful for today? List 3 things..."
              readOnly={!canEdit}
              className={`w-full h-24 p-4 bg-background border border-border-subtle rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary ${!canEdit ? 'cursor-default opacity-80' : ''}`}
            />
          </div>

          {/* Wins */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" />
              Today's Wins
            </h2>
            <textarea
              value={entry.wins}
              onChange={(e) => canEdit && setEntry({ ...entry, wins: e.target.value })}
              placeholder="What did you accomplish today? What went well?"
              readOnly={!canEdit}
              className={`w-full h-24 p-4 bg-background border border-border-subtle rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary ${!canEdit ? 'cursor-default opacity-80' : ''}`}
            />
          </div>

          {/* Challenges */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              Challenges & Improvements
            </h2>
            <textarea
              value={entry.challenges}
              onChange={(e) => canEdit && setEntry({ ...entry, challenges: e.target.value })}
              placeholder="What challenges did you face? What could you improve tomorrow?"
              readOnly={!canEdit}
              className={`w-full h-24 p-4 bg-background border border-border-subtle rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary ${!canEdit ? 'cursor-default opacity-80' : ''}`}
            />
          </div>
        </>
      )}
    </div>
  )
}
