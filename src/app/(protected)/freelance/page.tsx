'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FreelanceClient } from '@/types/database'
import { Plus, X, DollarSign, Calendar, Edit2, Trash2, TrendingUp, Users } from 'lucide-react'

const stages = ['lead', 'in_talk', 'proposal', 'active', 'done'] as const

const stageConfig = {
  lead: { label: 'Leads', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  in_talk: { label: 'In Talk', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  proposal: { label: 'Proposal', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  active: { label: 'Active', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  done: { label: 'Done', color: 'text-accent-success', bg: 'bg-accent-success/10', border: 'border-accent-success/30' }
}

const platforms = ['upwork', 'fiverr', 'dm', 'other'] as const

export default function FreelancePage() {
  const [clients, setClients] = useState<FreelanceClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<FreelanceClient | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    platform: 'upwork' as FreelanceClient['platform'],
    project_title: '',
    value: '',
    currency: 'INR',
    stage: 'lead' as FreelanceClient['stage'],
    next_action: '',
    next_action_date: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchClients = async () => {
    const { data } = await supabase
      .from('freelance_clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setClients(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        name: formData.name,
        platform: formData.platform,
        project_title: formData.project_title || null,
        value: formData.value ? parseFloat(formData.value) : null,
        currency: formData.currency,
        stage: formData.stage,
        next_action: formData.next_action || null,
        next_action_date: formData.next_action_date || null,
        notes: formData.notes || null
      }

      if (editingClient) {
        await supabase.from('freelance_clients').update(payload).eq('id', editingClient.id)
      } else {
        await supabase.from('freelance_clients').insert({ ...payload, user_id: user.id })
      }

      resetForm()
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', platform: 'upwork', project_title: '', value: '', currency: 'INR',
      stage: 'lead', next_action: '', next_action_date: '', notes: ''
    })
    setShowForm(false)
    setEditingClient(null)
  }

  const openEdit = (client: FreelanceClient) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      platform: client.platform || 'upwork',
      project_title: client.project_title || '',
      value: client.value?.toString() || '',
      currency: client.currency,
      stage: client.stage,
      next_action: client.next_action || '',
      next_action_date: client.next_action_date || '',
      notes: client.notes || ''
    })
    setShowForm(true)
  }

  const updateStage = async (clientId: string, stage: FreelanceClient['stage']) => {
    await supabase.from('freelance_clients').update({ stage }).eq('id', clientId)
    fetchClients()
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client?')) return
    await supabase.from('freelance_clients').delete().eq('id', id)
    fetchClients()
  }

  const getClientsByStage = (stage: FreelanceClient['stage']) => 
    clients.filter(c => c.stage === stage)

  const totalValue = clients
    .filter(c => c.stage === 'active')
    .reduce((sum, c) => sum + (c.value || 0), 0)

  const totalClients = clients.length
  const activeClients = clients.filter(c => c.stage === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Freelance Pipeline</h1>
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
            <Users size={16} className="text-accent-primary" />
            <span className="text-foreground-muted">{totalClients} Total Clients</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent-success" />
            <span className="text-foreground-muted">{activeClients} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-yellow-400" />
            <span className="text-foreground-muted">₹{totalValue.toLocaleString()} Active Value</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-surface rounded w-16 animate-pulse" />
                <div className="h-5 bg-surface rounded w-6 animate-pulse" />
              </div>
              <div className="min-h-[400px] bg-surface/50 rounded-xl p-3 border-2 border-dashed border-border-subtle space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="bg-surface p-4 rounded-lg border border-border-subtle animate-pulse">
                    <div className="h-4 bg-background rounded w-24 mb-2" />
                    <div className="h-3 bg-background rounded w-16 mb-3" />
                    <div className="h-5 bg-background rounded w-20 mb-3" />
                    <div className="flex gap-1">
                      <div className="h-6 bg-background rounded w-12" />
                      <div className="h-6 bg-background rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stages.map(stage => {
            const config = stageConfig[stage]
            const stageClients = getClientsByStage(stage)
            
            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                  <span className="text-sm text-foreground-muted">{stageClients.length}</span>
                </div>
                
                <div className={`min-h-[400px] bg-surface/50 rounded-xl p-3 border-2 border-dashed ${config.border} space-y-3`}>
                  {stageClients.length === 0 ? (
                    <div className="text-center py-8 text-foreground-muted text-sm">
                      No {config.label.toLowerCase()}
                    </div>
                  ) : (
                    stageClients.map(client => (
                      <div 
                        key={client.id}
                        className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-accent-primary/30 transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm mb-1">{client.name}</h4>
                            <span className="text-xs text-foreground-muted capitalize">{client.platform}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEdit(client)}
                              className="p-1 text-foreground-muted hover:text-accent-primary rounded transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="p-1 text-foreground-muted hover:text-red-400 rounded transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {client.project_title && (
                          <p className="text-xs text-foreground-muted mb-3 line-clamp-2">{client.project_title}</p>
                        )}
                        
                        {client.value && (
                          <div className="flex items-center gap-1 text-accent-success text-sm mb-3">
                            <DollarSign size={14} />
                            {client.currency} {client.value.toLocaleString()}
                          </div>
                        )}
                        
                        {client.next_action && (
                          <div className="text-xs bg-background p-2 rounded mb-3">
                            <div className="text-foreground-muted mb-1">Next Action:</div>
                            <div>{client.next_action}</div>
                            {client.next_action_date && (
                              <div className="text-foreground-muted mt-1 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(client.next_action_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1 flex-wrap">
                          {stages.filter(s => s !== stage).slice(0, 2).map(s => (
                            <button
                              key={s}
                              onClick={() => updateStage(client.id, s)}
                              className="text-xs px-2 py-1 bg-background rounded hover:bg-accent-primary/20 transition capitalize"
                            >
                              → {stageConfig[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
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
              <h2 className="text-2xl font-bold">{editingClient ? 'Edit Client' : 'Add New Lead'}</h2>
              <button 
                onClick={resetForm} 
                className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Client Name and Project Title */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="Client or company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Project Title</label>
                  <input
                    type="text"
                    value={formData.project_title}
                    onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="What's the project about?"
                  />
                </div>
              </div>

              {/* Row 2: Platform, Stage, Value, Currency */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select
                    value={formData.platform || 'upwork'}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as FreelanceClient['platform'] })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary capitalize transition"
                  >
                    {platforms.map(p => (
                      <option key={p} value={p} className="capitalize">{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as FreelanceClient['stage'] })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                  >
                    {stages.map(s => (
                      <option key={s} value={s}>{stageConfig[s].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Value</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Next Action and Date */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Next Action</label>
                  <input
                    type="text"
                    value={formData.next_action}
                    onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="e.g., Send proposal, Follow up call"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Next Action Date</label>
                  <input
                    type="date"
                    value={formData.next_action_date}
                    onChange={(e) => setFormData({ ...formData, next_action_date: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                  />
                </div>
              </div>

              {/* Row 4: Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none transition"
                  rows={3}
                  placeholder="Additional notes, requirements, or context..."
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
