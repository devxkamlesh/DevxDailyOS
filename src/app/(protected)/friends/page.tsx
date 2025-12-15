'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, UserPlus, Search, Check, X, Trophy, Zap, Flame, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ProfileIcon } from '@/lib/profile-icons'

interface Friend {
  id: string
  friend_id: string
  status: string
  created_at: string
  profile: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    current_avatar: string
    level: number
    xp: number
    current_streak: number
    total_completions: number
    weekly_completions: number
    today_completions: number
    total_habits: number
    today_focus_minutes: number
    total_focus_minutes: number
  } | null
}

interface FriendRequest {
  id: string
  user_id: string
  status: string
  created_at: string
  profile: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    current_avatar: string
  } | null
}

interface SearchUser {
  id: string
  username: string
  full_name: string
  avatar_url: string
  current_avatar: string
  level: number
  xp: number
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchFriends()
    fetchFriendRequests()
  }, [])

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: friendships, error: friendsError } = await supabase
        .from('user_friends')
        .select('id, friend_id, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (friendsError) {
        console.error('Error fetching friendships:', friendsError)
        throw friendsError
      }

      if (!friendships || friendships.length === 0) {
        setFriends([])
        return
      }

      const friendIds = friendships.map(f => f.friend_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('public_profiles')
        .select('*')
        .in('id', friendIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message)
      }

      const friendsWithProfiles = friendships.map(friendship => ({
        ...friendship,
        profile: profiles?.find(p => p.id === friendship.friend_id) || null
      }))

      setFriends(friendsWithProfiles)
    } catch (error: any) {
      console.error('Error fetching friends:', error?.message || error)
      toast.error('Failed to load friends')
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: requests, error: requestsError } = await supabase
        .from('user_friends')
        .select('id, user_id, status, created_at')
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
        throw requestsError
      }

      if (!requests || requests.length === 0) {
        setFriendRequests([])
        setLoading(false)
        return
      }

      const requesterIds = requests.map(r => r.user_id)
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url, current_avatar')
        .in('id', requesterIds)

      const requestsWithProfiles = requests.map(request => ({
        ...request,
        profile: profiles?.find(p => p.id === request.user_id) || null
      }))

      setFriendRequests(requestsWithProfiles)
    } catch (error: any) {
      console.error('Error fetching friend requests:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url, current_avatar, level, xp')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setSearchLoading(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existing } = await supabase
        .from('user_friends')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (existing && existing.length > 0) {
        const status = existing[0].status
        if (status === 'accepted') {
          toast.error('You are already friends')
        } else if (status === 'pending') {
          toast.error('Friend request already pending')
        } else {
          toast.error('Cannot send request')
        }
        return
      }

      const { error } = await supabase
        .from('user_friends')
        .insert({ user_id: user.id, friend_id: friendId, status: 'pending' })

      if (error) throw error
      toast.success('Friend request sent!')
      setSearchResults([])
      setSearchQuery('')
      setAddFriendOpen(false)
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send friend request')
    }
  }


  const acceptFriendRequest = async (requestId: string, requesterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Step 1: Update the sender's request (A→B) to accepted
      const { error: updateError } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error updating request:', updateError)
        throw updateError
      }

      // Step 2: Check if reverse friendship (B→A) already exists
      const { data: existingRecords } = await supabase
        .from('user_friends')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('friend_id', requesterId)

      if (!existingRecords || existingRecords.length === 0) {
        // Step 3a: Create reverse friendship (B→A, accepted)
        const { error: insertError } = await supabase
          .from('user_friends')
          .insert({ user_id: user.id, friend_id: requesterId, status: 'accepted' })

        if (insertError) {
          console.error('Error creating reverse friendship:', insertError)
          throw insertError
        }
      } else {
        // Step 3b: Update existing reverse record to accepted
        const { error: updateReverseError } = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('user_id', user.id)
          .eq('friend_id', requesterId)

        if (updateReverseError) {
          console.error('Error updating reverse friendship:', updateReverseError)
        }
      }

      toast.success('Friend request accepted! You are now friends.')
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
      fetchFriends()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (requestId: string, requesterId: string) => {
    try {
      // Delete the friend request record
      // Note: RLS policy must allow friend_id (receiver) to delete
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', requestId)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      
      // Remove from local state immediately
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success('Friend request rejected')
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast.error('Failed to reject friend request. Check RLS policies.')
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) throw error
      toast.success('Friend removed')
      fetchFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('Failed to remove friend')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-surface rounded-2xl border border-border-subtle animate-pulse w-1/4"></div>
          <div className="h-10 bg-surface rounded-2xl border border-border-subtle animate-pulse w-32"></div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-background p-4 rounded-xl animate-pulse h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Friends</h1>
          <p className="text-foreground-muted">Connect with friends and compete together</p>
        </div>
        
        <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus size={18} />
              Add Friend
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>Search for users by username or name</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
              
              {searchLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary mx-auto"></div>
                </div>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                        <ProfileIcon iconId={user.current_avatar} size={20} className="text-accent-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name || user.username}</div>
                        <div className="text-sm text-foreground-muted flex items-center gap-2">
                          @{user.username}
                          <span className="text-purple-500 text-xs">Lv.{user.level}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(user.id)}>Add</Button>
                  </div>
                ))}
              </div>
              
              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="text-center py-4 text-foreground-muted">No users found</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>


      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {friendRequests.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-accent-primary text-white text-xs rounded-full">{friendRequests.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Friends List Tab */}
        <TabsContent value="friends">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-foreground-muted mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
                <p className="text-foreground-muted text-center mb-4">
                  Add friends to see their progress and compete together!
                </p>
                <Button onClick={() => setAddFriendOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Friend
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => (
                <Card key={friend.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        friend.profile?.current_avatar?.startsWith('gold-') ? 'bg-yellow-500/20' : 'bg-accent-primary/20'
                      }`}>
                        <ProfileIcon 
                          iconId={friend.profile?.current_avatar} 
                          size={24} 
                          className={friend.profile?.current_avatar?.startsWith('gold-') ? '' : 'text-accent-primary'} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {friend.profile?.full_name || friend.profile?.username || 'Unknown'}
                        </CardTitle>
                        <CardDescription className="truncate">
                          @{friend.profile?.username || 'user'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-background p-2 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-purple-500">
                          <Trophy size={14} />
                          <span className="font-bold">{friend.profile?.level || 1}</span>
                        </div>
                        <div className="text-xs text-foreground-muted">Level</div>
                      </div>
                      <div className="bg-background p-2 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-orange-500">
                          <Flame size={14} />
                          <span className="font-bold">{friend.profile?.current_streak || 0}</span>
                        </div>
                        <div className="text-xs text-foreground-muted">Streak</div>
                      </div>
                      <div className="bg-background p-2 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-blue-500">
                          <Zap size={14} />
                          <span className="font-bold">{friend.profile?.xp || 0}</span>
                        </div>
                        <div className="text-xs text-foreground-muted">XP</div>
                      </div>
                    </div>

                    <div className="text-sm text-foreground-muted text-center">
                      {friend.profile?.total_completions || 0} habits completed
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/profile/${friend.profile?.username}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye size={14} className="mr-1" />
                          Profile
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeFriend(friend.friend_id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Friend Requests Tab */}
        <TabsContent value="requests">
          {friendRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-12 w-12 text-foreground-muted mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Friend Requests</h3>
                <p className="text-foreground-muted text-center">
                  You don't have any pending friend requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                        <ProfileIcon 
                          iconId={request.profile?.current_avatar} 
                          size={24} 
                          className="text-accent-primary" 
                        />
                      </div>
                      <div>
                        <div className="font-medium">
                          {request.profile?.full_name || request.profile?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-foreground-muted">
                          @{request.profile?.username || 'user'}
                        </div>
                        <div className="text-xs text-foreground-muted">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id, request.user_id)}
                        className="bg-accent-success hover:bg-accent-success/90"
                      >
                        <Check size={16} className="mr-1" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => rejectFriendRequest(request.id, request.user_id)}
                      >
                        <X size={16} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
