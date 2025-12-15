'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InstagramPost } from '@/types/database'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Trash2, Save, Star, StarOff,
  Video, Image, Smartphone, Layers, Calendar, Clock,
  Copy, Check, FileText, Hash, Sparkles, MessageSquare
} from 'lucide-react'

const statusConfig = {
  idea: { label: 'Idea', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  draft: { label: 'Draft', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  scheduled: { label: 'Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  posted: { label: 'Posted', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
}

const formatConfig = {
  reel: { label: 'Reel', icon: Video, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  post: { label: 'Post', icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  story: { label: 'Story', icon: Smartphone, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  carousel: { label: 'Carousel', icon: Layers, color: 'text-orange-400', bg: 'bg-orange-500/10' }
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  educational: { label: 'Educational', color: 'bg-blue-500/10 text-blue-400' },
  entertainment: { label: 'Entertainment', color: 'bg-pink-500/10 text-pink-400' },
  promotional: { label: 'Promotional', color: 'bg-green-500/10 text-green-400' },
  personal: { label: 'Personal', color: 'bg-orange-500/10 text-orange-400' },
  trending: { label: 'Trending', color: 'bg-purple-500/10 text-purple-400' },
  collaboration: { label: 'Collaboration', color: 'bg-cyan-500/10 text-cyan-400' }
}

export default function InstagramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const supabase = createClient()

  const [post, setPost] = useState<InstagramPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'script' | 'notes'>('content')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<InstagramPost>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (!data) { router.push('/instagram'); return }
    setPost(data)
    setEditForm(data)
    setLoading(false)
  }, [postId, router, supabase])

  useEffect(() => { fetchPost() }, [fetchPost])

  const updatePost = async (updates: Partial<InstagramPost>) => {
    if (!post) return
    const { error } = await supabase.from('instagram_posts').update(updates).eq('id', post.id)
    if (!error) setPost({ ...post, ...updates })
  }

  const saveEdit = async () => {
    await updatePost(editForm)
    setEditing(false)
  }

  const toggleStar = async () => {
    await updatePost({ is_starred: !post?.is_starred })
  }

  const deletePost = async () => {
    if (!post || !confirm('Delete this post?')) return
    await supabase.from('instagram_posts').delete().eq('id', post.id)
    router.push('/instagram')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--surface)] rounded-lg" />
        <div className="h-64 bg-[var(--surface)] rounded-2xl" />
      </div>
    )
  }

  if (!post) return null

  const statusCfg = statusConfig[post.status]
  const formatCfg = formatConfig[post.format]
  const FormatIcon = formatCfg.icon
  const categoryCfg = post.category ? categoryConfig[post.category] : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/instagram" className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{post.title || 'Untitled Post'}</h1>
            {post.is_starred && <Star size={18} className="text-yellow-400 fill-yellow-400" />}
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${formatCfg.bg} ${formatCfg.color}`}>
              <FormatIcon size={12} />
              {formatCfg.label}
            </span>
            {categoryCfg && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${categoryCfg.color}`}>
                {categoryCfg.label}
              </span>
            )}
          </div>
        </div>
        <button onClick={toggleStar} className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          {post.is_starred ? <StarOff size={20} className="text-yellow-400" /> : <Star size={20} />}
        </button>
        <button onClick={() => setEditing(true)} className="p-2 hover:bg-[var(--surface)] rounded-lg transition">
          <Edit2 size={20} />
        </button>
        <button onClick={deletePost} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${statusCfg.bg} rounded-xl p-4 border ${statusCfg.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className={statusCfg.color} />
            <span className="text-xs text-[var(--foreground-muted)]">Status</span>
          </div>
          <p className={`font-semibold ${statusCfg.color}`}>{statusCfg.label}</p>
        </div>
        <div className={`${formatCfg.bg} rounded-xl p-4 border border-[var(--border-subtle)]`}>
          <div className="flex items-center gap-2 mb-1">
            <FormatIcon size={16} className={formatCfg.color} />
            <span className="text-xs text-[var(--foreground-muted)]">Format</span>
          </div>
          <p className={`font-semibold ${formatCfg.color}`}>{formatCfg.label}</p>
        </div>
        {post.scheduled_date && (
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-xs text-[var(--foreground-muted)]">Scheduled</span>
            </div>
            <p className="font-semibold">{new Date(post.scheduled_date).toLocaleDateString()}</p>
          </div>
        )}
        {post.scheduled_time && (
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-xs text-[var(--foreground-muted)]">Time</span>
            </div>
            <p className="font-semibold">{post.scheduled_time}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${activeTab === 'content' ? 'border-pink-500 text-pink-500' : 'border-transparent text-[var(--foreground-muted)]'}`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${activeTab === 'script' ? 'border-pink-500 text-pink-500' : 'border-transparent text-[var(--foreground-muted)]'}`}
        >
          Script
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${activeTab === 'notes' ? 'border-pink-500 text-pink-500' : 'border-transparent text-[var(--foreground-muted)]'}`}
        >
          Notes
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Hook */}
          {post.hook && (
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-400" />
                  <h3 className="font-semibold">Hook / Opening</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(post.hook!, 'hook')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--background)] rounded-lg hover:bg-[var(--surface)] transition text-sm"
                >
                  {copied === 'hook' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied === 'hook' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[var(--foreground)]">{post.hook}</p>
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-400" />
                  <h3 className="font-semibold">Caption</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(post.caption!, 'caption')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--background)] rounded-lg hover:bg-[var(--surface)] transition text-sm"
                >
                  {copied === 'caption' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied === 'caption' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[var(--foreground)]">{post.caption}</pre>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && (
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash size={18} className="text-purple-400" />
                  <h3 className="font-semibold">Hashtags</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(post.hashtags!, 'hashtags')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--background)] rounded-lg hover:bg-[var(--surface)] transition text-sm"
                >
                  {copied === 'hashtags' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied === 'hashtags' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-purple-400">{post.hashtags}</p>
            </div>
          )}

          {/* Thumbnail Idea */}
          {post.thumbnail_idea && (
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-3">
                <Image size={18} className="text-orange-400" />
                <h3 className="font-semibold">Thumbnail Idea</h3>
              </div>
              <p className="text-[var(--foreground)]">{post.thumbnail_idea}</p>
            </div>
          )}

          {!post.hook && !post.caption && !post.hashtags && (
            <div className="text-center py-12 text-[var(--foreground-muted)]">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No content yet. Click Edit to add content.</p>
            </div>
          )}
        </div>
      )}

      {/* Script Tab */}
      {activeTab === 'script' && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          {post.script ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Video size={18} className="text-pink-400" />
                  <h3 className="font-semibold">Video Script</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(post.script!, 'script')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--background)] rounded-lg hover:bg-[var(--surface)] transition text-sm"
                >
                  {copied === 'script' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied === 'script' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[var(--foreground)] bg-[var(--background)] p-4 rounded-xl">{post.script}</pre>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--foreground-muted)]">
              <Video size={48} className="mx-auto mb-4 opacity-50" />
              <p>No script yet. Click Edit to add a script.</p>
              <p className="text-sm mt-2">Perfect for Reels and video content!</p>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          {post.notes ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-[var(--foreground-muted)]" />
                <h3 className="font-semibold">Notes</h3>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[var(--foreground)]">{post.notes}</pre>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--foreground-muted)]">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No notes yet. Click Edit to add notes.</p>
            </div>
          )}
        </div>
      )}

      {/* Status Change */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--foreground-muted)] mb-3">Change Status</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => {
            const cfg = statusConfig[status]
            return (
              <button
                key={status}
                onClick={() => updatePost({ status })}
                className={`px-4 py-2 rounded-lg transition ${post.status === status ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : 'bg-[var(--background)] border border-[var(--border-subtle)] hover:bg-[var(--surface)]'}`}
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
              <h2 className="text-xl font-bold">Edit Post</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Format</label>
                  <select
                    value={editForm.format || 'post'}
                    onChange={e => setEditForm({ ...editForm, format: e.target.value as InstagramPost['format'] })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
                  >
                    <option value="reel">Reel</option>
                    <option value="post">Post</option>
                    <option value="story">Story</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Category</label>
                  <select
                    value={editForm.category || ''}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="educational">Educational</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="promotional">Promotional</option>
                    <option value="personal">Personal</option>
                    <option value="trending">Trending</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Hook / Opening</label>
                <input
                  type="text"
                  value={editForm.hook || ''}
                  onChange={e => setEditForm({ ...editForm, hook: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Caption</label>
                <textarea
                  value={editForm.caption || ''}
                  onChange={e => setEditForm({ ...editForm, caption: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Hashtags</label>
                <input
                  type="text"
                  value={editForm.hashtags || ''}
                  onChange={e => setEditForm({ ...editForm, hashtags: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Thumbnail Idea</label>
                <input
                  type="text"
                  value={editForm.thumbnail_idea || ''}
                  onChange={e => setEditForm({ ...editForm, thumbnail_idea: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Script (for Reels/Videos)</label>
                <textarea
                  value={editForm.script || ''}
                  onChange={e => setEditForm({ ...editForm, script: e.target.value })}
                  rows={6}
                  placeholder="[0:00] Opening hook...&#10;[0:03] Main content...&#10;[0:15] Call to action..."
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Scheduled Date</label>
                  <input
                    type="date"
                    value={editForm.scheduled_date || ''}
                    onChange={e => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Scheduled Time</label>
                  <input
                    type="time"
                    value={editForm.scheduled_time || ''}
                    onChange={e => setEditForm({ ...editForm, scheduled_time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--foreground-muted)] mb-1 block">Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--surface)] transition font-medium">
                Cancel
              </button>
              <button onClick={saveEdit} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition font-medium flex items-center justify-center gap-2">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
