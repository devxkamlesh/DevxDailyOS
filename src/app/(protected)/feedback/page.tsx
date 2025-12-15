'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Feedback } from '@/types/database'
import {
  MessageSquarePlus, Bug, Lightbulb, Sparkles, HelpCircle,
  Send, Clock, CheckCircle2, XCircle, Loader2, AlertCircle,
  ArrowUp, ArrowRight, ArrowDown, Filter, ChevronDown
} from 'lucide-react'

const typeConfig = {
  bug: { label: 'Bug Report', icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10' },
  feature: { label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
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
  low: { label: 'Low', icon: ArrowDown, color: 'text-gray-400' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-blue-400' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-400' },
  urgent: { label: 'Urgent', icon: AlertCircle, color: 'text-red-400' }
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [formData, setFormData] = useState({
    type: 'feature' as Feedback['type'],
    title: '',
    description: '',
    priority: 'medium' as Feedback['priority']
  })
  const supabase = createClient()

  const fetchFeedbacks = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setFeedbacks(data)
    setLoading(false)
  }

  useEffect(() => { fetchFeedbacks() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) return

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      page_url: window.location.href,
      user_agent: navigator.userAgent
    })

    if (!error) {
      setFormData({ type: 'feature', title: '', description: '', priority: 'medium' })
      setShowForm(false)
      fetchFeedbacks()
    }
    setSubmitting(false)
  }

  const filteredFeedbacks = filterStatus === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.status === filterStatus)

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    inProgress: feedbacks.filter(f => f.status === 'in_progress' || f.status === 'reviewing').length,
    completed: feedbacks.filter(f => f.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--surface)] rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--surface)] rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Feedback & Requests</h1>
          <p className="text-[var(--foreground-muted)]">Submit bugs, feature requests, or suggestions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition"
        >
          <MessageSquarePlus size={18} />
          New Feedback
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Total Submitted</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-gray-400">{stats.pending}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Pending</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-orange-400">{stats.inProgress}</p>
          <p className="text-xs text-[var(--foreground-muted)]">In Progress</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Completed</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-[var(--foreground-muted)]" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg focus:outline-none"
        >
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 text-[var(--foreground-muted)]">
            <MessageSquarePlus size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No feedback yet</p>
            <p className="text-sm">Be the first to submit feedback!</p>
          </div>
        ) : (
          filteredFeedbacks.map(feedback => {
            const typeCfg = typeConfig[feedback.type]
            const statusCfg = statusConfig[feedback.status]
            const priorityCfg = priorityConfig[feedback.priority]
            const TypeIcon = typeCfg.icon
            const PriorityIcon = priorityCfg.icon
            return (
              <div key={feedback.id} className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeCfg.bg}`}>
                      <TypeIcon size={18} className={typeCfg.color} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feedback.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${priorityCfg.color}`}>
                          <PriorityIcon size={12} />
                          {priorityCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">{feedback.description}</p>
                {feedback.admin_notes && (
                  <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">Admin Response:</p>
                    <p className="text-sm">{feedback.admin_notes}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-xl font-bold">Submit Feedback</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Help us improve by sharing your thoughts</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-2 block">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map(type => {
                    const cfg = typeConfig[type]
                    const Icon = cfg.icon
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition ${formData.type === type ? `${cfg.bg} ${cfg.color} border-current` : 'border-[var(--border-subtle)] hover:bg-[var(--background)]'}`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief summary of your feedback"
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about your feedback..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 resize-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Feedback['priority'] })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
                >
                  {Object.entries(priorityConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--surface)] transition font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
