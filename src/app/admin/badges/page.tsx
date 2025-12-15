'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import {
  Award, Plus, Edit2, Trash2, X, Users, Search, Check, Star,
  Sparkles, Trophy, Crown, Flame, Zap, Filter, UserPlus,
  CheckCircle2, Gift, Target, UserMinus
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
  badge_count?: number
}

interface AssignedUser {
  user_badge_id: string
  user_id: string
  username: string
  full_name: string
  is_primary: boolean
}

interface UserWithBadges {
  id: string
  username: string
  full_name: string
  badges: {
    user_badge_id: string
    badge_id: string
    badge_name: string
    badge_icon: string
    badge_color: string
    is_primary: boolean
  }[]
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

  // Data states
  const [badges, setBadges] = useState<Badge[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI states
  const [category, setCategory] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [userBadgesMap, setUserBadgesMap] = useState<Map<string, string[]>>(new Map())
  const [showBadgeForm, setShowBadgeForm] = useState(false)
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null)
  const [assignMode, setAssignMode] = useState<'single' | 'bulk'>('single')
  const [assigning, setAssigning] = useState(false)
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([])
  const [loadingAssigned, setLoadingAssigned] = useState(false)
  
  // All users with badges section
  const [allUsersWithBadges, setAllUsersWithBadges] = useState<UserWithBadges[]>([])
  const [loadingAllUsers, setLoadingAllUsers] = useState(false)
  const [selectedUserForManage, setSelectedUserForManage] = useState<UserWithBadges | null>(null)
  const [allUsersSearch, setAllUsersSearch] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '', description: '', icon: 'award', color: 'blue',
    badge_type: 'special' as Badge['badge_type'],
    price_inr: 0, display_order: 0, is_active: true
  })

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [minLevel, setMinLevel] = useState('')
  const [minXp, setMinXp] = useState('')
  const [minStreak, setMinStreak] = useState('')

  // Fetch all badges
  const fetchBadges = async () => {
    const { data, error } = await supabase.from('badges').select('*').order('display_order')
    if (error) console.error('Badges error:', error)
    setBadges(data || [])
  }

  // Fetch all users with their badges - builds from users who have badge_count > 0
  const fetchAllUsersWithBadges = async () => {
    setLoadingAllUsers(true)
    try {
      // Get all badges first for reference
      const { data: allBadges } = await supabase.from('badges').select('*')
      const badgesById = new Map((allBadges || []).map(b => [b.id, b]))

      // Get profiles with badge IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, user_badges(id, badge_id, is_primary)')
        .order('username')

      if (profilesError) {
        console.error('Profiles error:', profilesError)
        // If RLS blocks user_badges, try without it
        const { data: profilesOnly } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .order('username')
        
        // Use the userBadgesMap from fetchUsers if available
        if (profilesOnly && userBadgesMap.size > 0) {
          const usersWithBadges = profilesOnly
            .filter(p => userBadgesMap.has(p.id) && (userBadgesMap.get(p.id)?.length || 0) > 0)
            .map(p => {
              const badgeIds = userBadgesMap.get(p.id) || []
              return {
                id: p.id,
                username: p.username || 'Unknown',
                full_name: p.full_name || '',
                badges: badgeIds.map(bid => {
                  const badge = badgesById.get(bid)
                  return {
                    user_badge_id: bid, // Using badge_id as fallback
                    badge_id: bid,
                    badge_name: badge?.name || 'Unknown',
                    badge_icon: badge?.icon || 'award',
                    badge_color: badge?.color || 'blue',
                    is_primary: false
                  }
                })
              }
            })
          setAllUsersWithBadges(usersWithBadges)
          setLoadingAllUsers(false)
          return
        }
        throw profilesError
      }

      // Transform data
      const usersWithBadges = (profiles || [])
        .filter((p: any) => p.user_badges && p.user_badges.length > 0)
        .map((p: any) => ({
          id: p.id,
          username: p.username || 'Unknown',
          full_name: p.full_name || '',
          badges: (p.user_badges || []).map((ub: any) => {
            const badge = badgesById.get(ub.badge_id)
            return {
              user_badge_id: ub.id,
              badge_id: ub.badge_id,
              badge_name: badge?.name || 'Unknown',
              badge_icon: badge?.icon || 'award',
              badge_color: badge?.color || 'blue',
              is_primary: ub.is_primary
            }
          })
        }))

      setAllUsersWithBadges(usersWithBadges)
    } catch (e: any) {
      console.error('Fetch all users with badges error:', e)
      setAllUsersWithBadges([])
    }
    setLoadingAllUsers(false)
  }

  // Remove badge from user in manage modal
  const removeUserBadgeInModal = async (userBadgeId: string, badgeName: string) => {
    if (badgeName.toLowerCase() === 'new') {
      showToast('Cannot remove the "New" badge', 'warning')
      return
    }
    
    try {
      // Try admin RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_remove_user_badge', {
        p_user_badge_id: userBadgeId
      })

      if (!rpcError && rpcData) {
        showToast('Badge removed!', 'success')
      } else {
        // Fallback: direct delete
        const { error: deleteError } = await supabase
          .from('user_badges')
          .delete()
          .eq('id', userBadgeId)

        if (deleteError) throw deleteError
        showToast('Badge removed!', 'success')
      }

      // Refresh data
      fetchAllUsersWithBadges()
      fetchUsers()
      
      // Update the modal data
      if (selectedUserForManage) {
        setSelectedUserForManage({
          ...selectedUserForManage,
          badges: selectedUserForManage.badges.filter(b => b.user_badge_id !== userBadgeId)
        })
      }
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error')
    }
  }

  // Set badge as primary for user in manage modal
  const setPrimaryBadgeInModal = async (userBadgeId: string, userId: string) => {
    try {
      // Try RPC first
      const { error: rpcError } = await supabase.rpc('set_primary_badge', {
        p_user_id: userId,
        p_user_badge_id: userBadgeId
      })

      if (rpcError) {
        // Fallback: direct update
        // First, unset all primary badges for this user
        await supabase
          .from('user_badges')
          .update({ is_primary: false })
          .eq('user_id', userId)

        // Then set the selected one as primary
        const { error: updateError } = await supabase
          .from('user_badges')
          .update({ is_primary: true })
          .eq('id', userBadgeId)

        if (updateError) throw updateError
      }

      showToast('Primary badge updated!', 'success')

      // Refresh data
      fetchAllUsersWithBadges()
      fetchUsers()

      // Update the modal data
      if (selectedUserForManage) {
        setSelectedUserForManage({
          ...selectedUserForManage,
          badges: selectedUserForManage.badges.map(b => ({
            ...b,
            is_primary: b.user_badge_id === userBadgeId
          }))
        })
      }
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error')
    }
  }

  // Fetch users with badge counts
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, username, full_name,
          user_rewards(level, xp, current_streak, perfect_days),
          user_badges(badge_id)
        `)
        .order('username')

      if (error) throw error

      const usersData = (data || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        level: u.user_rewards?.[0]?.level || 1,
        xp: u.user_rewards?.[0]?.xp || 0,
        current_streak: u.user_rewards?.[0]?.current_streak || 0,
        total_active_days: u.user_rewards?.[0]?.perfect_days || 0,
        badge_count: u.user_badges?.length || 0
      }))

      // Build user badges map
      const badgesMap = new Map<string, string[]>()
      data?.forEach((u: any) => {
        badgesMap.set(u.id, (u.user_badges || []).map((ub: any) => ub.badge_id))
      })
      setUserBadgesMap(badgesMap)
      setUsers(usersData)
    } catch (e: any) {
      console.error('Fetch users error:', e)
      setError(e.message)
    }
    setLoading(false)
  }

  // Fetch users who have the selected badge
  const fetchAssignedUsers = async (badgeId: string) => {
    setLoadingAssigned(true)
    try {
      // Try admin RPC first, fallback to direct query
      let assignedData: any[] = []
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_get_badge_users', {
        p_badge_id: badgeId
      })

      if (!rpcError && rpcData) {
        assignedData = rpcData
      } else {
        // Fallback: Get user_badges and then fetch profiles separately
        const { data: badgeData, error: badgeError } = await supabase
          .from('user_badges')
          .select('id, user_id, is_primary')
          .eq('badge_id', badgeId)

        if (badgeError) throw badgeError

        if (badgeData && badgeData.length > 0) {
          const userIds = badgeData.map(ub => ub.user_id)
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', userIds)

          const profilesMap = new Map((profilesData || []).map(p => [p.id, p]))
          
          assignedData = badgeData.map(ub => ({
            user_badge_id: ub.id,
            user_id: ub.user_id,
            username: profilesMap.get(ub.user_id)?.username || 'Unknown',
            full_name: profilesMap.get(ub.user_id)?.full_name || '',
            is_primary: ub.is_primary
          }))
        }
      }

      setAssignedUsers(assignedData.map((ub: any) => ({
        user_badge_id: ub.user_badge_id || ub.id,
        user_id: ub.user_id,
        username: ub.username || 'Unknown',
        full_name: ub.full_name || '',
        is_primary: ub.is_primary
      })))
    } catch (e: any) {
      console.error('Fetch assigned users error:', e)
      setAssignedUsers([])
    }
    setLoadingAssigned(false)
  }

  // Remove badge from user
  const removeBadgeFromUser = async (userBadgeId: string) => {
    try {
      // Try admin RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_remove_user_badge', {
        p_user_badge_id: userBadgeId
      })

      if (!rpcError && rpcData) {
        showToast('Badge removed!', 'success')
        if (selectedBadge) fetchAssignedUsers(selectedBadge.id)
        fetchUsers()
        return
      }

      // Fallback: direct delete (requires admin RLS)
      const { error: deleteError } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', userBadgeId)

      if (deleteError) throw deleteError

      showToast('Badge removed!', 'success')
      if (selectedBadge) fetchAssignedUsers(selectedBadge.id)
      fetchUsers()
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error')
    }
  }

  useEffect(() => {
    fetchBadges()
    fetchUsers()
    fetchAllUsersWithBadges()
  }, [])

  // Fetch assigned users when badge is selected
  useEffect(() => {
    if (selectedBadge) {
      fetchAssignedUsers(selectedBadge.id)
    } else {
      setAssignedUsers([])
    }
  }, [selectedBadge])


  // Save badge (create/update)
  const saveBadge = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBadge) {
        // Try RPC first, fallback to direct update
        const { error: rpcError } = await supabase.rpc('admin_update_badge', {
          p_badge_id: editingBadge.id,
          p_name: formData.name,
          p_description: formData.description || '',
          p_icon: formData.icon,
          p_color: formData.color,
          p_badge_type: formData.badge_type,
          p_display_order: formData.display_order,
          p_is_active: formData.is_active
        })
        
        if (rpcError) {
          // Fallback to direct update
          const { error } = await supabase.from('badges').update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            badge_type: formData.badge_type,
            display_order: formData.display_order,
            is_active: formData.is_active
          }).eq('id', editingBadge.id)
          if (error) throw error
        }
        showToast('Badge updated!', 'success')
      } else {
        // Try RPC first, fallback to direct insert
        const { error: rpcError } = await supabase.rpc('admin_create_badge', {
          p_name: formData.name,
          p_description: formData.description || '',
          p_icon: formData.icon,
          p_color: formData.color,
          p_badge_type: formData.badge_type,
          p_display_order: formData.display_order,
          p_is_active: formData.is_active
        })
        
        if (rpcError) {
          // Fallback to direct insert
          const { error } = await supabase.from('badges').insert({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            badge_type: formData.badge_type,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
          if (error) throw error
        }
        showToast('Badge created!', 'success')
      }
      setShowBadgeForm(false)
      setEditingBadge(null)
      setFormData({ name: '', description: '', icon: 'award', color: 'blue', badge_type: 'special', price_inr: 0, display_order: 0, is_active: true })
      fetchBadges()
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error')
    }
  }

  // Delete badge
  const deleteBadge = async (id: string) => {
    if (!confirm('Delete this badge? Users who have it will lose it.')) return
    
    // Try RPC first, fallback to direct delete
    const { error: rpcError } = await supabase.rpc('admin_delete_badge', { p_badge_id: id })
    
    if (rpcError) {
      const { error } = await supabase.from('badges').delete().eq('id', id)
      if (error) {
        showToast('Error: ' + error.message, 'error')
        return
      }
    }
    
    if (selectedBadge?.id === id) setSelectedBadge(null)
    fetchBadges()
    showToast('Badge deleted', 'success')
  }

  // Assign badge to single user
  const assignBadgeToUser = async (userId: string, badgeId: string) => {
    try {
      const { data, error } = await supabase.rpc('assign_user_badge', {
        p_user_id: userId,
        p_badge_id: badgeId
      })
      if (error) throw error
      if (!data) return { success: false, reason: 'already_has' }
      return { success: true }
    } catch (error: any) {
      return { success: false, reason: error.message }
    }
  }

  // Bulk assign selected badge to selected users
  const bulkAssignBadge = async () => {
    if (!selectedBadge || selectedUsers.size === 0) return

    setAssigning(true)
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const userId of selectedUsers) {
      const result = await assignBadgeToUser(userId, selectedBadge.id)
      if (result.success) successCount++
      else if (result.reason === 'already_has') skipCount++
      else errorCount++
    }

    setAssigning(false)
    setSelectedUsers(new Set())
    fetchUsers()
    if (selectedBadge) fetchAssignedUsers(selectedBadge.id)

    if (successCount > 0) showToast(`Assigned to ${successCount} user(s)`, 'success')
    if (skipCount > 0) showToast(`${skipCount} already had this badge`, 'warning')
    if (errorCount > 0) showToast(`${errorCount} failed`, 'error')
  }

  // Quick assign (single click)
  const quickAssign = async (userId: string) => {
    if (!selectedBadge) return
    setAssigning(true)
    const result = await assignBadgeToUser(userId, selectedBadge.id)
    setAssigning(false)

    if (result.success) {
      showToast('Badge assigned!', 'success')
      fetchUsers()
      fetchAssignedUsers(selectedBadge.id)
    } else if (result.reason === 'already_has') {
      showToast('User already has this badge', 'warning')
    } else {
      showToast('Error: ' + result.reason, 'error')
    }
  }

  // Toggle user selection for bulk assign
  const toggleUserSelection = (userId: string) => {
    const newSet = new Set(selectedUsers)
    if (newSet.has(userId)) newSet.delete(userId)
    else newSet.add(userId)
    setSelectedUsers(newSet)
  }

  // Select all filtered users
  const selectAllFiltered = () => {
    const newSet = new Set(filteredUsers.map(u => u.id))
    setSelectedUsers(newSet)
  }

  // Check if user has the selected badge
  const userHasBadge = (userId: string, badgeId: string) => {
    return userBadgesMap.get(userId)?.includes(badgeId) || false
  }

  // Filtered data
  const filteredBadges = category === 'all' ? badges : badges.filter(b => b.badge_type === category)
  const filteredUsers = users.filter(u => {
    if (userSearch && !u.username?.toLowerCase().includes(userSearch.toLowerCase()) && !u.full_name?.toLowerCase().includes(userSearch.toLowerCase())) return false
    if (minLevel && u.level < parseInt(minLevel)) return false
    if (minXp && u.xp < parseInt(minXp)) return false
    if (minStreak && u.current_streak < parseInt(minStreak)) return false
    return true
  })

  // Users who don't have the selected badge
  const eligibleUsers = selectedBadge
    ? filteredUsers.filter(u => !userHasBadge(u.id, selectedBadge.id))
    : filteredUsers

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" /></div>
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Award className="text-yellow-500" /> Badge Management
        </h1>
        <button
          onClick={() => setShowBadgeForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition"
        >
          <Plus size={16} /> Create Badge
        </button>
      </div>

      {/* Main Layout - Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Badges */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category Tabs */}
          <div className="bg-surface rounded-xl border border-border-subtle p-3">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    category === c.id
                      ? 'bg-accent-primary text-white'
                      : 'bg-background hover:bg-background/80 text-foreground-muted'
                  }`}
                >
                  {React.createElement(c.icon, { size: 12 })}
                  {c.name}
                  <span className="opacity-70">
                    ({c.id === 'all' ? badges.length : badges.filter(b => b.badge_type === c.id).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Badge Grid */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="text-xs font-medium text-foreground-muted mb-3 flex items-center justify-between">
              <span>Select a badge to assign</span>
              {selectedBadge && (
                <button onClick={() => setSelectedBadge(null)} className="text-accent-primary hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {filteredBadges.map(b => {
                const isSelected = selectedBadge?.id === b.id
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBadge(isSelected ? null : b)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/20'
                        : b.is_active
                          ? 'border-border-subtle bg-background hover:border-accent-primary/50'
                          : 'border-red-500/30 bg-red-500/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BadgeDisplay badge={b} size="sm" showName={false} />
                      {isSelected && <CheckCircle2 size={14} className="text-accent-primary ml-auto" />}
                    </div>
                    <div className="text-xs font-medium truncate">{b.name}</div>
                    <div className="text-[10px] text-foreground-muted capitalize">{b.badge_type}</div>
                  </button>
                )
              })}
            </div>

            {/* Badge Actions */}
            {selectedBadge && (
              <div className="mt-3 pt-3 border-t border-border-subtle flex gap-2">
                <button
                  onClick={() => {
                    setEditingBadge(selectedBadge)
                    setFormData({
                      name: selectedBadge.name,
                      description: selectedBadge.description || '',
                      icon: selectedBadge.icon,
                      color: selectedBadge.color,
                      badge_type: selectedBadge.badge_type,
                      price_inr: selectedBadge.price_inr || 0,
                      display_order: selectedBadge.display_order || 0,
                      is_active: selectedBadge.is_active ?? true
                    })
                    setShowBadgeForm(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-accent-primary/10 text-accent-primary rounded-lg text-xs font-medium hover:bg-accent-primary/20"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => deleteBadge(selectedBadge.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Right Column - Users */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border-subtle overflow-hidden">
          {/* Users Header */}
          <div className="p-4 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                <span className="font-medium">Users</span>
                {selectedBadge && (
                  <span className="text-xs text-foreground-muted">
                    ({eligibleUsers.length} eligible for <span className="text-accent-primary">{selectedBadge.name}</span>)
                  </span>
                )}
              </div>

              {/* Assign Mode Toggle */}
              {selectedBadge && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-background rounded-lg p-0.5">
                    <button
                      onClick={() => { setAssignMode('single'); setSelectedUsers(new Set()) }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                        assignMode === 'single' ? 'bg-accent-primary text-white' : 'text-foreground-muted'
                      }`}
                    >
                      Quick Assign
                    </button>
                    <button
                      onClick={() => setAssignMode('bulk')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                        assignMode === 'bulk' ? 'bg-accent-primary text-white' : 'text-foreground-muted'
                      }`}
                    >
                      Bulk Select
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border-subtle rounded-lg text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition ${
                  showFilters ? 'bg-accent-primary text-white' : 'bg-background text-foreground-muted hover:text-foreground'
                }`}
              >
                <Filter size={14} />
              </button>
              {assignMode === 'bulk' && selectedBadge && (
                <>
                  <button
                    onClick={selectAllFiltered}
                    className="px-3 py-2 bg-background text-foreground-muted hover:text-foreground rounded-lg text-sm"
                  >
                    Select All ({eligibleUsers.length})
                  </button>
                  {selectedUsers.size > 0 && (
                    <button
                      onClick={bulkAssignBadge}
                      disabled={assigning}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      <Gift size={14} />
                      {assigning ? 'Assigning...' : `Assign to ${selectedUsers.size}`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-border-subtle grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted mb-1 block">Min Level</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={minLevel}
                    onChange={e => setMinLevel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted mb-1 block">Min XP</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={minXp}
                    onChange={e => setMinXp(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted mb-1 block">Min Streak</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={minStreak}
                    onChange={e => setMinStreak(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>


          {/* Users List */}
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {!selectedBadge ? (
              <div className="p-8 text-center text-foreground-muted">
                <Target size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a badge from the left to start assigning</p>
              </div>
            ) : eligibleUsers.length === 0 ? (
              <div className="p-8 text-center text-foreground-muted">
                <CheckCircle2 size={40} className="mx-auto mb-3 text-green-500" />
                <p className="text-sm">All filtered users already have this badge!</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {eligibleUsers.map(u => {
                  const hasBadge = selectedBadge ? userHasBadge(u.id, selectedBadge.id) : false
                  const isSelected = selectedUsers.has(u.id)

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        if (hasBadge) return
                        if (assignMode === 'bulk') toggleUserSelection(u.id)
                        else quickAssign(u.id)
                      }}
                      className={`p-3 flex items-center gap-3 transition cursor-pointer ${
                        hasBadge
                          ? 'opacity-40 cursor-not-allowed bg-green-500/5'
                          : isSelected
                            ? 'bg-accent-primary/10'
                            : 'hover:bg-background/50'
                      }`}
                    >
                      {/* Selection Checkbox (Bulk Mode) */}
                      {assignMode === 'bulk' && !hasBadge && (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          isSelected ? 'bg-accent-primary border-accent-primary' : 'border-border-subtle'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold">
                        {(u.username || 'U')[0].toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">@{u.username}</span>
                          {hasBadge && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded">
                              Has Badge
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-foreground-muted">{u.full_name}</div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Zap size={12} className="text-purple-500" />
                          Lv.{u.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-blue-500" />
                          {u.xp}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-orange-500" />
                          {u.current_streak}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award size={12} className="text-yellow-500" />
                          {u.badge_count}
                        </span>
                      </div>

                      {/* Quick Assign Button (Single Mode) */}
                      {assignMode === 'single' && !hasBadge && (
                        <button
                          onClick={(e) => { e.stopPropagation(); quickAssign(u.id) }}
                          disabled={assigning}
                          className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-xs font-medium hover:bg-accent-primary/90 disabled:opacity-50"
                        >
                          <UserPlus size={12} /> Assign
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Assigned Users Section */}
      {selectedBadge && (
        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              <span className="font-medium">Users with "{selectedBadge.name}"</span>
              <span className="text-xs text-foreground-muted">({assignedUsers.length})</span>
            </div>
            <BadgeDisplay badge={selectedBadge} size="sm" showName={false} />
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {loadingAssigned ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : assignedUsers.length === 0 ? (
              <div className="p-8 text-center text-foreground-muted">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users have this badge yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                {assignedUsers.map(u => (
                  <div
                    key={u.user_badge_id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      u.is_primary ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-background'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-sm">
                      {(u.username || 'U')[0].toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">@{u.username}</span>
                        {u.is_primary && (
                          <Star size={12} className="text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-foreground-muted truncate">{u.full_name}</div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeBadgeFromUser(u.user_badge_id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex-shrink-0"
                      title="Remove badge"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Users with Badges Section */}
      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-500" />
              <span className="font-medium">All Users with Badges</span>
              <span className="text-xs text-foreground-muted">({allUsersWithBadges.length} users)</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={allUsersSearch}
                onChange={e => setAllUsersSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border-subtle rounded-lg text-sm w-48"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {loadingAllUsers ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : allUsersWithBadges.filter(u => 
              !allUsersSearch || 
              u.username?.toLowerCase().includes(allUsersSearch.toLowerCase()) ||
              u.full_name?.toLowerCase().includes(allUsersSearch.toLowerCase())
            ).length === 0 ? (
            <div className="p-8 text-center text-foreground-muted">
              <Award size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users with badges found</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {allUsersWithBadges
                .filter(u => 
                  !allUsersSearch || 
                  u.username?.toLowerCase().includes(allUsersSearch.toLowerCase()) ||
                  u.full_name?.toLowerCase().includes(allUsersSearch.toLowerCase())
                )
                .map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserForManage(user)}
                    className="p-3 flex items-center gap-3 hover:bg-background/50 cursor-pointer transition"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold">
                      {(user.username || 'U')[0].toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">@{user.username}</div>
                      <div className="text-xs text-foreground-muted">{user.full_name}</div>
                    </div>

                    {/* Badge Preview */}
                    <div className="flex items-center gap-1">
                      {user.badges.slice(0, 4).map((b, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: `var(--${b.badge_color}-500, #3b82f6)20` }}
                          title={b.badge_name}
                        >
                          <BadgeDisplay badge={{ icon: b.badge_icon, color: b.badge_color } as Badge} size="sm" showName={false} />
                        </div>
                      ))}
                      {user.badges.length > 4 && (
                        <span className="text-xs text-foreground-muted">+{user.badges.length - 4}</span>
                      )}
                    </div>

                    {/* Badge Count */}
                    <div className="flex items-center gap-1 text-xs text-foreground-muted">
                      <Award size={14} className="text-yellow-500" />
                      {user.badges.length}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* User Badge Management Modal */}
      {selectedUserForManage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold">
                  {(selectedUserForManage.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold">@{selectedUserForManage.username}</div>
                  <div className="text-xs text-foreground-muted">{selectedUserForManage.full_name}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForManage(null)}
                className="p-1 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="text-sm font-medium text-foreground-muted mb-3">
                Badges ({selectedUserForManage.badges.length})
              </div>
              
              {selectedUserForManage.badges.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                  <Award size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No badges</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {selectedUserForManage.badges.map(badge => (
                    <div
                      key={badge.user_badge_id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        badge.is_primary ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BadgeDisplay 
                          badge={{ icon: badge.badge_icon, color: badge.badge_color, name: badge.badge_name } as Badge} 
                          size="sm" 
                        />
                        {badge.is_primary && (
                          <Star size={14} className="text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!badge.is_primary && (
                          <button
                            onClick={() => setPrimaryBadgeInModal(badge.user_badge_id, selectedUserForManage.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-lg text-xs font-medium hover:bg-yellow-500/20 transition"
                          >
                            <Star size={12} /> Set Primary
                          </button>
                        )}
                        {badge.badge_name.toLowerCase() !== 'new' ? (
                          <button
                            onClick={() => removeUserBadgeInModal(badge.user_badge_id, badge.badge_name)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20 transition"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        ) : (
                          <span className="text-xs text-foreground-muted px-3 py-1.5">Protected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle">
              <button
                onClick={() => setSelectedUserForManage(null)}
                className="w-full py-2.5 bg-background border border-border-subtle rounded-xl text-sm font-medium hover:bg-background/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Form Modal */}
      {showBadgeForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-bold text-lg">{editingBadge ? 'Edit Badge' : 'Create New Badge'}</h2>
              <button
                onClick={() => { setShowBadgeForm(false); setEditingBadge(null) }}
                className="p-1 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveBadge} className="p-4 space-y-4">
              {/* Preview */}
              <div className="p-4 bg-background rounded-xl flex items-center justify-center">
                <BadgeDisplay badge={formData as Badge} size="lg" />
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 block">Badge Name</label>
                <input
                  type="text"
                  placeholder="e.g., Early Adopter"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 block">Description</label>
                <textarea
                  placeholder="What is this badge for?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-muted mb-1 block">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl text-sm"
                  >
                    {Object.keys(badgeIcons).map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted mb-1 block">Color</label>
                  <select
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl text-sm"
                  >
                    {Object.keys(badgeColors).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-foreground-muted mb-1 block">Badge Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['achievement', 'special', 'auto'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, badge_type: type })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition ${
                        formData.badge_type === type
                          ? 'bg-accent-primary text-white'
                          : 'bg-background border border-border-subtle text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-background rounded-xl">
                <span className="text-sm">Active</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-12 h-6 rounded-full transition ${formData.is_active ? 'bg-green-500' : 'bg-border-subtle'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBadgeForm(false); setEditingBadge(null) }}
                  className="flex-1 py-2.5 border border-border-subtle rounded-xl text-sm font-medium hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90"
                >
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
