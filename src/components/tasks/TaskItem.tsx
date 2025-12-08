'use client'

import { Task } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Check, Circle } from 'lucide-react'

interface TaskItemProps {
  task: Task
  onUpdate: () => void
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const toggleTask = async () => {
    setLoading(true)
    try {
      const newStatus = task.status === 'done' ? 'pending' : 'done'
      await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', task.id)
      onUpdate()
    } catch (error) {
      console.error('Error toggling task:', error)
    } finally {
      setLoading(false)
    }
  }

  const priorityColors = {
    low: 'bg-gray-500/20 text-gray-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400'
  }

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg bg-background border border-border-subtle hover:border-accent-primary/30 transition ${
        loading ? 'opacity-50' : ''
      }`}
    >
      <button
        onClick={toggleTask}
        disabled={loading}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition flex-shrink-0 ${
          task.status === 'done'
            ? 'bg-accent-success text-white'
            : 'border border-border-subtle hover:border-accent-primary'
        }`}
      >
        {task.status === 'done' ? <Check size={14} /> : <Circle size={14} className="opacity-0" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${task.status === 'done' ? 'line-through text-foreground-muted' : ''}`}>
          {task.title}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {task.project && (
          <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary">
            {task.project.name}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>
    </div>
  )
}
