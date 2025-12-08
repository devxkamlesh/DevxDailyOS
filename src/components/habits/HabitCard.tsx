'use client'

import { Habit, HabitLog } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Check, Minus, Plus, Sunrise, Briefcase, Moon, Heart, Target } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

const categoryIcons: Record<string, LucideIcon> = {
  morning: Sunrise,
  work: Briefcase,
  night: Moon,
  health: Heart,
  focus: Target
}

interface HabitCardProps {
  habit: Habit
  log: HabitLog | null
  onUpdate: () => void
}

export default function HabitCard({ habit, log, onUpdate }: HabitCardProps) {
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(log?.value || 0)
  const supabase = createClient()

  const isCompleted = habit.type === 'boolean' 
    ? log?.completed 
    : (log?.value || 0) >= (habit.target_value || 1)

  const toggleHabit = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (log) {
        await supabase
          .from('habit_logs')
          .update({ completed: !log.completed, updated_at: new Date().toISOString() })
          .eq('id', log.id)
      } else {
        await supabase
          .from('habit_logs')
          .insert({
            user_id: user.id,
            habit_id: habit.id,
            date: today,
            completed: true,
            value: habit.type === 'numeric' ? 1 : null
          })
      }
      onUpdate()
    } catch (error) {
      console.error('Error toggling habit:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateNumericValue = async (newValue: number) => {
    if (newValue < 0) return
    setLoading(true)
    setValue(newValue)
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (log) {
        await supabase
          .from('habit_logs')
          .update({ 
            value: newValue, 
            completed: newValue >= (habit.target_value || 1),
            updated_at: new Date().toISOString() 
          })
          .eq('id', log.id)
      } else {
        await supabase
          .from('habit_logs')
          .insert({
            user_id: user.id,
            habit_id: habit.id,
            date: today,
            completed: newValue >= (habit.target_value || 1),
            value: newValue
          })
      }
      onUpdate()
    } catch (error) {
      console.error('Error updating habit:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className={`bg-surface p-4 rounded-xl border transition cursor-pointer ${
        isCompleted 
          ? 'border-accent-success/50 bg-accent-success/5' 
          : 'border-border-subtle hover:border-accent-primary/30'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = categoryIcons[habit.category as keyof typeof categoryIcons]
            return Icon ? <Icon size={20} className="text-accent-primary" /> : <Target size={20} />
          })()}
          <div>
            <div className="font-medium">{habit.name}</div>
            {habit.type === 'numeric' && (
              <div className="text-xs text-foreground-muted">
                {value} / {habit.target_value} {habit.target_unit}
              </div>
            )}
          </div>
        </div>

        {habit.type === 'boolean' ? (
          <button
            onClick={toggleHabit}
            disabled={loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              isCompleted 
                ? 'bg-accent-success text-white' 
                : 'bg-background border border-border-subtle hover:border-accent-primary'
            }`}
          >
            {isCompleted && <Check size={20} />}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateNumericValue(value - 1)}
              disabled={loading || value <= 0}
              className="w-8 h-8 rounded-full bg-background border border-border-subtle flex items-center justify-center hover:border-accent-primary disabled:opacity-50"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-medium">{value}</span>
            <button
              onClick={() => updateNumericValue(value + 1)}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-background border border-border-subtle flex items-center justify-center hover:border-accent-primary"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
