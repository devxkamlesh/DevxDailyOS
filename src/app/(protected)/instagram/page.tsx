'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InstagramPost } from '@/types/database'
import { Plus, X, Video, Image, Smartphone, Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

const statusColumns = ['idea', 'draft', 'scheduled', 'posted'] as const

const statusConfig = {
  idea: { label: 'Ideas', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  draft: { label: 'Drafts', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  scheduled: { label: 'Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  posted: { label: 'Posted', color: 'text-accent-success', bg: 'bg-accent-success/10', border: 'border-accent-success/30' }
}

const formatConfig: Record<string, { icon: LucideIcon; label: string }> = {
  reel: { icon: Video, label: 'Reel' },
  post: { icon: Image, label: 'Post' },
  story: { icon: Smartphone, label: 'Story' }
}

export default function InstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<InstagramPost | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    hook: '',
    caption: '',
    hashtags: '',
    format: 'reel' as InstagramPost['format'],
    status: 'idea' as InstagramPost['status']
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('instagram_posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        title: formData.title || null,
        hook: formData.hook || null,
        caption: formData.caption || null,
        hashtags: formData.hashtags || null,
        format: formData.format,
        status: formData.status
      }

      if (editingPost) {
        await supabase.from('instagram_posts').update(payload).eq('id', editingPost.id)
      } else {
        await supabase.from('instagram_posts').insert({ ...payload, user_id: user.id })
      }

      resetForm()
      fetchPosts()
    } catch (error) {
      console.error('Error saving post:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', hook: '', caption: '', hashtags: '', format: 'reel', status: 'idea' })
    setShowForm(false)
    setEditingPost(null)
  }

  const openEdit = (post: InstagramPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title || '',
      hook: post.hook || '',
      caption: post.caption || '',
      hashtags: post.hashtags || '',
      format: post.format,
      status: post.status
    })
    setShowForm(true)
  }

  const updateStatus = async (postId: string, status: InstagramPost['status']) => {
    await supabase.from('instagram_posts').update({ status }).eq('id', postId)
    fetchPosts()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('instagram_posts').delete().eq('id', id)
    fetchPosts()
  }

  const getPostsByStatus = (status: InstagramPost['status']) => 
    posts.filter(p => p.status === status)

  const totalPosts = posts.length
  const postedCount = posts.filter(p => p.status === 'posted').length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Instagram Content</h1>
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
            <TrendingUp size={16} className="text-accent-primary" />
            <span className="text-foreground-muted">{totalPosts} Total Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent-success" />
            <span className="text-foreground-muted">{postedCount} Published</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-surface rounded w-20 animate-pulse" />
                <div className="h-5 bg-surface rounded w-6 animate-pulse" />
              </div>
              <div className="min-h-[400px] bg-surface/50 rounded-xl p-3 border-2 border-dashed border-border-subtle space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="bg-surface p-4 rounded-lg border border-border-subtle animate-pulse">
                    <div className="h-6 bg-background rounded-full w-16 mb-3" />
                    <div className="h-4 bg-background rounded w-full mb-2" />
                    <div className="h-3 bg-background rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map(status => {
            const config = statusConfig[status]
            const statusPosts = getPostsByStatus(status)
            
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                  <span className="text-sm text-foreground-muted">{statusPosts.length}</span>
                </div>
                
                <div className={`min-h-[500px] bg-surface/50 rounded-xl p-3 border-2 border-dashed ${config.border} space-y-3`}>
                  {statusPosts.length === 0 ? (
                    <div className="text-center py-8 text-foreground-muted text-sm">
                      No {config.label.toLowerCase()}
                    </div>
                  ) : (
                    statusPosts.map(post => {
                      const FormatIcon = formatConfig[post.format].icon
                      return (
                        <div 
                          key={post.id}
                          className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-accent-primary/30 transition cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bg}`}>
                              <FormatIcon size={14} className={config.color} />
                              <span className={`text-xs ${config.color}`}>{formatConfig[post.format].label}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => openEdit(post)}
                                className="p-1 text-foreground-muted hover:text-accent-primary rounded transition"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deletePost(post.id)}
                                className="p-1 text-foreground-muted hover:text-red-400 rounded transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          {post.title && (
                            <h4 className="font-medium text-sm mb-2">{post.title}</h4>
                          )}
                          
                          {post.hook && (
                            <p className="text-xs text-foreground-muted line-clamp-3 mb-3">{post.hook}</p>
                          )}

                          <div className="flex gap-1 flex-wrap">
                            {statusColumns.filter(s => s !== status).map(s => (
                              <button
                                key={s}
                                onClick={() => updateStatus(post.id, s)}
                                className="text-xs px-2 py-1 bg-background rounded hover:bg-accent-primary/20 transition capitalize"
                              >
                                → {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })
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
              <h2 className="text-2xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
              <button 
                onClick={resetForm} 
                className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Title and Hook */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="Post title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hook / Opening</label>
                  <input
                    type="text"
                    value={formData.hook}
                    onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
                    placeholder="Attention-grabbing opening..."
                  />
                </div>
              </div>

              {/* Row 2: Caption and Hashtags */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Caption</label>
                  <textarea
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none transition"
                    rows={3}
                    placeholder="Full caption..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags</label>
                  <textarea
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none transition"
                    rows={3}
                    placeholder="#coding #developer #tech"
                  />
                </div>
              </div>

              {/* Row 3: Format Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Format *</label>
                <div className="flex flex-wrap gap-3">
                  {(['reel', 'post', 'story'] as const).map(format => {
                    const FormatIcon = formatConfig[format].icon
                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setFormData({ ...formData, format })}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all capitalize font-medium ${
                          formData.format === format
                            ? 'bg-accent-primary text-white border-accent-primary shadow-lg shadow-accent-primary/20'
                            : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50 hover:text-foreground'
                        }`}
                      >
                        <FormatIcon size={20} />
                        {format}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row 4: Status Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Status *</label>
                <div className="flex flex-wrap gap-3">
                  {statusColumns.map(status => {
                    const config = statusConfig[status]
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={`px-5 py-3 rounded-xl border-2 transition-all capitalize font-medium ${
                          formData.status === status
                            ? `${config.bg} ${config.border} ${config.color} shadow-lg`
                            : 'bg-background border-border-subtle text-foreground-muted hover:border-accent-primary/50 hover:text-foreground'
                        }`}
                      >
                        {config.label}
                      </button>
                    )
                  })}
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
                  disabled={saving}
                  className="flex-1 py-3.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-lg shadow-accent-primary/20"
                >
                  {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
