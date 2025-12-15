'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FreelanceClient } from '@/types/database'
import Link from 'next/link'
import {
  Plus, X, DollarSign, Calendar, Edit2, Trash2, TrendingUp, Users, GripVertical,
  Search, Filter, LayoutGrid, List, Columns3, Star, Phone, Mail, Globe,
  Clock, AlertCircle, CheckCircle2, ArrowUp, ArrowRight, ArrowDown, FileText,
  Briefcase, Target, BarChart3, PieChart, Eye
} from 'lucide-react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent,
  PointerSensor, useSensor, useSensors, closestCorners, useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const stages = ['lead', 'in_talk', 'proposal', 'active', 'done'] as const

const stageConfig = {
  lead: { label: 'Leads', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Target },
  in_talk: { label: 'In Talk', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Phone },
  proposal: { label: 'Proposal', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: FileText },
  active: { label: 'Active', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Briefcase },
  done: { label: 'Done', color: 'text-accent-success', bg: 'bg-accent-success/10', border: 'border-accent-success/30', icon: CheckCircle2 }
}

const platforms = ['upwork', 'fiverr', 'linkedin', 'twitter', 'dm', 'referral', 'other'] as const

const platformConfig: Record<string, { color: string; bg: string }> = {
  upwork: { color: 'text-green-400', bg: 'bg-green-500/10' },
  fiverr: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  linkedin: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  twitter: { color: 'text-sky-400', bg: 'bg-sky-500/10' },
  dm: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
  referral: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  other: { color: 'text-gray-400', bg: 'bg-gray-500/10' }
}

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-400', icon: ArrowDown },
  medium: { label: 'Medium', color: 'text-blue-400', icon: ArrowRight },
  high: { label: 'High', color: 'text-orange-400', icon: ArrowUp },
  urgent: { label: 'Urgent', color: 'text-red-400', icon: AlertCircle }
}

type ViewMode = 'kanban' | 'cards' | 'list'

// ExtendedClient is same as FreelanceClient - all properties already defined in base
type ExtendedClient = FreelanceClient

// Droppable Column
function DroppableColumn({ id, children, config }: {
  id: string; children: React.ReactNode; config: typeof stageConfig[keyof typeof stageConfig]
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`min-h-[450px] bg-surface/50 rounded-xl p-3 border-2 border-dashed ${config.border} space-y-3 transition-all ${isOver ? 'ring-2 ring-accent-primary bg-accent-primary/5 scale-[1.01]' : ''}`}>
      {children}
    </div>
  )
}

// Sortable Client Card
function SortableClientCard({ client, onEdit, onStar, onNavigate }: {
  client: ExtendedClient; onEdit: (c: ExtendedClient) => void; onStar: (id: string, starred: boolean) => void; onNavigate: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const config = stageConfig[client.stage]
  const platform = client.platform ? platformConfig[client.platform] : platformConfig.other
  const isOverdue = client.next_action_date && new Date(client.next_action_date) < new Date() && client.stage !== 'done'
  const priority = client.priority ? priorityConfig[client.priority] : null

  return (
    <div ref={setNodeRef} style={style} onClick={() => onNavigate(client.id)} className={`bg-surface p-4 rounded-lg border ${isOverdue ? 'border-red-500/50' : 'border-border-subtle'} hover:border-accent-primary/30 transition cursor-pointer group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded">
            <GripVertical size={14} className="text-foreground-muted" />
          </div>
          {client.is_starred && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={(e) => { e.stopPropagation(); onStar(client.id, !client.is_starred) }} className="p-1 text-foreground-muted hover:text-yellow-400 rounded">
            <Star size={12} className={client.is_starred ? 'fill-yellow-400 text-yellow-400' : ''} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(client) }} className="p-1 text-foreground-muted hover:text-accent-primary rounded">
            <Edit2 size={12} />
          </button>
        </div>
      </div>
      <h4 className="font-medium text-sm mb-1">{client.name}</h4>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${platform.bg} ${platform.color} capitalize`}>{client.platform}</span>
        {priority && <span className={`text-[10px] ${priority.color}`}>{priority.label}</span>}
      </div>
      {client.project_title && <p className="text-xs text-foreground-muted mb-2 line-clamp-1">{client.project_title}</p>}
      {client.value && (
        <div className="flex items-center gap-1 text-accent-success text-sm font-medium mb-2">
          <DollarSign size={14} />
          {client.currency} {client.value.toLocaleString()}
        </div>
      )}
      {client.next_action && (
        <div className={`text-[10px] p-2 rounded ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-background text-foreground-muted'}`}>
          <div className="font-medium mb-0.5">Next: {client.next_action}</div>
          {client.next_action_date && (
            <div className="flex items-center gap-1">
              <Calendar size={10} />
              {new Date(client.next_action_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FreelancePage() {
  const router = useRouter()
  const [clients, setClients] = useState<ExtendedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<ExtendedClient | null>(null)
  const [selectedClient, setSelectedClient] = useState<ExtendedClient | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('freelance-view-mode') as ViewMode) || 'kanban'
    }
    return 'kanban'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [formData, setFormData] = useState({
    name: '', platform: 'upwork' as ExtendedClient['platform'], project_title: '', value: '', currency: 'INR',
    stage: 'lead' as ExtendedClient['stage'], priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    next_action: '', next_action_date: '', notes: '', email: '', phone: '', website: ''
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchClients = async () => {
    const { data } = await supabase.from('freelance_clients').select('*').order('is_starred', { ascending: false }).order('created_at', { ascending: false })
    if (data) setClients(data)
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('freelance-view-mode', viewMode)
  }, [viewMode])

  const handleDragStart = useCallback((event: DragStartEvent) => { setActiveId(event.active.id as string) }, [])
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const overColumn = stages.find(s => over.id === s)
    if (overColumn) setClients(prev => prev.map(c => c.id === active.id ? { ...c, stage: overColumn } : c))
  }, [])
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const overColumn = stages.find(s => over.id === s)
    if (overColumn) {
      await supabase.from('freelance_clients').update({ stage: overColumn }).eq('id', active.id)
      fetchClients()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        name: formData.name, platform: formData.platform, project_title: formData.project_title || null,
        value: formData.value ? parseFloat(formData.value) : null, currency: formData.currency, stage: formData.stage,
        priority: formData.priority, next_action: formData.next_action || null, next_action_date: formData.next_action_date || null,
        notes: formData.notes || null, email: formData.email || null, phone: formData.phone || null, website: formData.website || null
      }
      if (editingClient) await supabase.from('freelance_clients').update(payload).eq('id', editingClient.id)
      else await supabase.from('freelance_clients').insert({ ...payload, user_id: user.id })
      resetForm()
      fetchClients()
    } catch (error) { console.error('Error saving client:', error) }
    finally { setSaving(false) }
  }

  const resetForm = () => {
    setFormData({ name: '', platform: 'upwork', project_title: '', value: '', currency: 'INR', stage: 'lead', priority: 'medium', next_action: '', next_action_date: '', notes: '', email: '', phone: '', website: '' })
    setShowForm(false)
    setEditingClient(null)
  }

  const openEdit = (client: ExtendedClient) => {
    setEditingClient(client)
    setFormData({
      name: client.name, platform: client.platform || 'upwork', project_title: client.project_title || '',
      value: client.value?.toString() || '', currency: client.currency, stage: client.stage,
      priority: client.priority || 'medium', next_action: client.next_action || '', next_action_date: client.next_action_date || '',
      notes: client.notes || '', email: client.email || '', phone: client.phone || '', website: client.website || ''
    })
    setShowForm(true)
  }

  const toggleStar = async (id: string, starred: boolean) => {
    await supabase.from('freelance_clients').update({ is_starred: starred }).eq('id', id)
    fetchClients()
  }

  const updateStage = async (id: string, stage: ExtendedClient['stage']) => {
    await supabase.from('freelance_clients').update({ stage }).eq('id', id)
    if (selectedClient?.id === id) setSelectedClient({ ...selectedClient, stage })
    fetchClients()
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client?')) return
    await supabase.from('freelance_clients').delete().eq('id', id)
    setSelectedClient(null)
    fetchClients()
  }

  // Filtering
  const filteredClients = clients.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.project_title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStage !== 'all' && c.stage !== filterStage) return false
    if (filterPlatform !== 'all' && c.platform !== filterPlatform) return false
    return true
  })

  const starredClients = filteredClients.filter(c => c.is_starred)
  const unstarredClients = filteredClients.filter(c => !c.is_starred)
  const sortedClients = [...starredClients, ...unstarredClients]

  const getClientsByStage = (stage: ExtendedClient['stage']) => sortedClients.filter(c => c.stage === stage)

  // Stats
  const stats = {
    total: clients.length,
    leads: clients.filter(c => c.stage === 'lead').length,
    active: clients.filter(c => c.stage === 'active').length,
    done: clients.filter(c => c.stage === 'done').length,
    totalValue: clients.filter(c => c.stage === 'active').reduce((sum, c) => sum + (c.value || 0), 0),
    pipelineValue: clients.filter(c => ['lead', 'in_talk', 'proposal'].includes(c.stage)).reduce((sum, c) => sum + (c.value || 0), 0),
    completedValue: clients.filter(c => c.stage === 'done').reduce((sum, c) => sum + (c.value || 0), 0),
    overdue: clients.filter(c => c.next_action_date && new Date(c.next_action_date) < new Date() && c.stage !== 'done').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Freelance CRM</h1>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white rounded-lg hover:opacity-90 transition text-sm">
                <Plus size={16} /> New Lead
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1 text-foreground-muted"><Users size={14} /> {stats.total} Clients</span>
              <span className="flex items-center gap-1 text-gray-400"><Target size={14} /> {stats.leads} Leads</span>
              <span className="flex items-center gap-1 text-purple-400"><Briefcase size={14} /> {stats.active} Active</span>
              <span className="flex items-center gap-1 text-accent-success"><CheckCircle2 size={14} /> {stats.done} Done</span>
              {stats.overdue > 0 && <span className="flex items-center gap-1 text-red-400"><AlertCircle size={14} /> {stats.overdue} Overdue</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface rounded-lg p-1">
              {(['kanban', 'cards', 'list'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded ${viewMode === mode ? 'bg-accent-primary text-white' : 'text-foreground-muted'}`}>
                  {mode === 'kanban' ? <Columns3 size={18} /> : mode === 'cards' ? <LayoutGrid size={18} /> : <List size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1"><BarChart3 size={14} /> Pipeline Value</div>
            <div className="text-xl font-bold text-blue-400">₹{stats.pipelineValue.toLocaleString()}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1"><TrendingUp size={14} /> Active Value</div>
            <div className="text-xl font-bold text-purple-400">₹{stats.totalValue.toLocaleString()}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1"><CheckCircle2 size={14} /> Completed</div>
            <div className="text-xl font-bold text-accent-success">₹{stats.completedValue.toLocaleString()}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1"><PieChart size={14} /> Conversion</div>
            <div className="text-xl font-bold">{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search clients..." className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${showFilters ? 'bg-accent-primary text-white border-accent-primary' : 'bg-surface border-border-subtle text-foreground-muted'}`}>
            <Filter size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-surface rounded-xl border border-border-subtle">
            <div>
              <label className="text-xs text-foreground-muted mb-1 block">Stage</label>
              <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm">
                <option value="all">All Stages</option>
                {stages.map(s => <option key={s} value={s}>{stageConfig[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-foreground-muted mb-1 block">Platform</label>
              <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm capitalize">
                <option value="all">All Platforms</option>
                {platforms.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-surface rounded w-20 animate-pulse" />
              <div className="min-h-[400px] bg-surface/50 rounded-xl p-3 border-2 border-dashed border-border-subtle space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="bg-surface p-4 rounded-lg border border-border-subtle animate-pulse">
                    <div className="h-4 bg-background rounded w-24 mb-2" />
                    <div className="h-3 bg-background rounded w-16 mb-3" />
                    <div className="h-5 bg-background rounded w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortedClients.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Users size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted mb-4">{searchQuery ? 'No clients found' : 'No clients yet'}</p>
          {!searchQuery && <button onClick={() => setShowForm(true)} className="text-accent-primary hover:underline">Add your first lead</button>}
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stages.map(stage => {
              const config = stageConfig[stage]
              const StageIcon = config.icon
              const stageClients = getClientsByStage(stage)
              const stageValue = stageClients.reduce((sum, c) => sum + (c.value || 0), 0)
              return (
                <div key={stage} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StageIcon size={16} className={config.color} />
                      <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground-muted bg-surface px-2 py-0.5 rounded">{stageClients.length}</span>
                      {stageValue > 0 && <span className="text-xs text-accent-success">₹{(stageValue / 1000).toFixed(0)}k</span>}
                    </div>
                  </div>
                  <SortableContext items={stageClients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn id={stage} config={config}>
                      {stageClients.length === 0 ? (
                        <div className="text-center py-8 text-foreground-muted text-sm">No {config.label.toLowerCase()}</div>
                      ) : (
                        stageClients.map(client => (
                          <SortableClientCard key={client.id} client={client} onEdit={openEdit} onStar={toggleStar} onNavigate={(id) => router.push(`/freelance/${id}`)} />
                        ))
                      )}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              )
            })}
          </div>
          <DragOverlay>{activeId ? <div className="bg-surface p-4 rounded-lg border-2 border-accent-primary shadow-2xl opacity-90 rotate-2"><div className="text-sm font-medium">Moving client...</div></div> : null}</DragOverlay>
        </DndContext>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedClients.map(client => {
            const config = stageConfig[client.stage]
            const StageIcon = config.icon
            const platform = client.platform ? platformConfig[client.platform] : platformConfig.other
            const isOverdue = client.next_action_date && new Date(client.next_action_date) < new Date() && client.stage !== 'done'
            return (
              <div key={client.id} onClick={() => router.push(`/freelance/${client.id}`)} className={`bg-surface p-5 rounded-xl border hover:border-accent-primary/50 transition cursor-pointer relative ${isOverdue ? 'border-red-500/50' : config.border}`}>
                {client.is_starred && <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1"><Star size={12} className="text-black" /></div>}
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                    <StageIcon size={14} className={config.color} />
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openEdit(client) }} className="p-1.5 text-foreground-muted hover:text-accent-primary hover:bg-background rounded transition">
                    <Edit2 size={14} />
                  </button>
                </div>
                <h3 className="font-semibold text-lg mb-1">{client.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${platform.bg} ${platform.color} capitalize`}>{client.platform}</span>
                  {client.priority && <span className={`text-xs ${priorityConfig[client.priority].color}`}>{priorityConfig[client.priority].label}</span>}
                </div>
                {client.project_title && <p className="text-sm text-foreground-muted mb-3 line-clamp-2">{client.project_title}</p>}
                {client.value && (
                  <div className="flex items-center gap-1 text-accent-success text-lg font-bold mb-3">
                    <DollarSign size={18} />
                    {client.currency} {client.value.toLocaleString()}
                  </div>
                )}
                {client.next_action && (
                  <div className={`text-xs p-2 rounded ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-background text-foreground-muted'}`}>
                    <div className="font-medium">Next: {client.next_action}</div>
                    {client.next_action_date && <div className="flex items-center gap-1 mt-1"><Calendar size={10} />{new Date(client.next_action_date).toLocaleDateString()}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedClients.map(client => {
            const config = stageConfig[client.stage]
            const StageIcon = config.icon
            const platform = client.platform ? platformConfig[client.platform] : platformConfig.other
            const isOverdue = client.next_action_date && new Date(client.next_action_date) < new Date() && client.stage !== 'done'
            return (
              <div key={client.id} onClick={() => router.push(`/freelance/${client.id}`)} className={`bg-surface p-4 rounded-xl border hover:border-accent-primary/30 transition cursor-pointer flex items-center gap-4 ${isOverdue ? 'border-red-500/30' : 'border-border-subtle'}`}>
                {client.is_starred && <Star size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} flex-shrink-0`}>
                  <StageIcon size={14} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{client.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${platform.bg} ${platform.color} capitalize flex-shrink-0`}>{client.platform}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground-muted">
                    {client.project_title && <span className="truncate">{client.project_title}</span>}
                    {client.next_action_date && <span className={isOverdue ? 'text-red-400' : ''}>Due {new Date(client.next_action_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>
                {client.value && <div className="text-accent-success font-bold flex-shrink-0">{client.currency} {client.value.toLocaleString()}</div>}
                <button onClick={(e) => { e.stopPropagation(); openEdit(client) }} className="p-1.5 text-foreground-muted hover:text-accent-primary hover:bg-background rounded transition flex-shrink-0">
                  <Edit2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-2xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedClient.is_starred && <Star size={18} className="text-yellow-400 fill-yellow-400" />}
                  <h2 className="text-2xl font-semibold">{selectedClient.name}</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {stages.map(stage => {
                    const config = stageConfig[stage]
                    const StageIcon = config.icon
                    return (
                      <button key={stage} onClick={() => updateStage(selectedClient.id, stage)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedClient.stage === stage ? `${config.bg} ${config.color}` : 'bg-background text-foreground-muted hover:text-foreground'}`}>
                        <StageIcon size={14} /> {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/freelance/${selectedClient.id}`} className="p-2 text-foreground-muted hover:text-accent-primary hover:bg-background rounded-lg transition" title="View Full Page">
                  <Eye size={20} />
                </Link>
                <button onClick={() => toggleStar(selectedClient.id, !selectedClient.is_starred)} className="p-2 text-foreground-muted hover:text-yellow-400 hover:bg-background rounded-lg transition">
                  <Star size={20} className={selectedClient.is_starred ? 'fill-yellow-400 text-yellow-400' : ''} />
                </button>
                <button onClick={() => setSelectedClient(null)} className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Client Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {selectedClient.value && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Value</div>
                  <div className="flex items-center gap-1 font-bold text-accent-success"><DollarSign size={14} />{selectedClient.currency} {selectedClient.value.toLocaleString()}</div>
                </div>
              )}
              {selectedClient.platform && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Platform</div>
                  <div className={`font-medium capitalize ${platformConfig[selectedClient.platform].color}`}>{selectedClient.platform}</div>
                </div>
              )}
              {selectedClient.priority && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Priority</div>
                  <div className={`font-medium ${priorityConfig[selectedClient.priority].color}`}>{priorityConfig[selectedClient.priority].label}</div>
                </div>
              )}
              {selectedClient.next_action_date && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Next Action</div>
                  <div className={`flex items-center gap-1 font-medium ${new Date(selectedClient.next_action_date) < new Date() && selectedClient.stage !== 'done' ? 'text-red-400' : ''}`}>
                    <Calendar size={14} />{new Date(selectedClient.next_action_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {selectedClient.project_title && <div className="mb-4"><h3 className="text-sm font-medium mb-1">Project</h3><p className="text-foreground-muted">{selectedClient.project_title}</p></div>}
            {selectedClient.next_action && <div className="mb-4 p-3 bg-background rounded-lg"><h3 className="text-sm font-medium mb-1">Next Action</h3><p className="text-foreground-muted">{selectedClient.next_action}</p></div>}

            {/* Contact Info */}
            {(selectedClient.email || selectedClient.phone || selectedClient.website) && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Contact</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.email && <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg text-sm hover:bg-accent-primary/10 transition"><Mail size={14} />{selectedClient.email}</a>}
                  {selectedClient.phone && <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg text-sm hover:bg-accent-primary/10 transition"><Phone size={14} />{selectedClient.phone}</a>}
                  {selectedClient.website && <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg text-sm hover:bg-accent-primary/10 transition"><Globe size={14} />Website</a>}
                </div>
              </div>
            )}

            {selectedClient.notes && <div className="mb-4"><h3 className="text-sm font-medium mb-1">Notes</h3><p className="text-foreground-muted whitespace-pre-wrap">{selectedClient.notes}</p></div>}

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <button onClick={() => openEdit(selectedClient)} className="flex-1 py-2 bg-background border border-border-subtle rounded-lg hover:border-accent-primary/50 transition text-sm">Edit Client</button>
              <button onClick={() => deleteClient(selectedClient.id)} className="py-2 px-4 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-8 rounded-2xl w-full max-w-5xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{editingClient ? 'Edit Client' : 'Add New Lead'}</h2>
              <button onClick={resetForm} className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name and Project */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="Client or company name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project Title</label>
                  <input type="text" value={formData.project_title} onChange={(e) => setFormData({ ...formData, project_title: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="What's the project about?" />
                </div>
              </div>

              {/* Row 2: Stage and Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Stage *</label>
                  <div className="flex flex-wrap gap-2">
                    {stages.map(stage => {
                      const config = stageConfig[stage]
                      const StageIcon = config.icon
                      return (
                        <button key={stage} type="button" onClick={() => setFormData({ ...formData, stage })} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm ${formData.stage === stage ? `${config.bg} ${config.border} ${config.color}` : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50'}`}>
                          <StageIcon size={16} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Priority</label>
                  <div className="flex flex-wrap gap-2">
                    {(['low', 'medium', 'high', 'urgent'] as const).map(priority => {
                      const config = priorityConfig[priority]
                      const PriorityIcon = config.icon
                      return (
                        <button key={priority} type="button" onClick={() => setFormData({ ...formData, priority })} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm ${formData.priority === priority ? `bg-current/10 border-current ${config.color}` : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50'}`}>
                          <PriorityIcon size={16} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Platform, Value, Currency */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select value={formData.platform || 'upwork'} onChange={(e) => setFormData({ ...formData, platform: e.target.value as ExtendedClient['platform'] })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary capitalize transition">
                    {platforms.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Value</label>
                  <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="10000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Next Action Date</label>
                  <input type="date" value={formData.next_action_date} onChange={(e) => setFormData({ ...formData, next_action_date: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" />
                </div>
              </div>

              {/* Row 4: Next Action */}
              <div>
                <label className="block text-sm font-medium mb-2">Next Action</label>
                <input type="text" value={formData.next_action} onChange={(e) => setFormData({ ...formData, next_action: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="e.g., Send proposal, Follow up call, Schedule meeting" />
              </div>

              {/* Row 5: Contact Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="client@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition" placeholder="https://client-website.com" />
                </div>
              </div>

              {/* Row 6: Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none transition" rows={3} placeholder="Additional notes, requirements, or context..." />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border-subtle">
                <button type="button" onClick={resetForm} className="flex-1 py-3.5 bg-background border-2 border-border-subtle text-foreground rounded-xl hover:bg-surface hover:border-foreground-muted transition font-medium">Cancel</button>
                <button type="submit" disabled={saving || !formData.name} className="flex-1 py-3.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-lg shadow-accent-primary/20">
                  {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
