'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InstagramPost } from '@/types/database'
import Link from 'next/link'
import {
  Plus, X, Video, Image, Smartphone, Edit2, Trash2, Calendar, TrendingUp, GripVertical,
  Search, Filter, LayoutGrid, List, Columns3, Star, Clock, Eye, Heart, MessageCircle,
  Hash, Copy, CheckCircle2, Lightbulb, FileText, Send, Instagram, Sparkles, Target, ExternalLink
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent,
  PointerSensor, useSensor, useSensors, closestCorners, useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const statusColumns = ['idea', 'draft', 'scheduled', 'posted'] as const

const statusConfig = {
  idea: { label: 'Ideas', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Lightbulb },
  draft: { label: 'Drafts', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: FileText },
  scheduled: { label: 'Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Clock },
  posted: { label: 'Posted', color: 'text-accent-success', bg: 'bg-accent-success/10', border: 'border-accent-success/30', icon: CheckCircle2 }
}

const formatConfig: Record<string, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  reel: { icon: Video, label: 'Reel', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  post: { icon: Image, label: 'Post', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  story: { icon: Smartphone, label: 'Story', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  carousel: { icon: Copy, label: 'Carousel', color: 'text-purple-400', bg: 'bg-purple-500/10' }
}

const categoryConfig: Record<string, { color: string; bg: string }> = {
  educational: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  entertainment: { color: 'text-pink-400', bg: 'bg-pink-500/10' },
  promotional: { color: 'text-green-400', bg: 'bg-green-500/10' },
  personal: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  trending: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
  collaboration: { color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
}

type ViewMode = 'kanban' | 'cards' | 'list'

type ExtendedPost = InstagramPost

// Droppable Column
function DroppableColumn({ id, children, config }: {
  id: string; children: React.ReactNode; config: typeof statusConfig[keyof typeof statusConfig]
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`min-h-[500px] bg-surface/50 rounded-xl p-3 border-2 border-dashed ${config.border} space-y-3 transition-all ${isOver ? 'ring-2 ring-accent-primary bg-accent-primary/5 scale-[1.01]' : ''}`}>
      {children}
    </div>
  )
}

// Sortable Post Card
function SortablePostCard({ post, onEdit, onStar, onNavigate }: {
  post: ExtendedPost; onEdit: (p: ExtendedPost) => void; onStar: (id: string, starred: boolean) => void; onNavigate: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const format = formatConfig[post.format]
  const FormatIcon = format.icon
  const category = post.category ? categoryConfig[post.category] : null

  return (
    <div ref={setNodeRef} style={style} onClick={() => onNavigate(post.id)} className="bg-surface p-4 rounded-lg border border-border-subtle hover:border-accent-primary/30 transition cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded">
            <GripVertical size={14} className="text-foreground-muted" />
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${format.bg}`}>
            <FormatIcon size={12} className={format.color} />
            <span className={`text-[10px] font-medium ${format.color}`}>{format.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={(e) => { e.stopPropagation(); onStar(post.id, !post.is_starred) }} className="p-1 text-foreground-muted hover:text-yellow-400 rounded">
            <Star size={12} className={post.is_starred ? 'fill-yellow-400 text-yellow-400' : ''} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(post) }} className="p-1 text-foreground-muted hover:text-accent-primary rounded">
            <Edit2 size={12} />
          </button>
        </div>
      </div>
      {post.title && <h4 className="font-medium text-sm mb-1 line-clamp-1">{post.title}</h4>}
      {category && <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${category.bg} ${category.color} capitalize mb-2`}>{post.category}</span>}
      {post.hook && <p className="text-xs text-foreground-muted line-clamp-2 mb-2">{post.hook}</p>}
      {post.scheduled_date && (
        <div className="flex items-center gap-1 text-[10px] text-purple-400">
          <Calendar size={10} />
          {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {post.scheduled_time && <span>at {post.scheduled_time}</span>}
        </div>
      )}
    </div>
  )
}

export default function InstagramPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<ExtendedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<ExtendedPost | null>(null)
  const [selectedPost, setSelectedPost] = useState<ExtendedPost | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('instagram-view-mode') as ViewMode) || 'kanban'
    }
    return 'kanban'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFormat, setFilterFormat] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [formData, setFormData] = useState({
    title: '', hook: '', caption: '', hashtags: '', format: 'reel' as ExtendedPost['format'],
    status: 'idea' as ExtendedPost['status'], category: '', scheduled_date: '', scheduled_time: '',
    notes: '', thumbnail_idea: '', script: ''
  })
  const [activeTab, setActiveTab] = useState<'content' | 'script' | 'notes'>('content')
  const [copiedScript, setCopiedScript] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchPosts = async () => {
    const { data } = await supabase.from('instagram_posts').select('*').order('is_starred', { ascending: false }).order('created_at', { ascending: false })
    if (data) setPosts(data)
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('instagram-view-mode', viewMode)
  }, [viewMode])

  const handleDragStart = useCallback((event: DragStartEvent) => { setActiveId(event.active.id as string) }, [])
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const overColumn = statusColumns.find(s => over.id === s)
    if (overColumn) setPosts(prev => prev.map(p => p.id === active.id ? { ...p, status: overColumn } : p))
  }, [])
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const overColumn = statusColumns.find(s => over.id === s)
    if (overColumn) {
      await supabase.from('instagram_posts').update({ status: overColumn }).eq('id', active.id)
      fetchPosts()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        title: formData.title || null, hook: formData.hook || null, caption: formData.caption || null,
        hashtags: formData.hashtags || null, format: formData.format, status: formData.status,
        category: formData.category || null, scheduled_date: formData.scheduled_date || null,
        scheduled_time: formData.scheduled_time || null, notes: formData.notes || null,
        thumbnail_idea: formData.thumbnail_idea || null, script: formData.script || null
      }
      if (editingPost) await supabase.from('instagram_posts').update(payload).eq('id', editingPost.id)
      else await supabase.from('instagram_posts').insert({ ...payload, user_id: user.id })
      resetForm()
      fetchPosts()
    } catch (error) { console.error('Error saving post:', error) }
    finally { setSaving(false) }
  }

  const resetForm = () => {
    setFormData({ title: '', hook: '', caption: '', hashtags: '', format: 'reel', status: 'idea', category: '', scheduled_date: '', scheduled_time: '', notes: '', thumbnail_idea: '', script: '' })
    setShowForm(false)
    setEditingPost(null)
    setActiveTab('content')
  }

  const openEdit = (post: ExtendedPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title || '', hook: post.hook || '', caption: post.caption || '', hashtags: post.hashtags || '',
      format: post.format, status: post.status, category: post.category || '', scheduled_date: post.scheduled_date || '',
      scheduled_time: post.scheduled_time || '', notes: post.notes || '', thumbnail_idea: post.thumbnail_idea || '',
      script: post.script || ''
    })
    setShowForm(true)
  }

  const toggleStar = async (id: string, starred: boolean) => {
    await supabase.from('instagram_posts').update({ is_starred: starred }).eq('id', id)
    fetchPosts()
  }

  const updateStatus = async (id: string, status: ExtendedPost['status']) => {
    await supabase.from('instagram_posts').update({ status }).eq('id', id)
    if (selectedPost?.id === id) setSelectedPost({ ...selectedPost, status })
    fetchPosts()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('instagram_posts').delete().eq('id', id)
    setSelectedPost(null)
    fetchPosts()
  }

  const copyToClipboard = async (text: string, type: 'caption' | 'hashtags' | 'script') => {
    await navigator.clipboard.writeText(text)
    if (type === 'caption') { setCopiedCaption(true); setTimeout(() => setCopiedCaption(false), 2000) }
    else if (type === 'hashtags') { setCopiedHashtags(true); setTimeout(() => setCopiedHashtags(false), 2000) }
    else { setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000) }
  }

  // Filtering
  const filteredPosts = posts.filter(p => {
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.hook?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterFormat !== 'all' && p.format !== filterFormat) return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    return true
  })

  const starredPosts = filteredPosts.filter(p => p.is_starred)
  const unstarredPosts = filteredPosts.filter(p => !p.is_starred)
  const sortedPosts = [...starredPosts, ...unstarredPosts]

  const getPostsByStatus = (status: ExtendedPost['status']) => sortedPosts.filter(p => p.status === status)

  // Stats
  const stats = {
    total: posts.length,
    ideas: posts.filter(p => p.status === 'idea').length,
    drafts: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    posted: posts.filter(p => p.status === 'posted').length,
    reels: posts.filter(p => p.format === 'reel').length,
    carousels: posts.filter(p => p.format === 'carousel').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Content Planner</h1>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition text-sm">
                <Plus size={16} /> New Post
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1 text-foreground-muted"><Instagram size={14} /> {stats.total} Posts</span>
              <span className="flex items-center gap-1 text-yellow-400"><Lightbulb size={14} /> {stats.ideas} Ideas</span>
              <span className="flex items-center gap-1 text-purple-400"><Clock size={14} /> {stats.scheduled} Scheduled</span>
              <span className="flex items-center gap-1 text-accent-success"><CheckCircle2 size={14} /> {stats.posted} Posted</span>
              <span className="flex items-center gap-1 text-pink-400"><Video size={14} /> {stats.reels} Reels</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface rounded-lg p-1">
              {(['kanban', 'cards', 'list'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded ${viewMode === mode ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-foreground-muted'}`}>
                  {mode === 'kanban' ? <Columns3 size={18} /> : mode === 'cards' ? <LayoutGrid size={18} /> : <List size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(formatConfig).map(([key, config]) => {
            const count = posts.filter(p => p.format === key).length
            const FormatIcon = config.icon
            return (
              <div key={key} className="bg-surface p-4 rounded-xl border border-border-subtle">
                <div className={`flex items-center gap-2 text-sm mb-1 ${config.color}`}><FormatIcon size={14} /> {config.label}s</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            )
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search posts..." className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${showFilters ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' : 'bg-surface border-border-subtle text-foreground-muted'}`}>
            <Filter size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-surface rounded-xl border border-border-subtle">
            <div>
              <label className="text-xs text-foreground-muted mb-1 block">Format</label>
              <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm">
                <option value="all">All Formats</option>
                {Object.entries(formatConfig).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-foreground-muted mb-1 block">Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm capitalize">
                <option value="all">All Categories</option>
                {Object.keys(categoryConfig).map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-surface rounded w-20 animate-pulse" />
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
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Instagram size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted mb-4">{searchQuery ? 'No posts found' : 'No content yet'}</p>
          {!searchQuery && <button onClick={() => setShowForm(true)} className="text-purple-400 hover:underline">Create your first post</button>}
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map(status => {
              const config = statusConfig[status]
              const StatusIcon = config.icon
              const statusPosts = getPostsByStatus(status)
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon size={16} className={config.color} />
                      <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                    </div>
                    <span className="text-sm text-foreground-muted bg-surface px-2 py-0.5 rounded">{statusPosts.length}</span>
                  </div>
                  <SortableContext items={statusPosts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn id={status} config={config}>
                      {statusPosts.length === 0 ? (
                        <div className="text-center py-8 text-foreground-muted text-sm">No {config.label.toLowerCase()}</div>
                      ) : (
                        statusPosts.map(post => (
                          <SortablePostCard key={post.id} post={post} onEdit={openEdit} onStar={toggleStar} onNavigate={(id) => router.push(`/instagram/${id}`)} />
                        ))
                      )}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              )
            })}
          </div>
          <DragOverlay>{activeId ? <div className="bg-surface p-4 rounded-lg border-2 border-purple-500 shadow-2xl opacity-90 rotate-2"><div className="text-sm font-medium">Moving post...</div></div> : null}</DragOverlay>
        </DndContext>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPosts.map(post => {
            const config = statusConfig[post.status]
            const StatusIcon = config.icon
            const format = formatConfig[post.format]
            const FormatIcon = format.icon
            const category = post.category ? categoryConfig[post.category] : null
            return (
              <div key={post.id} onClick={() => router.push(`/instagram/${post.id}`)} className={`bg-surface p-5 rounded-xl border hover:border-purple-500/50 transition cursor-pointer relative ${config.border}`}>
                {post.is_starred && <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1"><Star size={12} className="text-black" /></div>}
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${format.bg}`}>
                    <FormatIcon size={14} className={format.color} />
                    <span className={`text-xs font-medium ${format.color}`}>{format.label}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
                    <StatusIcon size={12} className={config.color} />
                  </div>
                </div>
                {post.title && <h3 className="font-semibold text-lg mb-1">{post.title}</h3>}
                {category && <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${category.bg} ${category.color} capitalize mb-2`}>{post.category}</span>}
                {post.hook && <p className="text-sm text-foreground-muted mb-3 line-clamp-2">{post.hook}</p>}
                {post.hashtags && (
                  <div className="flex items-center gap-1 text-xs text-foreground-muted mb-3">
                    <Hash size={12} />
                    <span className="truncate">{post.hashtags.split(' ').slice(0, 3).join(' ')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  {post.scheduled_date ? (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Calendar size={12} />
                      {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-foreground-muted">{new Date(post.created_at).toLocaleDateString()}</span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); openEdit(post) }} className="p-1.5 text-foreground-muted hover:text-purple-400 hover:bg-background rounded transition">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedPosts.map(post => {
            const config = statusConfig[post.status]
            const StatusIcon = config.icon
            const format = formatConfig[post.format]
            const FormatIcon = format.icon
            return (
              <div key={post.id} onClick={() => router.push(`/instagram/${post.id}`)} className="bg-surface p-4 rounded-xl border border-border-subtle hover:border-purple-500/30 transition cursor-pointer flex items-center gap-4">
                {post.is_starred && <Star size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${format.bg} flex-shrink-0`}>
                  <FormatIcon size={14} className={format.color} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} flex-shrink-0`}>
                  <StatusIcon size={12} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{post.title || 'Untitled'}</h3>
                  <div className="flex items-center gap-3 text-xs text-foreground-muted">
                    {post.category && <span className="capitalize">{post.category}</span>}
                    {post.scheduled_date && <span className="text-purple-400">Scheduled: {new Date(post.scheduled_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); openEdit(post) }} className="p-1.5 text-foreground-muted hover:text-purple-400 hover:bg-background rounded transition flex-shrink-0">
                  <Edit2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-3xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedPost.is_starred && <Star size={18} className="text-yellow-400 fill-yellow-400" />}
                  <h2 className="text-2xl font-semibold">{selectedPost.title || 'Untitled Post'}</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusColumns.map(status => {
                    const config = statusConfig[status]
                    const StatusIcon = config.icon
                    return (
                      <button key={status} onClick={() => updateStatus(selectedPost.id, status)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedPost.status === status ? `${config.bg} ${config.color}` : 'bg-background text-foreground-muted hover:text-foreground'}`}>
                        <StatusIcon size={14} /> {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/instagram/${selectedPost.id}`} className="p-2 text-foreground-muted hover:text-pink-400 hover:bg-background rounded-lg transition" title="View Full Page">
                  <ExternalLink size={20} />
                </Link>
                <button onClick={() => toggleStar(selectedPost.id, !selectedPost.is_starred)} className="p-2 text-foreground-muted hover:text-yellow-400 hover:bg-background rounded-lg transition">
                  <Star size={20} className={selectedPost.is_starred ? 'fill-yellow-400 text-yellow-400' : ''} />
                </button>
                <button onClick={() => setSelectedPost(null)} className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Post Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-background p-3 rounded-lg">
                <div className="text-xs text-foreground-muted mb-1">Format</div>
                <div className={`flex items-center gap-1 font-medium ${formatConfig[selectedPost.format].color}`}>
                  {(() => { const Icon = formatConfig[selectedPost.format].icon; return <Icon size={14} /> })()}
                  {formatConfig[selectedPost.format].label}
                </div>
              </div>
              {selectedPost.category && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Category</div>
                  <div className={`font-medium capitalize ${categoryConfig[selectedPost.category]?.color || ''}`}>{selectedPost.category}</div>
                </div>
              )}
              {selectedPost.scheduled_date && (
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-foreground-muted mb-1">Scheduled</div>
                  <div className="flex items-center gap-1 font-medium text-purple-400">
                    <Calendar size={14} />{new Date(selectedPost.scheduled_date).toLocaleDateString()}
                    {selectedPost.scheduled_time && <span className="text-xs">at {selectedPost.scheduled_time}</span>}
                  </div>
                </div>
              )}
              <div className="bg-background p-3 rounded-lg">
                <div className="text-xs text-foreground-muted mb-1">Created</div>
                <div className="font-medium">{new Date(selectedPost.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-background p-1 rounded-lg">
              {(['content', 'script', 'notes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-foreground-muted hover:text-foreground'}`}
                >
                  {tab === 'content' && <FileText size={16} />}
                  {tab === 'script' && <Video size={16} />}
                  {tab === 'notes' && <Lightbulb size={16} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
              <>
                {selectedPost.hook && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1 flex items-center gap-2"><Sparkles size={14} className="text-yellow-400" /> Hook</h3>
                    <p className="text-foreground-muted bg-background p-3 rounded-lg">{selectedPost.hook}</p>
                  </div>
                )}

                {selectedPost.caption && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium flex items-center gap-2"><FileText size={14} /> Caption</h3>
                      <button onClick={() => copyToClipboard(selectedPost.caption!, 'caption')} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-purple-400 transition">
                        {copiedCaption ? <CheckCircle2 size={12} className="text-accent-success" /> : <Copy size={12} />}
                        {copiedCaption ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-foreground-muted bg-background p-3 rounded-lg whitespace-pre-wrap">{selectedPost.caption}</p>
                  </div>
                )}

                {selectedPost.hashtags && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium flex items-center gap-2"><Hash size={14} /> Hashtags</h3>
                      <button onClick={() => copyToClipboard(selectedPost.hashtags!, 'hashtags')} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-purple-400 transition">
                        {copiedHashtags ? <CheckCircle2 size={12} className="text-accent-success" /> : <Copy size={12} />}
                        {copiedHashtags ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-blue-400 bg-background p-3 rounded-lg text-sm">{selectedPost.hashtags}</p>
                  </div>
                )}

                {selectedPost.thumbnail_idea && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1 flex items-center gap-2"><Image size={14} /> Thumbnail Idea</h3>
                    <p className="text-foreground-muted bg-background p-3 rounded-lg">{selectedPost.thumbnail_idea}</p>
                  </div>
                )}

                {!selectedPost.hook && !selectedPost.caption && !selectedPost.hashtags && !selectedPost.thumbnail_idea && (
                  <div className="text-center py-8 text-foreground-muted">No content added yet</div>
                )}
              </>
            )}

            {/* Script Tab */}
            {activeTab === 'script' && (
              <div>
                {selectedPost.script ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium flex items-center gap-2"><Video size={14} className="text-pink-400" /> Video Script</h3>
                      <button onClick={() => copyToClipboard(selectedPost.script!, 'script')} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-purple-400 transition">
                        {copiedScript ? <CheckCircle2 size={12} className="text-accent-success" /> : <Copy size={12} />}
                        {copiedScript ? 'Copied!' : 'Copy Script'}
                      </button>
                    </div>
                    <div className="bg-background p-4 rounded-lg whitespace-pre-wrap text-foreground-muted font-mono text-sm leading-relaxed">{selectedPost.script}</div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    <Video size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No script added yet</p>
                    <button onClick={() => openEdit(selectedPost)} className="text-purple-400 hover:underline text-sm mt-2">Add Script</button>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                {selectedPost.notes ? (
                  <div className="bg-background p-4 rounded-lg whitespace-pre-wrap text-foreground-muted">{selectedPost.notes}</div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    <Lightbulb size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No notes added yet</p>
                    <button onClick={() => openEdit(selectedPost)} className="text-purple-400 hover:underline text-sm mt-2">Add Notes</button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <button onClick={() => openEdit(selectedPost)} className="flex-1 py-2 bg-background border border-border-subtle rounded-lg hover:border-purple-500/50 transition text-sm">Edit Post</button>
              <button onClick={() => deletePost(selectedPost.id)} className="py-2 px-4 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-8 rounded-2xl w-full max-w-5xl border border-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
              <button onClick={resetForm} className="p-2 text-foreground-muted hover:text-foreground hover:bg-background rounded-lg transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Title and Hook */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="Post title or topic..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hook / Opening</label>
                  <input type="text" value={formData.hook} onChange={(e) => setFormData({ ...formData, hook: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="Attention-grabbing opening line..." />
                </div>
              </div>

              {/* Row 2: Format and Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Format *</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formatConfig).map(([key, config]) => {
                      const FormatIcon = config.icon
                      return (
                        <button key={key} type="button" onClick={() => setFormData({ ...formData, format: key as ExtendedPost['format'] })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${formData.format === key ? `${config.bg} border-current ${config.color}` : 'bg-background border-border-subtle text-foreground-muted hover:border-purple-500/50'}`}>
                          <FormatIcon size={18} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Status *</label>
                  <div className="flex flex-wrap gap-2">
                    {statusColumns.map(status => {
                      const config = statusConfig[status]
                      const StatusIcon = config.icon
                      return (
                        <button key={status} type="button" onClick={() => setFormData({ ...formData, status })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${formData.status === status ? `${config.bg} ${config.border} ${config.color}` : 'bg-background border-border-subtle text-foreground-muted hover:border-purple-500/50'}`}>
                          <StatusIcon size={18} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Category and Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition capitalize">
                    <option value="">Select category</option>
                    {Object.keys(categoryConfig).map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Scheduled Date</label>
                  <input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Scheduled Time</label>
                  <input type="time" value={formData.scheduled_time} onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
                </div>
              </div>

              {/* Row 4: Script (for Reels/Videos) */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Video size={14} className="text-pink-400" /> Script
                  <span className="text-xs text-foreground-muted font-normal">(for Reels & Videos)</span>
                </label>
                <textarea value={formData.script} onChange={(e) => setFormData({ ...formData, script: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition font-mono text-sm" rows={6} placeholder="[HOOK - 0:00-0:03]&#10;Start with attention grabber...&#10;&#10;[MAIN CONTENT - 0:03-0:25]&#10;Key points to cover...&#10;&#10;[CTA - 0:25-0:30]&#10;Call to action..." />
              </div>

              {/* Row 5: Caption */}
              <div>
                <label className="block text-sm font-medium mb-2">Caption</label>
                <textarea value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition" rows={4} placeholder="Write your full caption here..." />
              </div>

              {/* Row 6: Hashtags */}
              <div>
                <label className="block text-sm font-medium mb-2">Hashtags</label>
                <textarea value={formData.hashtags} onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition" rows={2} placeholder="#coding #developer #tech #programming" />
              </div>

              {/* Row 7: Thumbnail Idea */}
              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail / Visual Idea</label>
                <input type="text" value={formData.thumbnail_idea} onChange={(e) => setFormData({ ...formData, thumbnail_idea: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="Describe the visual concept..." />
              </div>

              {/* Row 8: Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition" rows={2} placeholder="Additional notes, ideas, or reminders..." />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border-subtle">
                <button type="button" onClick={resetForm} className="flex-1 py-3.5 bg-background border-2 border-border-subtle text-foreground rounded-xl hover:bg-surface hover:border-foreground-muted transition font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-lg">
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
