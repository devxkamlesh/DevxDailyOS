'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project, Task } from '@/types/database'
import Link from 'next/link'
import {
  ArrowLeft, ExternalLink, Github, Edit2, Trash2, Plus, X,
  Lightbulb, Hammer, Rocket, Calendar, CheckCircle2, Clock,
  Flag, ArrowUp, ArrowRight, ArrowDown, AlertCircle, Pin,
  FileText, Tag, Timer, Target, Save, MoreHorizontal
} from 'lucide-react'

const statusConfig = {
  idea: { label: 'Idea', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  building: { label: 'Building', icon: Hammer, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  shipped: { label: 'Shipped', icon: Rocket, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
}

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: ArrowDown },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: ArrowRight },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: ArrowUp },
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle }
}

const taskPriorityConfig = {
  low: { label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks')
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as Task['priority'] })
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')

  const fetchProject = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!projectData) { router.push('/projects'); return }

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    setProject(projectData)
    setTasks(tasksData || [])
    setNotes(projectData.notes || '')
    setLoading(false)
  }, [projectId, router, supabase])

  useEffect(() => { fetchProject() }, [fetchProject])

  const updateProject = async (updates: Partial<Project>) => {
    if (!project) return
    const { error } = await supabase.from('projects').update(updates).eq('id', project.id)
    if (!error) setProject({ ...project, ...updates })
  }

  const addTask = async () => {
    if (!newTask.title.trim() || !project) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      project_id: project.id,
      title: newTask.title,
      priority: newTask.priority,
      status: 'pending'
    }).select().single()

    if (!error && data) {
      setTasks([...tasks, data])
      setNewTask({ title: '', priority: 'medium' })
    }
  }

  const toggleTask = async (taskId: string, currentStatus: Task['status']) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    if (!error) setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) setTasks(tasks.filter(t => t.id !== taskId))
  }

  const saveNotes = async () => {
    await updateProject({ notes })
    setEditingNotes(false)
  }

  const deleteProject = async () => {
    if (!project || !confirm('Delete this project and all its tasks?')) return
    await supabase.from('tasks').delete().eq('project_id', project.id)
    await supabase.from('projects').delete().eq('id', project.id)
    router.push('/projects')
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--surface)] rounded-lg" />
        <div className="h-64 bg-[var(--surface)] rounded-2xl" />
      </div>
    )
  }

  if (!project) return null

  const completedTasks = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const config = statusConfig[project.status]
  const StatusIcon = config.icon
  const priorityCfg = project.priority ? priorityConfig[project.priority] : null
  const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'shipped'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects" className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.is_pinned && <Pin size={16} className="text-yellow-400" />}
          </div>
          <p className="text-[var(--foreground-muted)] text-sm">{project.description || 'No description'}</p>
        </div>
        <button onClick={deleteProject} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${config.bg} rounded-xl p-4 border ${config.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon size={16} className={config.color} />
            <span className="text-xs text-[var(--foreground-muted)]">Status</span>
          </div>
          <p className={`font-semibold ${config.color}`}>{config.label}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-[var(--foreground-muted)]" />
            <span className="text-xs text-[var(--foreground-muted)]">Progress</span>
          </div>
          <p className="font-semibold">{progress}%</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-[var(--accent-success)]" />
            <span className="text-xs text-[var(--foreground-muted)]">Tasks</span>
          </div>
          <p className="font-semibold">{completedTasks}/{tasks.length}</p>
        </div>
        {project.due_date && (
          <div className={`rounded-xl p-4 border ${isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--surface)] border-[var(--border-subtle)]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className={isOverdue ? 'text-red-400' : 'text-[var(--foreground-muted)]'} />
              <span className="text-xs text-[var(--foreground-muted)]">Due Date</span>
            </div>
            <p className={`font-semibold ${isOverdue ? 'text-red-400' : ''}`}>
              {new Date(project.due_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Project Details */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {priorityCfg && (
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Priority</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${priorityCfg.bg} ${priorityCfg.color}`}>
                <priorityCfg.icon size={14} />
                {priorityCfg.label}
              </span>
            </div>
          )}
          {project.category && (
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Category</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-sm">
                <Tag size={14} />
                {project.category}
              </span>
            </div>
          )}
          {project.estimated_hours && (
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Estimated</p>
              <span className="inline-flex items-center gap-1 text-sm">
                <Timer size={14} className="text-[var(--foreground-muted)]" />
                {project.estimated_hours}h
              </span>
            </div>
          )}
          {project.actual_hours !== null && project.actual_hours > 0 && (
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Actual</p>
              <span className="inline-flex items-center gap-1 text-sm">
                <Clock size={14} className="text-[var(--foreground-muted)]" />
                {project.actual_hours}h
              </span>
            </div>
          )}
        </div>

        {/* Tech Stack */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-[var(--foreground-muted)] mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech, i) => (
                <span key={i} className="px-3 py-1 bg-[var(--background)] rounded-full text-sm">{tech}</span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3">
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition">
              <ExternalLink size={16} /> Live Demo
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface)] transition">
              <Github size={16} /> GitHub
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${activeTab === 'tasks' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--foreground-muted)]'}`}
        >
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${activeTab === 'notes' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--foreground-muted)]'}`}
        >
          Notes
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Add Task */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new task..."
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="flex-1 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
              className="px-3 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button onClick={addTask} className="px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition">
              <Plus size={20} />
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-[var(--foreground-muted)]">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>No tasks yet. Add your first task above!</p>
              </div>
            ) : (
              tasks.map(task => {
                const taskPriority = taskPriorityConfig[task.priority]
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] group ${task.status === 'done' ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${task.status === 'done' ? 'bg-[var(--accent-success)] border-[var(--accent-success)]' : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'}`}
                    >
                      {task.status === 'done' && <CheckCircle2 size={14} className="text-white" />}
                    </button>
                    <span className={`flex-1 ${task.status === 'done' ? 'line-through text-[var(--foreground-muted)]' : ''}`}>
                      {task.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${taskPriority.bg} ${taskPriority.color}`}>
                      {taskPriority.label}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-[var(--foreground-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Progress Bar */}
          {tasks.length > 0 && (
            <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--foreground-muted)]">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-success)] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          {editingNotes ? (
            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add project notes, ideas, or documentation..."
                className="w-full h-64 px-4 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={saveNotes} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition">
                  <Save size={16} /> Save Notes
                </button>
                <button onClick={() => { setNotes(project.notes || ''); setEditingNotes(false) }} className="px-4 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface)] transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {notes ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-[var(--foreground)]">{notes}</pre>
                </div>
              ) : (
                <p className="text-[var(--foreground-muted)] text-center py-8">No notes yet</p>
              )}
              <button onClick={() => setEditingNotes(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--background)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface)] transition">
                <Edit2 size={16} /> {notes ? 'Edit Notes' : 'Add Notes'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Change */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--foreground-muted)] mb-3">Change Status</p>
        <div className="flex gap-2">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => {
            const cfg = statusConfig[status]
            const Icon = cfg.icon
            return (
              <button
                key={status}
                onClick={() => updateProject({ status })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${project.status === status ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : 'bg-[var(--background)] border border-[var(--border-subtle)] hover:bg-[var(--surface)]'}`}
              >
                <Icon size={16} />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
