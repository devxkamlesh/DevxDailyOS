'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { 
  Award, Plus, Edit2, Trash2, X, Users, Search, Check, Star,
  Sparkles, Trophy, Crown, Flame, Zap, Calendar, Filter
} from 'lucide-react'
import { BadgeDisplay, badgeIcons, badgeColors, Badge } from '@/lib/badges'

interface UserProfile {
  id: string
  username: string
  full_name: string
  level: number
  xp: number
  current_streak: number
  total_active_days: number
}

interface UserBadge {
  id: string
  badge_id: string
  is_primary: boolean
  badge: { id: string; name: string; icon: string; color: string }
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Award },
  { id: 'auto', name: 'Auto', icon: Sparkles },
  { id: 'achievement', name: 'Achievement', icon: Trophy },
  { id: 'special', name: 'Special', icon: Crown },
]

export default function AdminBadgesPage() {
  const { showToast } = useToast()
  const supabase = createClient()
  
  const [badges, setBadges] = useState<Badge[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [showBadgeForm, setShowBadgeForm] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'award', color: 'blue', badge_type: 'special' as Badge['badge_type'], price_inr: 0, display_order: 0, is_active: true })
  const [scrollProgress, setScrollProgress] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  
  // User filters
  const [minLevel, setMinLevel] = useState('')
  const [minXp, setMinXp] = useState('')
  const [minStreak, setMinStreak] = useState('')
  const [minActiveDays, setMinActiveDays] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
      const progress = scrollWidth > clientWidth ? (scrollLeft / (scrollWidth - clientWidth)) * 100 : 0
      setScrollProgress(progress)
    }
  }

  const fetchBadges = async () => {
    const { data, error } = await supabase.from('badges').select('*').order('display_order')
    if (error) console.error('Badges error:', error)
    setBadges(data || [])
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, username, full_name, user_rewards(level, xp, current_streak, longest_streak, perfect_days)').order('username')
      if (error) {
        console.error('Users error:', error)
        setError(error.message)
        setLoading(false)
        return
      }
      setUsers((data || []).map((u: any) => ({ 
        ...u, 
        level: u.user_rewards?.[0]?.level || 1, 
        xp: u.user_rewards?.[0]?.xp || 0,
        current_streak: u.user_rewards?.[0]?.current_streak || 0,
        total_active_days: u.user_rewards?.[0]?.perfect_days || 0
      })))
    } catch (e: any) {
      console.error('Fetch users error:', e)
      setError(e.message)
    }
    setLoading(false)
  }

  const fetchUserBadges = async (userId: string) => {
    const { data } = await supabase.from('user_badges').select('id, badge_id, is_primary, badge:badges(id, name, icon, color)').eq('user_id', userId)
    setUserBadges((data || []).map((ub: any) => ({ ...ub, badge: ub.badge })))
  }

  useEffect(() => { fetchBadges(); fetchUsers() }, [])

  const saveBadge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBadge) {
      await supabase.from('badges').update(formData).eq('id', editingBadge.id)
      showToast('Badge updated!', 'success')
    } else {
      await supabase.from('badges').insert(formData)
      showToast('Badge created!', 'success')
    }
    setShowBadgeForm(false); setEditingBadge(null)
    setFormData({ name: '', description: '', icon: 'award', color: 'blue', badge_type: 'special', price_inr: 0, display_order: 0, is_active: true })
    fetchBadges()
  }

  const deleteBadge = async (id: string) => {
    if (!confirm('Delete badge?')) return
    await supabase.from('badges').delete().eq('id', id)
    fetchBadges(); showToast('Deleted', 'success')
  }

  const assignBadge = async (badgeId: string) => {
    if (!selectedUser) return
    const { error } = await supabase.from('user_badges').insert({ user_id: selectedUser.id, badge_id: badgeId, is_primary: false })
    if (error?.code === '23505') { showToast('Already has badge', 'error'); return }
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    showToast('Badge assigned!', 'success')
    fetchUserBadges(selectedUser.id)
  }

  const removeBadge = async (userBadgeId: string) => {
    const { error } = await supabase.from('user_badges').delete().eq('id', userBadgeId)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    showToast('Badge removed!', 'success')
    if (selectedUser) fetchUserBadges(selectedUser.id)
  }

  const setPrimary = async (userBadgeId: string) => {
    if (!selectedUser) return
    await supabase.from('user_badges').update({ is_primary: false }).eq('user_id', selectedUser.id)
    await supabase.from('user_badges').update({ is_primary: true }).eq('id', userBadgeId)
    showToast('Primary set!', 'success')
    fetchUserBadges(selectedUser.id)
  }

  const openUserModal = (user: UserProfile) => {
    setSelectedUser(user)
    fetchUserBadges(user.id)
    setShowUserModal(true)
  }

  const filteredBadges = category === 'all' ? badges : badges.filter(b => b.badge_type === category)
  const filteredUsers = users.filter(u => {
    if (userSearch && !u.username?.toLowerCase().includes(userSearch.toLowerCase()) && !u.full_name?.toLowerCase().includes(userSearch.toLowerCase())) return false
    if (minLevel && u.level < parseInt(minLevel)) return false
    if (minXp && u.xp < parseInt(minXp)) return false
    if (minStreak && u.current_streak < parseInt(minStreak)) return false
    if (minActiveDays && u.total_active_days < parseInt(minActiveDays)) return false
    return true
  })

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Award className="text-yellow-500" /> Badge Management</h1>
        <button onClick={() => setShowBadgeForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm"><Plus size={16} /> New</button>
      </div>

      {/* Badge Slider */}
      <div className="bg-surface rounded-xl border border-border-subtle p-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${category === c.id ? 'bg-accent-primary text-white' : 'bg-background hover:bg-background/80 text-foreground-muted'}`}
            >
              {React.createElement(c.icon, { size: 14 })}
              <span>{c.name}</span>
              <span className="text-xs opacity-70">({(c.id === 'all' ? badges : badges.filter(b => b.badge_type === c.id)).length})</span>
            </button>
          ))}
        </div>
        
        {/* Custom Horizontal Slider */}
        <div className="relative">
          <div 
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredBadges.map(b => (
              <div 
                key={b.id} 
                className={`flex-shrink-0 p-3 rounded-xl border transition hover:shadow-md ${b.is_active ? 'bg-background border-border-subtle hover:border-accent-primary/50' : 'bg-red-500/10 border-red-500/30 opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  <BadgeDisplay badge={b} size="sm" showName={false} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate max-w-[100px]">{b.name}</div>
                    <div className="text-xs text-foreground-muted capitalize">{b.badge_type}</div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button 
                      onClick={() => { setEditingBadge(b); setFormData({ name: b.name, description: b.description || '', icon: b.icon, color: b.color, badge_type: b.badge_type, price_inr: b.price_inr || 0, display_order: b.display_order || 0, is_active: b.is_active ?? true }); setShowBadgeForm(true) }} 
                      className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => deleteBadge(b.id)} 
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Custom Scrollbar Track */}
          <div className="mt-3 h-1.5 bg-border-subtle rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-primary rounded-full transition-all duration-150" 
              style={{ width: '30%', marginLeft: `${scrollProgress * 0.7}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Users List - Full Width */}
      <div className="bg-surface rounded-xl border border-border-subtle">
        <div className="p-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <span className="font-medium text-sm">Users ({filteredUsers.length})</span>
            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${showFilters ? 'bg-accent-primary text-white' : 'bg-background text-foreground-muted hover:text-foreground'}`}
              >
                <Filter size={12} /> Filters
              </button>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input type="text" placeholder="Search..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-7 pr-3 py-1.5 bg-background border border-border-subtle rounded-lg text-xs w-40" />
              </div>
            </div>
          </div>
          
          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-border-subtle grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-foreground-muted mb-1 block">Min Level</label>
                <input type="number" placeholder="0" value={minLevel} onChange={e => setMinLevel(e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-xs text-foreground-muted mb-1 block">Min XP</label>
                <input type="number" placeholder="0" value={minXp} onChange={e => setMinXp(e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-xs text-foreground-muted mb-1 block">Min Streak</label>
                <input type="number" placeholder="0" value={minStreak} onChange={e => setMinStreak(e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-xs text-foreground-muted mb-1 block">Min Active Days</label>
                <input type="number" placeholder="0" value={minActiveDays} onChange={e => setMinActiveDays(e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-lg text-xs" />
              </div>
            </div>
          )}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {filteredUsers.map(u => (
            <div key={u.id} onClick={() => openUserModal(u)} className="p-3 border-b border-border-subtle cursor-pointer hover:bg-background/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-sm">{(u.username || 'U')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">@{u.username}</div>
                <div className="text-xs text-foreground-muted">{u.full_name}</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-foreground-muted"><Calendar size={12} className="text-green-500" />{u.total_active_days}d</span>
                <span className="flex items-center gap-1 text-foreground-muted"><Zap size={12} className="text-purple-500" />Lv.{u.level}</span>
                <span className="flex items-center gap-1 text-foreground-muted"><Star size={12} className="text-blue-500" />{u.xp}xp</span>
                <span className="flex items-center gap-1 text-foreground-muted"><Flame size={12} className="text-orange-500" />{u.current_streak}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Badge Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold">{(selectedUser.username || 'U')[0].toUpperCase()}</div>
                <div>
                  <div className="font-medium">@{selectedUser.username}</div>
                  <div className="text-xs text-foreground-muted flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><Calendar size={10} className="text-green-500" />{selectedUser.total_active_days}d</span>
                    <span className="flex items-center gap-0.5"><Zap size={10} className="text-purple-500" />Lv.{selectedUser.level}</span>
                    <span className="flex items-center gap-0.5"><Star size={10} className="text-blue-500" />{selectedUser.xp}xp</span>
                    <span className="flex items-center gap-0.5"><Flame size={10} className="text-orange-500" />{selectedUser.current_streak}🔥</span>
                    <span className="flex items-center gap-0.5"><Award size={10} className="text-yellow-500" />{userBadges.length}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-1 text-foreground-muted hover:text-foreground"><X size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Current Badges */}
              <div className="mb-4">
                <div className="text-xs font-medium text-foreground-muted mb-2">Current Badges ({userBadges.length})</div>
                {userBadges.length === 0 ? (
                  <p className="text-xs text-foreground-muted py-2">No badges assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {userBadges.map(ub => (
                      <div key={ub.id} className={`flex items-center justify-between p-2 rounded-lg ${ub.is_primary ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-background'}`}>
                        <div className="flex items-center gap-2">
                          <BadgeDisplay badge={ub.badge} size="sm" />
                          {ub.is_primary && <Star size={12} className="text-yellow-500" />}
                        </div>
                        <div className="flex gap-1">
                          {!ub.is_primary && <button onClick={() => setPrimary(ub.id)} className="px-2 py-1 text-xs bg-accent-primary/10 text-accent-primary rounded hover:bg-accent-primary/20">Set Primary</button>}
                          <button onClick={() => removeBadge(ub.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Badge */}
              <div>
                <div className="text-xs font-medium text-foreground-muted mb-2">Assign Badge</div>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.is_active && !userBadges.some(ub => ub.badge_id === b.id)).map(b => (
                    <button key={b.id} onClick={() => assignBadge(b.id)} className="p-2 bg-background rounded-lg border border-border-subtle hover:border-accent-primary/50 hover:bg-accent-primary/5 transition" title={b.name}>
                      <BadgeDisplay badge={b} size="sm" />
                    </button>
                  ))}
                  {badges.filter(b => b.is_active && !userBadges.some(ub => ub.badge_id === b.id)).length === 0 && (
                    <p className="text-xs text-green-500 flex items-center gap-1 py-2"><Check size={14} /> User has all available badges</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Form Modal */}
      {showBadgeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-4 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">{editingBadge ? 'Edit Badge' : 'New Badge'}</h2>
              <button onClick={() => { setShowBadgeForm(false); setEditingBadge(null) }} className="text-foreground-muted hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={saveBadge} className="space-y-3">
              <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg text-sm" required />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg text-sm" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <select value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="px-3 py-2 bg-background border border-border-subtle rounded-lg text-sm">
                  {Object.keys(badgeIcons).map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="px-3 py-2 bg-background border border-border-subtle rounded-lg text-sm">
                  {Object.keys(badgeColors).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select value={formData.badge_type} onChange={e => setFormData({ ...formData, badge_type: e.target.value as Badge['badge_type'] })} className="w-full px-3 py-2 bg-background border border-border-subtle rounded-lg text-sm">
                <option value="achievement">Achievement</option>
                <option value="special">Special</option>
                <option value="auto">Auto</option>
              </select>
              <div className="p-3 bg-background rounded-lg flex justify-center"><BadgeDisplay badge={formData as Badge} size="md" /></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowBadgeForm(false); setEditingBadge(null) }} className="flex-1 py-2 border border-border-subtle rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-accent-primary text-white rounded-lg text-sm">{editingBadge ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
