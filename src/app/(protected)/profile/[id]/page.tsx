'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileIcon } from '@/lib/profile-icons'
import { User, Calendar, Trophy, Flame, Zap, TrendingUp, Globe, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
}

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchPublicProfile()
  }, [userId])

  const fetchPublicProfile = async () => {
    try {
      const supabase = createClient()
      
      // Fetch from public_profiles view
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .eq('is_public', true)
        .eq('show_on_leaderboard', true)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setProfile(data as PublicProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
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
          This profile is private or doesn't exist
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
            <h1 className="text-3xl font-bold mb-1">
              @{profile.username || 'user'}
            </h1>
            {profile.full_name && profile.full_name !== profile.username && (
              <p className="text-lg text-foreground-muted mb-3">{profile.full_name}</p>
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
            <div className="text-sm text-foreground-muted">Achievements</div>
          </div>
          <div className="text-3xl font-bold text-yellow-500">{profile.achievement_count}</div>
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
