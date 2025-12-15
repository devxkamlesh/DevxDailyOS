'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project, Task } from '@/types/database'
import Link from 'next/link'
import {
  Plus, X, ExternalLink, Github, LayoutGrid, List, Columns3,
  Lightbulb, Hammer, Rocket, Calendar, CheckCircle2, Clock,
  Edit2, Trash2, Star, Archive, Search, Filter, ChevronDown,
  AlertCircle, Flag, GripVertical, ArrowUp, ArrowRight, ArrowDown,
  Target, Timer, FileText, Tag, MoreHorizontal, Pin, PinOff, Eye
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const statusConfig = {
  idea: {
    label: 'Idea',
    icon: Lightbulb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30'
  },
  building: {
    label: 'Building',
    icon: Hammer,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30'
  },
  shipped: {
    label: 'Shipped',
    icon: Rocket,
    color: 'text-accent-success',
    bg: 'bg-accent-success/10',
    border: 'border-accent-success/30'
  }
}

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: ArrowDown },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: ArrowRight },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: ArrowUp },
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle }
}

const categoryColors = [
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'
]

// ExtendedProject is same as Project - all properties already defined in base
type ExtendedProject = Project

interface ProjectWithTasks extends ExtendedProject {
  taskCount: number
  completedTasks: number
  progress: number
}

type ViewMode = 'cards' | 'list' | 'kanban'
type FilterStatus = 'all' | 'idea' | 'building' | 'shipped'
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent'

// Droppable Column for Kanban
function DroppableColumn({ id, children, config }: {
  id: string
  children: React.ReactNode
  config: typeof statusConfig[keyof typeof statusConfig]
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[500px] bg-surface/50 rounded-xl p-3 border-2 border-dashed ${config.border} space-y-3 transition-all ${isOver ? 'ring-2 ring-accent-primary bg-accent-primary/5 scale-[1.01]' : ''
        }`}
    >
      {children}
    </div>
  )
}

// Sortable Project Card for Kanban
function SortableProjectCard({ project, onEdit, onPin, onArchive, onNavigate }: {
  project: ProjectWithTasks
  onEdit: (p: ExtendedProject) => void
  onPin: (id: string, pinned: boolean) => void
  onArchive: (id: string) => void
  onNavigate: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const config = statusConfig[project.status]
  const priorityCfg = project.priority ? priorityConfig[project.priority] : null
  const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'shipped'

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onNavigate(project.id)}
      className={`bg-surface p-4 rounded-lg border ${isOverdue ? 'border-red-500/50' : 'border-border-subtle'} hover:border-accent-primary/30 transition cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded">
            <GripVertical size={14} className="text-foreground-muted" />
          </div>
          {project.is_pinned && <Pin size={12} className="text-yellow-400" />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={(e) => { e.stopPropagation(); onPin(project.id, !project.is_pinned) }} className="p-1 text-foreground-muted hover:text-yellow-400 rounded">
            {project.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(project) }} className="p-1 text-foreground-muted hover:text-accent-primary rounded">
            <Edit2 size={12} />
          </button>
        </div>
      </div>
      <h4 className="font-medium text-sm mb-1 line-clamp-1">{project.name}</h4>
      {project.category && (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] text-white mb-2 ${categoryColors[project.category.length % categoryColors.length]}`}>
          {project.category}
        </span>
      )}
      <div className="flex items-center gap-2 mb-2">
        {priorityCfg && (
          <span className={`flex items-center gap-1 text-[10px] ${priorityCfg.color}`}>
            <priorityCfg.icon size={10} />
            {priorityCfg.label}
          </span>
        )}
        {project.due_date && (
          <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-foreground-muted'}`}>
            <Calendar size={10} />
            {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden mb-2">
        <div className="h-full bg-accent-primary transition-all" style={{ width: `${project.progress}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-foreground-muted">
        <span>{project.completedTasks}/{project.taskCount} tasks</span>
        <span>{project.progress}%</span>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithTasks[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('projects-view-mode') as ViewMode) || 'cards'
    }
    return 'cards'
  })
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null)
  const [editingProject, setEditingProject] = useState<ExtendedProject | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'idea' as Project['status'],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    tech_stack: '',
    live_url: '',
    github_url: '',
    due_date: '',
    category: '',
    estimated_hours: '',
    notes: ''
  })
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as Task['priority'], due_date: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'time'>('tasks')
  const supabase = createClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchData = async () => {
    const [projectsRes, tasksRes] = await Promise.all([
      supabase.from('projects').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false })
    ])
    if (!projectsRes.data) { setLoading(false); return }
    if (tasksRes.data) setTasks(tasksRes.data)
    const projectsWithStats: ProjectWithTasks[] = projectsRes.data.map(project => {
      const projectTasks = tasksRes.data?.filter(t => t.project_id === project.id) || []
      const completedTasks = projectTasks.filter(t => t.status === 'done').length
      const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0
      return { ...project, taskCount: projectTasks.length, completedTasks, progress: Math.round(progress) }
    })
    setProjects(projectsWithStats)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('projects-view-mode', viewMode)
  }, [viewMode])

  const handleDragStart = useCallback((event: DragStartEvent) => { setActiveId(event.active.id as string) }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const overColumn = (['idea', 'building', 'shipped'] as const).find(s => over.id === s)
    if (overColumn) {
      setProjects(prev => prev.map(p => p.id === active.id ? { ...p, status: overColumn } : p))
    }
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const overColumn = (['idea', 'building', 'shipped'] as const).find(s => over.id === s)
    if (overColumn) {
      await supabase.from('projects').update({ status: overColumn }).eq('id', active.id)
      fetchData()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(s => s.trim()) : null,
        live_url: formData.live_url || null,
        github_url: formData.github_url || null,
        due_date: formData.due_date || null,
        category: formData.category || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        notes: formData.notes || null
      }
      if (editingProject) {
        await supabase.from('projects').update(payload).eq('id', editingProject.id)
      } else {
        await supabase.from('projects').insert({ ...payload, user_id: user.id })
      }
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'idea', priority: 'medium', tech_stack: '', live_url: '', github_url: '', due_date: '', category: '', estimated_hours: '', notes: '' })
    setShowForm(false)
    setEditingProject(null)
  }

  const openEdit = (project: ExtendedProject) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority || 'medium',
      tech_stack: project.tech_stack?.join(', ') || '',
      live_url: project.live_url || '',
      github_url: project.github_url || '',
      due_date: project.due_date || '',
      category: project.category || '',
      estimated_hours: project.estimated_hours?.toString() || '',
      notes: project.notes || ''
    })
    setShowForm(true)
  }

  const updateProjectStatus = async (projectId: string, status: Project['status']) => {
    await supabase.from('projects').update({ status }).eq('id', projectId)
    fetchData()
    if (selectedProject?.id === projectId) setSelectedProject({ ...selectedProject, status })
  }

  const togglePin = async (projectId: string, pinned: boolean) => {
    await supabase.from('projects').update({ is_pinned: pinned }).eq('id', projectId)
    fetchData()
  }

  const toggleArchive = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    await supabase.from('projects').update({ is_archived: !project?.is_archived }).eq('id', projectId)
    setSelectedProject(null)
    fetchData()
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return
    await supabase.from('projects').delete().eq('id', id)
    setSelectedProject(null)
    fetchData()
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim() || !selectedProject) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('tasks').insert({
      user_id: user.id,
      project_id: selectedProject.id,
      title: newTask.title.trim(),
      priority: newTask.priority,
      due_date: newTask.due_date || null
    })
    setNewTask({ title: '', priority: 'medium', due_date: '' })
    fetchData()
  }

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    fetchData()
  }

  const updateTaskPriority = async (taskId: string, priority: Task['priority']) => {
    await supabase.from('tasks').update({ priority }).eq('id', taskId)
    fetchData()
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    fetchData()
  }

  const logTime = async (hours: number) => {
    if (!selectedProject) return
    const currentHours = selectedProject.actual_hours || 0
    await supabase.from('projects').update({ actual_hours: currentHours + hours }).eq('id', selectedProject.id)
    fetchData()
  }

  const updateNotes = async (notes: string) => {
    if (!selectedProject) return
    await supabase.from('projects').update({ notes }).eq('id', selectedProject.id)
    setSelectedProject({ ...selectedProject, notes })
  }

  // Filtering
  const filteredProjects = projects.filter(p => {
    if (!showArchived && p.is_archived) return false
    if (showArchived && !p.is_archived) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterPriority !== 'all' && p.priority !== filterPriority) return false
    return true
  })

  const pinnedProjects = filteredProjects.filter(p => p.is_pinned)
  const unpinnedProjects = filteredProjects.filter(p => !p.is_pinned)
  const sortedProjects = [...pinnedProjects, ...unpinnedProjects]

  const projectsByStatus = {
    idea: sortedProjects.filter(p => p.status === 'idea'),
    building: sortedProjects.filter(p => p.status === 'building'),
    shipped: sortedProjects.filter(p => p.status === 'shipped')
  }

  const stats = {
    total: projects.filter(p => !p.is_archived).length,
    ideas: projects.filter(p => p.status === 'idea' && !p.is_archived).length,
    building: projects.filter(p => p.status === 'building' && !p.is_archived).length,
    shipped: projects.filter(p => p.status === 'shipped' && !p.is_archived).length,
    overdue: projects.filter(p => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'shipped' && !p.is_archived).length,
    totalTasks: projects.reduce((sum, p) => sum + p.taskCount, 0),
    completedTasks: projects.reduce((sum, p) => sum + p.completedTasks, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Projects</h1>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white rounded-lg hover:opacity-90 transition text-sm">
                <Plus size={16} /> New
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-foreground-muted">{stats.total} Projects</span>
              <span className="flex items-center gap-1 text-yellow-400"><Lightbulb size={14} /> {stats.ideas}</span>
              <span className="flex items-center gap-1 text-blue-400"><Hammer size={14} /> {stats.building}</span>
              <span className="flex items-center gap-1 text-accent-success"><Rocket size={14} /> {stats.shipped}</span>
              {stats.overdue > 0 && <span className="flex items-center gap-1 text-red-400"><AlertCircle size={14} /> {stats.overdue} Overdue</span>}
              <span className="flex items-center gap-1 text-foreground-muted"><CheckCircle2 size={14} /> {stats.completedTasks}/{stats.totalTasks} Tasks</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface rounded-lg p-1">
              {(['cards', 'list', 'kanban'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded ${viewMode === mode ? 'bg-accent-primary text-white' : 'text-foreground-muted'}`}>
                  {mode === 'cards' ? <LayoutGrid size={18} /> : mode === 'list' ? <List size={18} /> : <Columns3 size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${showFilters ? 'bg-accent-primary text-white border-accent-primary' : 'bg-surface border-border-subtle text-foreground-muted'}`}>
              <Filter size={16} /> Filters
            </button>
            <button onClick={() => setShowArchived(!showArchived)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${showArchived ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-surface border-border-subtle text-foreground-muted'}`}>
              <Archive size={16} /> {showArchived ? 'Archived' : 'Active'}
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-surface rounded-xl border border-border-subtle">
            <div>
              <label className="text-xs text-foreground-muted mb-1 block">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)} className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm">
                <option value="all">All Status</option>
                <option value="idea">Ideas</option>
                <option value="building">Building</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-foreground-muted mb-1 block">Priority</label>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as FilterPriority)} className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm">
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface p-5 rounded-xl border border-border-subtle animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 bg-background rounded-full w-20" />
                <div className="h-6 bg-background rounded w-6" />
              </div>
              <div className="h-6 bg-background rounded w-40 mb-2" />
              <div className="h-4 bg-background rounded w-full mb-4" />
              <div className="h-2 bg-background rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Lightbulb size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted mb-4">{showArchived ? 'No archived projects' : searchQuery ? 'No projects found' : 'No projects yet'}</p>
          {!showArchived && !searchQuery && (
            <button onClick={() => setShowForm(true)} className="text-accent-primary hover:underline">Create your first project</button>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['idea', 'building', 'shipped'] as const).map(status => {
              const config = statusConfig[status]
              const StatusIcon = config.icon
              const statusProjects = projectsByStatus[status]
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon size={18} className={config.color} />
                      <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                    </div>
                    <span className="text-sm text-foreground-muted bg-surface px-2 py-0.5 rounded">{statusProjects.length}</span>
                  </div>
                  <SortableContext items={statusProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn id={status} config={config}>
                      {statusProjects.length === 0 ? (
                        <div className="text-center py-8 text-foreground-muted text-sm">No {config.label.toLowerCase()} projects</div>
                      ) : (
                        statusProjects.map(project => (
                          <SortableProjectCard key={project.id} project={project} onEdit={openEdit} onPin={togglePin} onArchive={toggleArchive} onNavigate={(id) => router.push(`/projects/${id}`)} />
                        ))
                      )}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-surface p-4 rounded-lg border-2 border-accent-primary shadow-2xl opacity-90 rotate-2">
                <div className="text-sm font-medium">Moving project...</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProjects.map(project => {
            const config = statusConfig[project.status]
            const StatusIcon = config.icon
            const priorityCfg = project.priority ? priorityConfig[project.priority] : null
            const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'shipped'
            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className={`bg-surface p-5 rounded-xl border hover:border-accent-primary/50 transition cursor-pointer relative ${isOverdue ? 'border-red-500/50' : config.border}`}
              >
                {project.is_pinned && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                    <Pin size={12} className="text-black" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                    <StatusIcon size={14} className={config.color} />
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(project.id, !project.is_pinned) }} className="p-1.5 text-foreground-muted hover:text-yellow-400 hover:bg-background rounded transition">
                      {project.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(project) }} className="p-1.5 text-foreground-muted hover:text-accent-primary hover:bg-background rounded transition">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {project.category && (
                    <span className={`px-2 py-0.5 rounded text-[10px] text-white ${categoryColors[project.category.length % categoryColors.length]}`}>
                      {project.category}
                    </span>
                  )}
                  {priorityCfg && (
                    <span className={`flex items-center gap-1 text-xs ${priorityCfg.color}`}>
                      <priorityCfg.icon size={12} /> {priorityCfg.label}
                    </span>
                  )}
                </div>
                {project.description && <p className="text-sm text-foreground-muted mb-3 line-clamp-2">{project.description}</p>}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tech_stack.slice(0, 3).map(tech => (
                      <span key={tech} className="px-2 py-0.5 bg-background rounded text-xs text-foreground-muted border border-border-subtle">{tech}</span>
                    ))}
                    {project.tech_stack.length > 3 && <span className="px-2 py-0.5 text-xs text-foreground-muted">+{project.tech_stack.length - 3}</span>}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-accent-primary transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground-muted">{project.completedTasks}/{project.taskCount} tasks</span>
                    <div className="flex items-center gap-3">
                      {project.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-foreground-muted'}`}>
                          <Calendar size={12} />
                          {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {project.estimated_hours && (
                        <span className="flex items-center gap-1 text-foreground-muted">
                          <Timer size={12} />
                          {project.actual_hours || 0}/{project.estimated_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {project.live_url && (
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-foreground-muted hover:text-accent-primary">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-foreground-muted hover:text-accent-primary">
                        <Github size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedProjects.map(project => {
            const config = statusConfig[project.status]
            const StatusIcon = config.icon
            const priorityCfg = project.priority ? priorityConfig[project.priority] : null
            const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'shipped'
            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className={`bg-surface p-4 rounded-xl border hover:border-accent-primary/30 transition cursor-pointer flex items-center gap-4 ${isOverdue ? 'border-red-500/30' : 'border-border-subtle'}`}
              >
                {project.is_pinned && <Pin size={14} className="text-yellow-400 flex-shrink-0" />}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} flex-shrink-0`}>
                  <StatusIcon size={14} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    {project.category && (
                      <span className={`px-2 py-0.5 rounded text-[10px] text-white flex-shrink-0 ${categoryColors[project.category.length % categoryColors.length]}`}>
                        {project.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground-muted">
                    <span>{project.completedTasks}/{project.taskCount} tasks</span>
                    <span>{project.progress}%</span>
                    {priorityCfg && <span className={priorityCfg.color}>{priorityCfg.label}</span>}
                    {project.due_date && (
                      <span className={isOverdue ? 'text-red-400' : ''}>
                        Due {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {project.live_url && <a href={project.live_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-foreground-muted hover:text-accent-primary"><ExternalLink size={16} /></a>}
                  {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-foreground-muted hover:text-accent-primary"><Github size={16} /></a>}
                  <button onClick={(e) => { e.stopPropagation(); openEdit(project) }} className="p-1.5 text-foreground-muted hover:text-accent-primary hover:bg-background rounded transition">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-3xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedProject.is_pinned && <Pin size={16} className="text-yellow-400" />}
                  <h2 className="text-2xl font-semibold">{selectedProject.name}</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['idea', 'building', 'shipped'] as const).map(status => {
                    const config = statusConfig[status]
                    const StatusIcon = config.icon
                    return (
                      <button
                        key={status}
                        onClick={() => updateProjectStatus(selectedProject.id, status)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedProject.status === status ? `${config.bg} ${config.color}` : 'bg-background text-foreground-muted hover:text-foreground'}`}
                      >
                        <StatusIcon size={14} /> {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/projects/${selectedProject.id}`} className="p-2 text-foreground-muted hover:text-accent-primary hover:bg-background rounded-lg transition" title="View Full Page">
                  <Eye size={20} />
                </Link>
                <button onClick={() => togglePin(selectedProject.id, !selectedProject.is_pinned)} className="p-2 text-foreground-muted hover:text-yellow-400 hover:bg-background rounded-lg transition">
                  {selectedProject.is_pinned ? <PinOff size={20} /> : <Pin size={20} />}
                </button>
                <button onClick={() => toggleArchive(selectedProject.id)} className="p-2 text-foreground-muted hover:text-orange-400 hover:bg-background rounded-lg transition">
                  <Archive size={20} />
                </button>
                <button onClick={() => setSelectedProject(null)} className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Project Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {selectedProject.priority && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Priority</div>
                  <div className={`flex items-center gap-1 font-medium ${priorityConfig[selectedProject.priority].color}`}>
                    {(() => { const Icon = priorityConfig[selectedProject.priority].icon; return <Icon size={14} /> })()}
                    {priorityConfig[selectedProject.priority].label}
                  </div>
                </div>
              )}
              {selectedProject.due_date && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Due Date</div>
                  <div className={`flex items-center gap-1 font-medium ${new Date(selectedProject.due_date) < new Date() && selectedProject.status !== 'shipped' ? 'text-red-400' : ''}`}>
                    <Calendar size={14} />
                    {new Date(selectedProject.due_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              {selectedProject.category && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Category</div>
                  <div className="flex items-center gap-1 font-medium">
                    <Tag size={14} /> {selectedProject.category}
                  </div>
                </div>
              )}
              {selectedProject.estimated_hours && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Time Tracked</div>
                  <div className="flex items-center gap-1 font-medium">
                    <Timer size={14} /> {selectedProject.actual_hours || 0}/{selectedProject.estimated_hours}h
                  </div>
                </div>
              )}
            </div>

            {selectedProject.description && <p className="text-foreground-muted mb-4">{selectedProject.description}</p>}

            {selectedProject.tech_stack && selectedProject.tech_stack.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech_stack.map(tech => (
                    <span key={tech} className="px-3 py-1 bg-background rounded-lg text-sm border border-border-subtle">{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {(selectedProject.live_url || selectedProject.github_url) && (
              <div className="flex gap-3 mb-6">
                {selectedProject.live_url && (
                  <a href={selectedProject.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition text-sm">
                    <ExternalLink size={16} /> Live Demo
                  </a>
                )}
                {selectedProject.github_url && (
                  <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-background border border-border-subtle rounded-lg hover:border-accent-primary/50 transition text-sm">
                    <Github size={16} /> View Code
                  </a>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-background p-1 rounded-lg">
              {(['tasks', 'notes', 'time'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-accent-primary text-white' : 'text-foreground-muted hover:text-foreground'}`}
                >
                  {tab === 'tasks' && <CheckCircle2 size={16} />}
                  {tab === 'notes' && <FileText size={16} />}
                  {tab === 'time' && <Timer size={16} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Tasks ({selectedProject.completedTasks}/{selectedProject.taskCount})</h3>
                  <div className="text-sm text-foreground-muted">{selectedProject.progress}% Complete</div>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-accent-primary transition-all" style={{ width: `${selectedProject.progress}%` }} />
                </div>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {tasks.filter(t => t.project_id === selectedProject.id).length === 0 ? (
                    <p className="text-foreground-muted text-sm text-center py-4">No tasks yet</p>
                  ) : (
                    tasks.filter(t => t.project_id === selectedProject.id).map(task => {
                      const taskPriority = priorityConfig[task.priority]
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-background rounded-lg group">
                          <button
                            onClick={() => toggleTask(task.id, task.status)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${task.status === 'done' ? 'bg-accent-success border-accent-success text-white' : 'border-border-subtle hover:border-accent-primary'}`}
                          >
                            {task.status === 'done' && <CheckCircle2 size={14} />}
                          </button>
                          <span className={`flex-1 ${task.status === 'done' ? 'line-through text-foreground-muted' : ''}`}>{task.title}</span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <select
                              value={task.priority}
                              onChange={(e) => updateTaskPriority(task.id, e.target.value as Task['priority'])}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs px-2 py-1 rounded border-0 bg-transparent ${taskPriority.color} cursor-pointer`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            {task.due_date && (
                              <span className="text-xs text-foreground-muted flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <button onClick={() => deleteTask(task.id)} className="p-1 text-foreground-muted hover:text-red-400 transition">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <form onSubmit={addTask} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Add a new task..."
                      className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                    <button type="submit" disabled={!newTask.title.trim()} className="px-4 py-2 bg-accent-primary text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                      className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                </form>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <h3 className="font-medium mb-3">Project Notes</h3>
                <textarea
                  value={selectedProject.notes || ''}
                  onChange={(e) => updateNotes(e.target.value)}
                  placeholder="Add notes, ideas, or documentation..."
                  className="w-full h-48 px-4 py-3 bg-background border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                />
              </div>
            )}

            {/* Time Tab */}
            {activeTab === 'time' && (
              <div>
                <h3 className="font-medium mb-3">Time Tracking</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-accent-primary">{selectedProject.actual_hours || 0}h</div>
                    <div className="text-sm text-foreground-muted">Logged</div>
                  </div>
                  <div className="bg-background p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold">{selectedProject.estimated_hours || 0}h</div>
                    <div className="text-sm text-foreground-muted">Estimated</div>
                  </div>
                </div>
                {selectedProject.estimated_hours && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(((selectedProject.actual_hours || 0) / selectedProject.estimated_hours) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${(selectedProject.actual_hours || 0) > selectedProject.estimated_hours ? 'bg-red-500' : 'bg-accent-primary'}`}
                        style={{ width: `${Math.min(100, ((selectedProject.actual_hours || 0) / selectedProject.estimated_hours) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {[0.5, 1, 2, 4, 8].map(hours => (
                    <button
                      key={hours}
                      onClick={() => logTime(hours)}
                      className="px-4 py-2 bg-background border border-border-subtle rounded-lg text-sm hover:border-accent-primary/50 transition"
                    >
                      +{hours}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-border-subtle">
              <button onClick={() => openEdit(selectedProject)} className="flex-1 py-2 bg-background border border-border-subtle rounded-lg hover:border-accent-primary/50 transition text-sm">
                Edit Project
              </button>
              <button onClick={() => deleteProject(selectedProject.id)} className="py-2 px-4 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-8 rounded-2xl w-full max-w-5xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
              <button onClick={resetForm} className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name and Category */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="My Awesome Project"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="SaaS, Mobile App, etc."
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition resize-none"
                  rows={3}
                  placeholder="What is this project about?"
                />
              </div>

              {/* Row 3: Status and Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Status *</label>
                  <div className="flex flex-wrap gap-3">
                    {(['idea', 'building', 'shipped'] as const).map(status => {
                      const config = statusConfig[status]
                      const StatusIcon = config.icon
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData({ ...formData, status })}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium ${formData.status === status ? `${config.bg} ${config.border} ${config.color} shadow-lg` : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50'}`}
                        >
                          <StatusIcon size={18} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Priority *</label>
                  <div className="flex flex-wrap gap-3">
                    {(['low', 'medium', 'high', 'urgent'] as const).map(priority => {
                      const config = priorityConfig[priority]
                      const PriorityIcon = config.icon
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority })}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium ${formData.priority === priority ? `${config.bg} border-current ${config.color} shadow-lg` : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50'}`}
                        >
                          <PriorityIcon size={18} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 4: Due Date and Estimated Hours */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="40"
                    min="0"
                  />
                </div>
              </div>

              {/* Row 5: Tech Stack */}
              <div>
                <label className="block text-sm font-medium mb-2">Tech Stack</label>
                <input
                  type="text"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                  placeholder="Next.js, TypeScript, Supabase (comma separated)"
                />
              </div>

              {/* Row 6: URLs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Live URL</label>
                  <input
                    type="url"
                    value={formData.live_url}
                    onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="https://myproject.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="https://github.com/user/repo"
                  />
                </div>
              </div>

              {/* Row 7: Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition resize-none"
                  rows={3}
                  placeholder="Additional notes, ideas, or documentation..."
                />
              </div>

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
                  {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
