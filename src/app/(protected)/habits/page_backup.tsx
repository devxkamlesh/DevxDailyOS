'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, Task } from '@/types/database'
import { Plus, X, ExternalLink, Github, LayoutGrid, List } from 'lucide-react'

const statusColors = {
  idea: 'bg-yellow-500/20 text-yellow-400',
  building: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-accent-success/20 text-accent-success'
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
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
    
    if (projectsRes.data) setProjects(projectsRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
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

      await supabase.from('projects').insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(s => s.trim()) : null,
        live_url: formData.live_url || null,
        github_url: formData.github_url || null
      })

      setFormData({ name: '', description: '', status: 'idea', tech_stack: '', live_url: '', github_url: '' })
      setShowForm(false)
      fetchData()
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setSaving(false)
    }
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

  const projectTasks = selectedProject 
    ? tasks.filter(t => t.project_id === selectedProject.id)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-foreground-muted">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
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
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="bg-surface p-5 rounded-xl border border-border-subtle hover:border-accent-primary/30 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-foreground-muted text-sm mb-3 line-clamp-2">{project.description}</p>
              )}
              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tech_stack.slice(0, 3).map(tech => (
                    <span key={tech} className="px-2 py-0.5 bg-background rounded text-xs text-foreground-muted">
                      {tech}
                    </span>
                  ))}
                  {project.tech_stack.length > 3 && (
                    <span className="text-xs text-foreground-muted">+{project.tech_stack.length - 3}</span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
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
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="bg-surface p-4 rounded-xl border border-border-subtle hover:border-accent-primary/30 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <h3 className="font-medium">{project.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {project.tech_stack && (
                  <span className="text-xs text-foreground-muted">{project.tech_stack.join(', ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-md border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">New Project</h2>
              <button onClick={() => setShowForm(false)} className="text-foreground-muted hover:text-foreground">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="idea">💡 Idea</option>
                  <option value="building">🔨 Building</option>
                  <option value="shipped">🚀 Shipped</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="Next.js, TypeScript, Tailwind"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Live URL</label>
                <input
                  type="url"
                  value={formData.live_url}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">GitHub URL</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="https://github.com/"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !formData.name}
                className="w-full py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-lg border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  {(['idea', 'building', 'shipped'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => updateProjectStatus(selectedProject.id, status)}
                      className={`px-3 py-1 rounded-full text-xs capitalize transition ${
                        selectedProject.status === status 
                          ? statusColors[status]
                          : 'bg-background text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-foreground-muted hover:text-foreground">
                <X size={24} />
              </button>
            </div>

            {selectedProject.description && (
              <p className="text-foreground-muted mb-4">{selectedProject.description}</p>
            )}

            <div className="mb-6">
              <h3 className="font-medium mb-3">Tasks</h3>
              <div className="space-y-2 mb-3">
                {projectTasks.length === 0 ? (
                  <p className="text-foreground-muted text-sm">No tasks yet</p>
                ) : (
                  projectTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                      <button
                        onClick={() => toggleTask(task.id, task.status)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          task.status === 'done' ? 'bg-accent-success border-accent-success text-white' : 'border-border-subtle'
                        }`}
                      >
                        {task.status === 'done' && '✓'}
                      </button>
                      <span className={task.status === 'done' ? 'line-through text-foreground-muted' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={addTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add task..."
                  className="flex-1 px-3 py-2 bg-background border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <button
                  type="submit"
                  disabled={!newTask.trim()}
                  className="px-3 py-2 bg-accent-primary text-white rounded-lg disabled:opacity-50"
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
    </div>
  )
}
