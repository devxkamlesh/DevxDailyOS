'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Feedback } from '@/types/database'
import {
  MessageSquare, Bug, Lightbulb, Sparkles, HelpCircle, Search,
  Filter, CheckCircle2, XCircle, Clock, Eye, Trash2, Save,
  ArrowUp, ArrowRight, ArrowDown, AlertCircle, X, ChevronDown
} from 'lucide-react'

const typeConfig = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10' },
  feature: { label: 'Feature', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  improvement: { label: 'Improvement', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  other: { label: 'Other', icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' }
}

const statusConfig = {
  pending: { label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  reviewing: { label: 'Reviewing', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  planned: { label: 'Planned', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10' }
}

const priorityConfig = {
  low: { label: 'Low', icon: ArrowDown, color: 'text-gray-400', bg: 'bg-gray-500/10' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { label: 'Urgent', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' }
}

interface FeedbackWithUser extends Feedback {
  profiles?: { username: string; full_name: string } | null
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchFeedbacks = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*, profiles(username, full_name)')
      .order('created_at', { ascending: false })
    if (data) setFeedbacks(data)
    setLoading(false)
  }

  useEffect(() => { fetchFeedbacks() }, [])

  const updateFeedback = async (id: string, updates: Partial<Feedback>) => {
    setSaving(true)
    const { error } = await supabase.from('feedback').update(updates).eq('id', id)
    if (!error) {
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, ...updates } : f))
      if (selectedFeedback?.id === id) setSelectedFeedback({ ...selectedFeedback, ...updates })
    }
    setSaving(false)
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm('Delete this feedback?')) return
    await supabase.from('feedback').delete().eq('id', id)
    setFeedbacks(feedbacks.filter(f => f.id !== id))
    setSelectedFeedback(null)
  }

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = searchQuery === '' || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus
    const matchesType = filterType === 'all' || f.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    bugs: feedbacks.filter(f => f.type === 'bug').length,
    features: feedbacks.filter(f => f.type === 'feature').length
  }

  // Skeleton for stats
  const StatsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] h-[76px]">
          <div className="h-8 w-12 bg-[var(--background)] rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-[var(--background)] rounded animate-pulse" />
        </div>
      ))}
    </div>
  )

  // Skeleton for table
  const TableSkeleton = () => (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="bg-[var(--background)] p-4 h-[52px]" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-t border-[var(--border-subtle)] p-4 h-[73px] flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-[var(--background)] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[var(--background)] rounded animate-pulse" />
          </div>
          <div className="h-4 w-16 bg-[var(--background)] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[var(--background)] rounded animate-pulse" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between h-[60px]">
        <div>
          <h1 className="text-2xl font-bold mb-1">Feedback Management</h1>
          <p className="text-[var(--foreground-muted)]">Review and respond to user feedback</p>
        </div>
      </div>

      {/* Stats */}
      {loading ? <StatsSkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] h-[76px]">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-[var(--foreground-muted)]">Total</p>
          </div>
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] h-[76px]">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-[var(--foreground-muted)]">Pending</p>
          </div>
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] h-[76px]">
            <p className="text-2xl font-bold text-red-400">{stats.bugs}</p>
            <p className="text-xs text-[var(--foreground-muted)]">Bugs</p>
          </div>
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] h-[76px]">
            <p className="text-2xl font-bold text-blue-400">{stats.features}</p>
            <p className="text-xs text-[var(--foreground-muted)]">Features</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg focus:outline-none"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg">
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg">
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Feedback Table */}
      {loading ? <TableSkeleton /> : (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden min-h-[400px]">
          <table className="w-full">
            <thead className="bg-[var(--background)]">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">Feedback</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">Type</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">Status</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">User</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">Date</th>
                <th className="text-right p-4 text-sm font-medium text-[var(--foreground-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--foreground-muted)]">
                    No feedback found
                  </td>
                </tr>
              ) : filteredFeedbacks.map(feedback => {
                const typeCfg = typeConfig[feedback.type]
                const statusCfg = statusConfig[feedback.status]
                const priorityCfg = priorityConfig[feedback.priority]
                const TypeIcon = typeCfg.icon
                return (
                  <tr key={feedback.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--background)] h-[73px]">
                    <td className="p-4">
                      <p className="font-medium">{feedback.title}</p>
                      <p className="text-sm text-[var(--foreground-muted)] line-clamp-1">{feedback.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 text-xs ${typeCfg.color}`}>
                        <TypeIcon size={14} /> {typeCfg.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs ${priorityCfg.color}`}>{priorityCfg.label}</span>
                    </td>
                    <td className="p-4 text-sm">{feedback.profiles?.username || 'Anonymous'}</td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">{new Date(feedback.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelectedFeedback(feedback); setAdminNotes(feedback.admin_notes || '') }} className="p-2 hover:bg-[var(--surface)] rounded-lg"><Eye size={16} /></button>
                      <button onClick={() => deleteFeedback(feedback.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFeedback(null)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedFeedback.title}</h2>
                <p className="text-sm text-[var(--foreground-muted)]">
                  By {selectedFeedback.profiles?.username || 'Anonymous'} • {new Date(selectedFeedback.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-[var(--background)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full ${typeConfig[selectedFeedback.type].bg} ${typeConfig[selectedFeedback.type].color}`}>
                  {typeConfig[selectedFeedback.type].label}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig[selectedFeedback.priority].bg || 'bg-gray-500/10'} ${priorityConfig[selectedFeedback.priority].color}`}>
                  {priorityConfig[selectedFeedback.priority].label} Priority
                </span>
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-1">Description</p>
                <p className="bg-[var(--background)] p-4 rounded-lg">{selectedFeedback.description}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => {
                    const cfg = statusConfig[status]
                    return (
                      <button
                        key={status}
                        onClick={() => updateFeedback(selectedFeedback.id, { status })}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${selectedFeedback.status === status ? `${cfg.bg} ${cfg.color} ring-1 ring-current` : 'bg-[var(--background)] hover:bg-[var(--surface)]'}`}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-1">Admin Notes (visible to user)</p>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add a response or notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none resize-none"
                />
                <button
                  onClick={() => updateFeedback(selectedFeedback.id, { admin_notes: adminNotes })}
                  disabled={saving}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  <Save size={16} /> Save Notes
                </button>
              </div>
              {selectedFeedback.page_url && (
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">Page URL</p>
                  <p className="text-xs bg-[var(--background)] p-2 rounded font-mono">{selectedFeedback.page_url}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
