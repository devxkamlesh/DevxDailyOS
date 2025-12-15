'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FreelanceClient } from '@/types/database'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Trash2, Save, Star, StarOff,
  Mail, Phone, Globe, Calendar, DollarSign, Briefcase,
  ArrowUp, ArrowRight, ArrowDown, AlertCircle, ExternalLink,
  MessageSquare, Clock, CheckCircle2, FileText, Copy
} from 'lucide-react'

const stageConfig = {
  lead: { label: 'Lead', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  in_talk: { label: 'In Talk', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  proposal: { label: 'Proposal', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  active: { label: 'Active', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  done: { label: 'Done', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
}

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: ArrowDown },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: ArrowRight },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: ArrowUp },
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle }
}

const platformConfig: Record<string, { label: string; color: string }> = {
  upwork: { label: 'Upwork', color: 'bg-green-500/10 text-green-400' },
  fiverr: { label: 'Fiverr', color: 'bg-emerald-500/10 text-emerald-400' },
  linkedin: { label: 'LinkedIn', color: 'bg-blue-500/10 text-blue-400' },
  twitter: { label: 'Twitter', color: 'bg-sky-500/10 text-sky-400' },
  dm: { label: 'Direct Message', color: 'bg-purple-500/10 text-purple-400' },
  referral: { label: 'Referral', color: 'bg-amber-500/10 text-amber-400' },
  other: { label: 'Other', color: 'bg-gray-500/10 text-gray-400' }
}

const currencySymbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }

export default function FreelanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const supabase = createClient()

  const [client, setClient] = useState<FreelanceClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<FreelanceClient>>({})

  const fetchClient = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('freelance_clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!data) { router.push('/freelance'); return }
    setClient(data)
    setEditForm(data)
    setLoading(false)
  }, [clientId, router, supabase])

  useEffect(() => { fetchClient() }, [fetchClient])

  const updateClient = async (updates: Partial<FreelanceClient>) => {
    if (!client) return
    const { error } = await supabase.from('freelance_clients').update(updates).eq('id', client.id)
    if (!error) setClient({ ...client, ...updates })
  }

  const saveEdit = async () => {
    await updateClient(editForm)
    setEditing(false)
  }

  const toggleStar = async () => {
    await updateClient({ is_starred: !client?.is_starred })
  }

  const deleteClient = async () => {
    if (!client || !confirm('Delete this client?')) return
    await supabase.from('freelance_clients').delete().eq('id', client.id)
    router.push('/freelance')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--surface)] rounded-lg" />
        <div className="h-64 bg-[var(--surface)] rounded-2xl" />
      </div>
    )
  }

  if (!client) return null

  const stageCfg = stageConfig[client.stage]
  const priorityCfg = client.priority ? priorityConfig[client.priority] : null
  const platformCfg = client.platform ? platformConfig[client.platform] : null
  const isOverdue = client.next_action_date && new Date(client.next_action_date) < new Date() && client.stage !== 'done'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/freelance" className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {client.is_starred && <Star size={18} className="text-yellow-400 fill-yellow-400" />}
          </div>
          <p className="text-[var(--foreground-muted)] text-sm">{client.project_title || 'No project title'}</p>
        </div>
        <button onClick={toggleStar} className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          {client.is_starred ? <StarOff size={20} className="text-yellow-400" /> : <Star size={20} />}
        </button>
        <button onClick={() => setEditing(true)} className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          <Edit2 size={20} />
        </button>
        <button onClick={deleteClient} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${stageCfg.bg} rounded-xl p-4 border ${stageCfg.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className={stageCfg.color} />
            <span className="text-xs text-[var(--foreground-muted)]">Stage</span>
          </div>
          <p className={`font-semibold ${stageCfg.color}`}>{stageCfg.label}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-400" />
            <span className="text-xs text-[var(--foreground-muted)]">Value</span>
          </div>
          <p className="font-semibold text-green-400">
            {currencySymbols[client.currency] || client.currency}{client.value?.toLocaleString() || 0}
          </p>
        </div>
        {platformCfg && (
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-xs text-[var(--foreground-muted)]">Platform</span>
            </div>
            <p className="font-semibold">{platformCfg.label}</p>
          </div>
        )}
        {client.next_action_date && (
          <div className={`rounded-xl p-4 border ${isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--surface)] border-[var(--border-subtle)]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className={isOverdue ? 'text-red-400' : 'text-[var(--foreground-muted)]'} />
              <span className="text-xs text-[var(--foreground-muted)]">Next Action</span>
            </div>
            <p className={`font-semibold ${isOverdue ? 'text-red-400' : ''}`}>
              {new Date(client.next_action_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Client Details */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
        <h3 className="font-semibold mb-4">Client Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {priorityCfg && (
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Priority</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${priorityCfg.bg} ${priorityCfg.color}`}>
                <priorityCfg.icon size={14} />
                {priorityCfg.label}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Created</p>
            <span className="text-sm">{new Date(client.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {(client.email || client.phone || client.website) && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          <h3 className="font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Mail size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)]">Email</p>
                    <a href={`mailto:${client.email}`} className="text-blue-400 hover:underline">{client.email}</a>
                  </div>
                </div>
                <button onClick={() => copyToClipboard(client.email!, 'Email')} className="p-2 hover:bg-[var(--background)] rounded-lg transition">
                  <Copy size={16} className="text-[var(--foreground-muted)]" />
                </button>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Phone size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)]">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-green-400 hover:underline">{client.phone}</a>
                  </div>
                </div>
                <button onClick={() => copyToClipboard(client.phone!, 'Phone')} className="p-2 hover:bg-[var(--background)] rounded-lg transition">
                  <Copy size={16} className="text-[var(--foreground-muted)]" />
                </button>
              </div>
            )}
            {client.website && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Globe size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)]">Website</p>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center gap-1">
                      {client.website} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Action */}
      {client.next_action && (
        <div className={`rounded-2xl p-6 border ${isOverdue ? 'bg-red-500/5 border-red-500/30' : 'bg-[var(--surface)] border-[var(--border-subtle)]'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className={isOverdue ? 'text-red-400' : 'text-[var(--foreground-muted)]'} />
            <h3 className="font-semibold">Next Action</h3>
            {isOverdue && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">Overdue</span>}
          </div>
          <p className="text-[var(--foreground)]">{client.next_action}</p>
          {client.next_action_date && (
            <p className={`text-sm mt-2 ${isOverdue ? 'text-red-400' : 'text-[var(--foreground-muted)]'}`}>
              Due: {new Date(client.next_action_date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-[var(--foreground-muted)]" />
            <h3 className="font-semibold">Notes</h3>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-[var(--foreground)]">{client.notes}</pre>
        </div>
      )}

      {/* Stage Change */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--foreground-muted)] mb-3">Change Stage</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(stageConfig) as Array<keyof typeof stageConfig>).map(stage => {
            const cfg = stageConfig[stage]
            return (
              <button
                key={stage}
                onClick={() => updateClient({ stage })}
                className={`px-4 py-2 rounded-lg transition ${client.stage === stage ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : 'bg-[var(--background)] border border-[var(--border-subtle)] hover:bg-[var(--surface)]'}`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditing(false)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-xl font-bold">Edit Client</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Client Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Project Title</label>
                <input
                  type="text"
                  value={editForm.project_title || ''}
                  onChange={e => setEditForm({ ...editForm, project_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Value</label>
                  <input
                    type="number"
                    value={editForm.value || ''}
                    onChange={e => setEditForm({ ...editForm, value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Currency</label>
                  <select
                    value={editForm.currency || 'INR'}
                    onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Platform</label>
                  <select
                    value={editForm.platform || 'other'}
                    onChange={e => setEditForm({ ...editForm, platform: e.target.value as FreelanceClient['platform'] })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
                  >
                    <option value="upwork">Upwork</option>
                    <option value="fiverr">Fiverr</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="dm">Direct Message</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Priority</label>
                  <select
                    value={editForm.priority || 'medium'}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value as FreelanceClient['priority'] })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Website</label>
                <input
                  type="url"
                  value={editForm.website || ''}
                  onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Next Action</label>
                <input
                  type="text"
                  value={editForm.next_action || ''}
                  onChange={e => setEditForm({ ...editForm, next_action: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Next Action Date</label>
                <input
                  type="date"
                  value={editForm.next_action_date || ''}
                  onChange={e => setEditForm({ ...editForm, next_action_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--surface)] transition font-medium">
                Cancel
              </button>
              <button onClick={saveEdit} className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition font-medium flex items-center justify-center gap-2">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
