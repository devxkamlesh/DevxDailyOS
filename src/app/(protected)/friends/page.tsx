'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, UserPlus, Search, Check, X, MessageCircle, Trophy, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  friend_profile: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    profile_icon: string
  }
  friend_rewards: {
    level: number
    xp: number
    current_streak: number
  }
}

interface FriendRequest {
  id: string
  user_id: string
  friend_id: string
  status: 'pending'
  created_at: string
  requester_profile: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    profile_icon: string
  }
}

interface UserProfile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  profile_icon: string
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
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

      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          *,
          friend_profile:profiles!user_friends_friend_id_fkey(
            id, username, full_name, avatar_url, profile_icon
          ),
          friend_rewards:user_rewards!user_rewards_user_id_fkey(
            level, xp, current_streak
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (error) throw error
      setFriends(data || [])
    } catch (error) {
      console.error('Error fetching friends:', error)
      toast.error('Failed to load friends')
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          *,
          requester_profile:profiles!user_friends_user_id_fkey(
            id, username, full_name, avatar_url, profile_icon
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      if (error) throw error
      setFriendRequests(data || [])
    } catch (error) {
      console.error('Error fetching friend requests:', error)
      toast.error('Failed to load friend requests')
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
        .from('profiles')
        .select('id, username, full_name, avatar_url, profile_icon')
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

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('user_friends')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (existing && existing.length > 0) {
        toast.error('Friend request already exists or you are already friends')
        return
      }

      const { error } = await supabase
        .from('user_friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        })

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

      // Update the existing request to accepted
      const { error: updateError } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create the reverse friendship
      const { error: insertError } = await supabase
        .from('user_friends')
        .insert({
          user_id: user.id,
          friend_id: requesterId,
          status: 'accepted'
        })

      if (insertError) throw insertError

      toast.success('Friend request accepted!')
      fetchFriends()
      fetchFriendRequests()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', requestId)

      if (error) throw error
      toast.success('Friend request rejected')
      fetchFriendRequests()
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast.error('Failed to reject friend request')
    }
  }

  const removeFriend = async (friendshipId: string, friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Remove both friendship records
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
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">
            Connect with friends and see their progress
          </p>
        </div>
        
        <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>
                Search for users by username or name
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name || user.username}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
              
              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({friendRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
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
                <Card key={friend.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.friend_profile.avatar_url} />
                          <AvatarFallback>
                            {friend.friend_profile.full_name?.charAt(0) || 
                             friend.friend_profile.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {friend.friend_profile.full_name || friend.friend_profile.username}
                          </CardTitle>
                          <CardDescription>
                            @{friend.friend_profile.username}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Level {friend.friend_rewards?.level || 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span>{friend.friend_rewards?.xp || 0} XP</span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current Streak: </span>
                      <span className="font-medium">{friend.friend_rewards?.current_streak || 0} days</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeFriend(friend.id, friend.friend_id)}
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

        <TabsContent value="requests">
          {friendRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Friend Requests</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any pending friend requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.requester_profile.avatar_url} />
                        <AvatarFallback>
                          {request.requester_profile.full_name?.charAt(0) || 
                           request.requester_profile.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {request.requester_profile.full_name || request.requester_profile.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{request.requester_profile.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id, request.user_id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => rejectFriendRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
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