'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileIcon } from '@/lib/profile-icons'
import { BadgeDisplay, UserBadge } from '@/lib/badges'
import { Calendar, Trophy, Flame, Zap, TrendingUp, Globe, Award, ArrowLeft, UserPlus, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PublicProfile {
  id: string
  username: string
  full_name: string
  bio: string | null
  website: string | null
  profile_icon: string
  current_avatar: string
  xp: number
  level: number
  current_streak: number
  total_completions: number
  total_active_days: number
  achievement_count: number
  created_at: string
  primary_badge: { id: string; name: string; icon: string; color: string } | null
}

type FriendStatus = 'none' | 'pending' | 'accepted' | 'self'

export default function PublicProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none')
  const [addingFriend, setAddingFriend] = useState(false)

  useEffect(() => {
    fetchPublicProfile()
  }, [slug])

  const fetchPublicProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
      
      let query = supabase
        .from('public_profiles')
        .select('*')
        .eq('is_public', true)
      
      if (isUUID) {
        query = query.eq('id', slug)
      } else {
        query = query.ilike('username', slug)
      }
      
      const { data, error } = await query.single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      
      setProfile(data as PublicProfile)
      
      // Check if this is the current user's profile
      if (user && data.id === user.id) {
        setFriendStatus('self')
      } else if (user) {
        // Check friendship status from both directions
        const { data: friendships } = await supabase
          .from('user_friends')
          .select('status')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${data.id}),and(user_id.eq.${data.id},friend_id.eq.${user.id})`)
        
        if (friendships && friendships.length > 0) {
          // If any record shows 'accepted', they are friends
          const isAccepted = friendships.some(f => f.status === 'accepted')
          if (isAccepted) {
            setFriendStatus('accepted')
          } else {
            // Otherwise show pending
            setFriendStatus('pending')
          }
        }
      }
      
      // Fetch user badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select(`
          id, badge_id, is_primary, acquired_at, expires_at,
          badge:badges(id, name, description, icon, color, badge_type, price_inr)
        `)
        .eq('user_id', data.id)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('is_primary', { ascending: false })
      
      if (userBadges) {
        setBadges(userBadges.map((ub: any) => ({
          ...ub,
          badge: ub.badge
        })))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async () => {
    if (!profile) return
    setAddingFriend(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login to add friends')
        return
      }

      const { error } = await supabase
        .from('user_friends')
        .insert({ user_id: user.id, friend_id: profile.id, status: 'pending' })

      if (error) throw error
      
      setFriendStatus('pending')
      toast.success('Friend request sent!')
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send friend request')
    } finally {
      setAddingFriend(false)
    }
  }


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-surface rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-surface rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-foreground-muted mb-6">
          This profile is private or doesn&apos;t exist
        </p>
        <Link href="/leaderboard" className="text-accent-primary hover:underline">
          ← Back to Leaderboard
        </Link>
      </div>
    )
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link 
        href="/leaderboard"
        className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition"
      >
        <ArrowLeft size={18} />
        Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <div className="bg-surface p-8 rounded-2xl border border-border-subtle">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 ${
            profile.current_avatar?.startsWith('gold-') ? 'bg-yellow-500/20' : 'bg-accent-primary/20'
          }`}>
            <ProfileIcon iconId={profile.current_avatar} size={48} className={
              profile.current_avatar?.startsWith('gold-') ? '' : 'text-accent-primary'
            } />
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* Full Name */}
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">
                {profile.full_name || profile.username || 'User'}
              </h1>
              {profile.primary_badge && (
                <BadgeDisplay badge={profile.primary_badge} size="md" />
              )}
            </div>
            
            {/* Username */}
            <p className="text-lg text-foreground-muted mb-3">@{profile.username || 'user'}</p>
            
            {/* Add Friend Button */}
            {friendStatus === 'none' && (
              <Button 
                onClick={sendFriendRequest} 
                disabled={addingFriend}
                className="mb-3"
                size="sm"
              >
                <UserPlus size={16} className="mr-2" />
                {addingFriend ? 'Sending...' : 'Add Friend'}
              </Button>
            )}
            {friendStatus === 'pending' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg text-sm mb-3">
                <UserPlus size={16} />
                Request Pending
              </div>
            )}
            {friendStatus === 'accepted' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-success/10 text-accent-success rounded-lg text-sm mb-3">
                <Check size={16} />
                Friends
              </div>
            )}
            
            {/* All badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map(ub => (
                  <BadgeDisplay key={ub.id} badge={ub.badge} size="sm" />
                ))}
              </div>
            )}
            
            {profile.bio && (
              <p className="text-foreground-muted mb-4">{profile.bio}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-foreground-muted">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                Member since {memberSince}
              </div>
              {profile.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent-primary hover:underline"
                >
                  <Globe size={16} />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp size={20} className="text-purple-500" />
            </div>
            <div className="text-sm text-foreground-muted">Level</div>
          </div>
          <div className="text-3xl font-bold text-purple-500">{profile.level}</div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap size={20} className="text-blue-500" />
            </div>
            <div className="text-sm text-foreground-muted">XP</div>
          </div>
          <div className="text-3xl font-bold text-blue-500">{profile.xp.toLocaleString()}</div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div className="text-sm text-foreground-muted">Streak</div>
          </div>
          <div className="text-3xl font-bold text-orange-500">{profile.current_streak}</div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Award size={20} className="text-yellow-500" />
            </div>
            <div className="text-sm text-foreground-muted">Badges</div>
          </div>
          <div className="text-3xl font-bold text-yellow-500">{badges.length}</div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="text-accent-primary" />
          Activity Stats
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-foreground-muted mb-2">Total Habits Completed</div>
            <div className="text-4xl font-bold text-accent-primary">{profile.total_completions}</div>
          </div>
          
          <div>
            <div className="text-sm text-foreground-muted mb-2">Total Active Days</div>
            <div className="text-4xl font-bold text-accent-success">{profile.total_active_days}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-foreground-muted">
        This is a public profile. Only public information is displayed.
      </div>
    </div>
  )
}
