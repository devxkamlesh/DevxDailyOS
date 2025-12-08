'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, Task } from '@/types/database'
import { 
  Plus, X, ExternalLink, Github, LayoutGrid, List, 
  Lightbulb, Hammer, Rocket, Calendar, CheckCircle2,
  Circle, Edit2, Trash2, MoreVertical, Link as LinkIcon
} from 'lucide-react'

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

interface ProjectWithTasks extends Project {
  taskCount: number
  completedTasks: number
  progress: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'idea' as Project['status'],
    tech_stack: '',
    live_url: '',
    github_url: ''
  })
  const [newTask, setNewTask] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchData = async () => {
    const [projectsRes, tasksRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false })
    ])
    
    if (!projectsRes.data) {
      setLoading(false)
      return
    }

    if (tasksRes.data) {
      setTasks(tasksRes.data)
    }

    const projectsWithStats: ProjectWithTasks[] = projectsRes.data.map(project => {
      const projectTasks = tasksRes.data?.filter(t => t.project_id === project.id) || []
      const completedTasks = projectTasks.filter(t => t.status === 'done').length
      const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0

      return {
        ...project,
        taskCount: projectTasks.length,
        completedTasks,
        progress: Math.round(progress)
      }
    })

    setProjects(projectsWithStats)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
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
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(s => s.trim()) : null,
        live_url: formData.live_url || null,
        github_url: formData.github_url || null
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
    setFormData({ name: '', description: '', status: 'idea', tech_stack: '', live_url: '', github_url: '' })
    setShowForm(false)
    setEditingProject(null)
  }

  const openEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      tech_stack: project.tech_stack?.join(', ') || '',
      live_url: project.live_url || '',
      github_url: project.github_url || ''
    })
    setShowForm(true)
  }

  const updateProjectStatus = async (projectId: string, status: Project['status']) => {
    await supabase.from('projects').update({ status }).eq('id', projectId)
    fetchData()
    if (selectedProject?.id === projectId) {
      setSelectedProject({ ...selectedProject, status })
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return
    await supabase.from('projects').delete().eq('id', id)
    setSelectedProject(null)
    fetchData()
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim() || !selectedProject) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('tasks').insert({
      user_id: user.id,
      project_id: selectedProject.id,
      title: newTask.trim(),
      priority: 'medium'
    })
    setNewTask('')
    fetchData()
  }

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    fetchData()
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    fetchData()
  }

  const projectsByStatus = {
    idea: projects.filter(p => p.status === 'idea'),
    building: projects.filter(p => p.status === 'building'),
    shipped: projects.filter(p => p.status === 'shipped')
  }

  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0)
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Projects</h1>
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
              <Lightbulb size={16} className="text-yellow-400" />
              <span className="text-foreground-muted">{projectsByStatus.idea.length} Ideas</span>
            </div>
            <div className="flex items-center gap-2">
              <Hammer size={16} className="text-blue-400" />
              <span className="text-foreground-muted">{projectsByStatus.building.length} Building</span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket size={16} className="text-accent-success" />
              <span className="text-foreground-muted">{projectsByStatus.shipped.length} Shipped</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-accent-primary" />
              <span className="text-foreground-muted">{completedTasks}/{totalTasks} Tasks Done</span>
            </div>
          </div>
        </div>
        <div className="flex bg-surface rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded ${viewMode === 'cards' ? 'bg-accent-primary text-white' : 'text-foreground-muted'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-accent-primary text-white' : 'text-foreground-muted'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

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
              <div className="flex gap-1 mb-4">
                <div className="h-6 bg-background rounded w-16" />
                <div className="h-6 bg-background rounded w-16" />
              </div>
              <div className="h-2 bg-background rounded-full w-full mb-2" />
              <div className="h-4 bg-background rounded w-24" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Lightbulb size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted mb-4">No projects yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-accent-primary hover:underline"
          >
            Create your first project
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const config = statusConfig[project.status]
            const StatusIcon = config.icon
            return (
              <div 
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`bg-surface p-5 rounded-xl border hover:border-accent-primary/50 transition cursor-pointer ${config.border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                    <StatusIcon size={14} className={config.color} />
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(project)
                      }}
                      className="p-1.5 text-foreground-muted hover:text-accent-primary hover:bg-background rounded transition"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                
                {project.description && (
                  <p className="text-sm text-foreground-muted mb-4 line-clamp-2">{project.description}</p>
                )}

                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tech_stack.slice(0, 3).map(tech => (
                      <span key={tech} className="px-2 py-1 bg-background rounded text-xs text-foreground-muted border border-border-subtle">
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <span className="px-2 py-1 text-xs text-foreground-muted">+{project.tech_stack.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">{project.completedTasks}/{project.taskCount} tasks</span>
                    <div className="flex items-center gap-2">
                      {project.live_url && (
                        <a 
                          href={project.live_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-foreground-muted hover:text-accent-primary"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {project.github_url && (
                        <a 
                          href={project.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-foreground-muted hover:text-accent-primary"
                        >
                          <Github size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(project => {
            const config = statusConfig[project.status]
            const StatusIcon = config.icon
            return (
              <div 
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-surface p-4 rounded-xl border border-border-subtle hover:border-accent-primary/30 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                    <StatusIcon size={14} className={config.color} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-xs text-foreground-muted">{project.completedTasks}/{project.taskCount} tasks • {project.progress}% complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {project.tech_stack && (
                    <span className="text-xs text-foreground-muted">{project.tech_stack.slice(0, 2).join(', ')}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(project)
                    }}
                    className="p-1.5 text-foreground-muted hover:text-accent-primary hover:bg-background rounded transition"
                  >
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
          <div className="bg-surface p-6 rounded-2xl w-full max-w-2xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{selectedProject.name}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['idea', 'building', 'shipped'] as const).map(status => {
                    const config = statusConfig[status]
                    const StatusIcon = config.icon
                    return (
                      <button
                        key={status}
                        onClick={() => updateProjectStatus(selectedProject.id, status)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          selectedProject.status === status 
                            ? `${config.bg} ${config.color}` 
                            : 'bg-background text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        <StatusIcon size={14} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-foreground-muted hover:text-foreground">
                <X size={24} />
              </button>
            </div>

            {selectedProject.description && (
              <p className="text-foreground-muted mb-6">{selectedProject.description}</p>
            )}

            {selectedProject.tech_stack && selectedProject.tech_stack.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech_stack.map(tech => (
                    <span key={tech} className="px-3 py-1 bg-background rounded-lg text-sm border border-border-subtle">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(selectedProject.live_url || selectedProject.github_url) && (
              <div className="flex gap-3 mb-6">
                {selectedProject.live_url && (
                  <a
                    href={selectedProject.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition text-sm"
                  >
                    <ExternalLink size={16} />
                    Live Demo
                  </a>
                )}
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-background border border-border-subtle rounded-lg hover:border-accent-primary/50 transition text-sm"
                  >
                    <Github size={16} />
                    View Code
                  </a>
                )}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Tasks ({selectedProject.completedTasks}/{selectedProject.taskCount})</h3>
                <div className="text-sm text-foreground-muted">{selectedProject.progress}% Complete</div>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-accent-primary transition-all"
                  style={{ width: `${selectedProject.progress}%` }}
                />
              </div>

              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {tasks.filter(t => t.project_id === selectedProject.id).length === 0 ? (
                  <p className="text-foreground-muted text-sm text-center py-4">No tasks yet</p>
                ) : (
                  tasks.filter(t => t.project_id === selectedProject.id).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                      <button
                        onClick={() => toggleTask(task.id, task.status)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          task.status === 'done' ? 'bg-accent-success border-accent-success text-white' : 'border-border-subtle'
                        }`}
                      >
                        {task.status === 'done' && <CheckCircle2 size={14} />}
                      </button>
                      <span className={`flex-1 ${task.status === 'done' ? 'line-through text-foreground-muted' : ''}`}>
                        {task.title}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-foreground-muted hover:text-red-400 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={addTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <button
                  type="submit"
                  disabled={!newTask.trim()}
                  className="px-4 py-2 bg-accent-primary text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition"
                >
                  <Plus size={18} />
                </button>
              </form>
            </div>

            <button
              onClick={() => deleteProject(selectedProject.id)}
              className="w-full py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm"
            >
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-8 rounded-2xl w-full max-w-5xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
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
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="What is this project about?"
                  />
                </div>
              </div>

              {/* Row 2: Status Selection */}
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
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all font-medium ${
                          formData.status === status
                            ? `${config.bg} ${config.border} ${config.color} shadow-lg`
                            : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50 hover:text-foreground'
                        }`}
                      >
                        <StatusIcon size={20} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row 3: Tech Stack and URLs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Tech Stack</label>
                  <input
                    type="text"
                    value={formData.tech_stack}
                    onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="Next.js, TypeScript"
                  />
                </div>

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
