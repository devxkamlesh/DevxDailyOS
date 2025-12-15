'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Announcement } from '@/types/database'
import {
  Megaphone, Plus, Edit2, Trash2, Eye, EyeOff, X, Save,
  Info, AlertTriangle, CheckCircle2, XCircle, Sparkles,
  Calendar, Users, Bell
} from 'lucide-react'

const typeConfig = {
  info: { label: 'Info', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  success: { label: 'Success', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  error: { label: 'Error', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  update: { label: 'Update', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' }
}

const audienceConfig = {
  all: { label: 'All Users', icon: Users },
  free: { label: 'Free Users', icon: Users },
  premium: { label: 'Premium Users', icon: Users },
  new_users: { label: 'New Users', icon: Users }
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '', content: '', type: 'info' as Announcement['type'],
    is_active: true, is_dismissible: true, show_on_dashboard: true,
    priority: 0, target_audience: 'all' as Announcement['target_audience'],
    start_date: new Date().toISOString().split('T')[0], end_date: ''
  })
  const supabase = createClient()

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const resetForm = () => {
    setFormData({
      title: '', content: '', type: 'info', is_active: true, is_dismissible: true,
      show_on_dashboard: true, priority: 0, target_audience: 'all',
      start_date: new Date().toISOString().split('T')[0], end_date: ''
    })
    setEditingAnnouncement(null)
  }

  const openEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title, content: announcement.content, type: announcement.type,
      is_active: announcement.is_active, is_dismissible: announcement.is_dismissible,
      show_on_dashboard: announcement.show_on_dashboard, priority: announcement.priority,
      target_audience: announcement.target_audience,
      start_date: announcement.start_date.split('T')[0],
      end_date: announcement.end_date?.split('T')[0] || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      created_by: user?.id
    }

    if (editingAnnouncement) {
      await supabase.from('announcements').update(payload).eq('id', editingAnnouncement.id)
    } else {
      await supabase.from('announcements').insert(payload)
    }

    resetForm()
    setShowForm(false)
    fetchAnnouncements()
    setSaving(false)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('announcements').update({ is_active: !isActive }).eq('id', id)
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_active: !isActive } : a))
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  const activeCount = announcements.filter(a => a.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Announcements</h1>
          <p className="text-[var(--foreground-muted)]">Manage app-wide announcements</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition">
          <Plus size={18} /> New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold">{announcements.length}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Total</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Active</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-gray-400">{announcements.length - activeCount}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Inactive</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-yellow-400">{announcements.filter(a => a.type === 'warning').length}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Warnings</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-[var(--foreground-muted)]">
            <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
            <p>No announcements yet</p>
          </div>
        ) : (
          announcements.map(announcement => {
            const typeCfg = typeConfig[announcement.type]
            const TypeIcon = typeCfg.icon
            return (
              <div key={announcement.id} className={`bg-[var(--surface)] rounded-xl p-5 border ${announcement.is_active ? 'border-[var(--border-subtle)]' : 'border-dashed border-gray-600 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${typeCfg.bg}`}>
                      <TypeIcon size={20} className={typeCfg.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        {!announcement.is_active && <span className="text-xs px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded">Inactive</span>}
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)] mb-2">{announcement.content}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                        <span className={`px-2 py-0.5 rounded ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                        <span>Priority: {announcement.priority}</span>
                        <span>Audience: {audienceConfig[announcement.target_audience].label}</span>
                        {announcement.end_date && <span>Ends: {new Date(announcement.end_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(announcement.id, announcement.is_active)} className="p-2 hover:bg-[var(--background)] rounded-lg" title={announcement.is_active ? 'Deactivate' : 'Activate'}>
                      {announcement.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => openEdit(announcement)} className="p-2 hover:bg-[var(--background)] rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => deleteAnnouncement(announcement.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-xl font-bold">{editingAnnouncement ? 'Edit' : 'New'} Announcement</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none" required />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Content</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Announcement['type'] })} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl">
                    {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Audience</label>
                  <select value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as Announcement['target_audience'] })} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl">
                    {Object.entries(audienceConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl" />
                </div>
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">End Date (optional)</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Priority (higher = shown first)</label>
                <input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_dismissible} onChange={(e) => setFormData({ ...formData, is_dismissible: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">Dismissible by users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.show_on_dashboard} onChange={(e) => setFormData({ ...formData, show_on_dashboard: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">Show on dashboard</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--surface)] transition font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  <Save size={18} /> {editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
