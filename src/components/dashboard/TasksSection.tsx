'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types/database'
import TaskItem from '@/components/tasks/TaskItem'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(*)')
      .eq('is_today', true)
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .limit(3)

    if (data) setTasks(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const addQuickTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    setAdding(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('tasks').insert({
        user_id: user.id,
        title: newTask.trim(),
        is_today: true,
        priority: 'medium'
      })
      setNewTask('')
      fetchTasks()
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <h2 className="text-xl font-semibold mb-4">Top 3 Tasks</h2>
        <div className="text-center py-8 text-foreground-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Top 3 Tasks</h2>
        <Link 
          href="/projects"
          className="text-sm text-accent-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3 mb-4">
        {tasks.length === 0 ? (
          <p className="text-foreground-muted text-center py-4">No tasks for today</p>
        ) : (
          tasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={fetchTasks} />
          ))
        )}
      </div>

      <form onSubmit={addQuickTask} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a quick task..."
          className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-foreground text-sm"
        />
        <button
          type="submit"
          disabled={adding || !newTask.trim()}
          className="px-3 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </form>
    </div>
  )
}
