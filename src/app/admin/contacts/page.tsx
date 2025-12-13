'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Mail, Search, Filter, Eye, Archive, Reply, 
  CheckCircle2, Clock, Inbox, ChevronLeft, ChevronRight,
  X, MessageSquare
} from 'lucide-react'

interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export default function AdminContactsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [adminNotes, setAdminNotes] = useState('')
  const supabase = createClient()
  const perPage = 10

  useEffect(() => {
    fetchSubmissions()
  }, [filter, page])

  const fetchSubmissions = async () => {
    setLoading(true)
    let query = supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error, count } = await query

    if (!error && data) {
      setSubmissions(data)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id)

    if (!error) {
      fetchSubmissions()
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: status as any })
      }
    }
  }

  const saveNotes = async () => {
    if (!selectedSubmission) return
    
    const { error } = await supabase
      .from('contact_submissions')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedSubmission.id)

    if (!error) {
      setSelectedSubmission({ ...selectedSubmission, admin_notes: adminNotes })
    }
  }

  const openSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission)
    setAdminNotes(submission.admin_notes || '')
    if (submission.status === 'new') {
      updateStatus(submission.id, 'read')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400'
      case 'read': return 'bg-yellow-500/20 text-yellow-400'
      case 'replied': return 'bg-green-500/20 text-green-400'
      case 'archived': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Inbox size={14} />
      case 'read': return <Eye size={14} />
      case 'replied': return <CheckCircle2 size={14} />
      case 'archived': return <Archive size={14} />
      default: return <Clock size={14} />
    }
  }

  const filteredSubmissions = submissions.filter(s => 
    search === '' || 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.subject.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / perPage)
  const newCount = submissions.filter(s => s.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Mail size={28} />
            Contact Submissions
          </h1>
          <p className="text-foreground-muted mt-1">
            Manage messages from the contact form
          </p>
        </div>
        {newCount > 0 && (
          <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl font-medium">
            {newCount} new message{newCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-foreground-muted" />
          {['all', 'new', 'read', 'replied', 'archived'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === f 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-surface text-foreground-muted hover:text-foreground'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-foreground-muted">Loading...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-foreground-muted">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No submissions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">Status</th>
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">From</th>
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">Subject</th>
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">Date</th>
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr 
                  key={submission.id} 
                  className={`border-t border-border-subtle hover:bg-background/30 cursor-pointer ${
                    submission.status === 'new' ? 'bg-blue-500/5' : ''
                  }`}
                  onClick={() => openSubmission(submission)}
                >
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      {submission.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{submission.name}</div>
                    <div className="text-sm text-foreground-muted">{submission.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="max-w-xs truncate">{submission.subject}</div>
                  </td>
                  <td className="p-4 text-foreground-muted text-sm">
                    {new Date(submission.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => updateStatus(submission.id, 'replied')}
                        className="p-2 hover:bg-green-500/10 rounded-lg text-green-400 transition"
                        title="Mark as Replied"
                      >
                        <Reply size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(submission.id, 'archived')}
                        className="p-2 hover:bg-gray-500/10 rounded-lg text-gray-400 transition"
                        title="Archive"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-subtle">
            <div className="text-sm text-foreground-muted">
              Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-background rounded-lg disabled:opacity-50 hover:bg-surface transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 text-sm">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 bg-background rounded-lg disabled:opacity-50 hover:bg-surface transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedSubmission(null)}>
          <div className="bg-surface rounded-2xl border border-border-subtle w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="text-xl font-semibold">Message Details</h2>
              <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-background rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(selectedSubmission.status)}`}>
                  {getStatusIcon(selectedSubmission.status)}
                  {selectedSubmission.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedSubmission.id, 'replied')}
                    className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/20 transition"
                  >
                    Mark Replied
                  </button>
                  <button
                    onClick={() => updateStatus(selectedSubmission.id, 'archived')}
                    className="px-3 py-1.5 bg-gray-500/10 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-500/20 transition"
                  >
                    Archive
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-foreground-muted">Name</label>
                  <p className="font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Email</label>
                  <p className="font-medium">
                    <a href={`mailto:${selectedSubmission.email}`} className="text-accent-primary hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Subject</label>
                  <p className="font-medium">{selectedSubmission.subject}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">Date</label>
                  <p className="font-medium">
                    {new Date(selectedSubmission.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground-muted">Message</label>
                <div className="mt-2 p-4 bg-background rounded-xl whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground-muted">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="w-full mt-2 p-4 bg-background border border-border-subtle rounded-xl focus:outline-none focus:border-accent-primary resize-none"
                />
                <button
                  onClick={saveNotes}
                  className="mt-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition"
                >
                  Save Notes
                </button>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition"
                >
                  <Reply size={18} />
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
