'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Trophy, Medal, Crown, Flame, Share2, Users, Calendar, Zap, Search, TrendingUp, Lock } from 'lucide-react'
import { ProfileIcon } from '@/lib/profile-icons'
import Link from 'next/link'
import { useSystemSettings } from '@/lib/useSystemSettings'

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  profile_icon: string | null
  completions: number
  active_days: number
  streak: number
  xp: number
  level: number
  rank: number
  isCurrentUser: boolean
}

export default function LeaderboardPage() {
  const { showToast } = useToast()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'alltime'>('weekly')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userStats, setUserStats] = useState({ rank: 0, completions: 0, streak: 0, xp: 0, level: 1 })
  const [searchQuery, setSearchQuery] = useState('')
  const { settings: systemSettings, loading: settingsLoading } = useSystemSettings()

  useEffect(() => {
    if (!settingsLoading && systemSettings.leaderboard_enabled) {
      fetchLeaderboard()
    }
  }, [activeTab, settingsLoading, systemSettings.leaderboard_enabled])

  // Check if leaderboard is disabled
  if (!settingsLoading && !systemSettings.leaderboard_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 bg-yellow-500/10 rounded-full mb-4">
          <Lock size={48} className="text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Leaderboard Unavailable</h1>
        <p className="text-foreground-muted max-w-md">
          The leaderboard is currently disabled by the administrator. Please check back later.
        </p>
      </div>
    )
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      
      setCurrentUserId(user.id)

      // Date ranges
      const today = new Date()
      let startDate = new Date(today)
      if (activeTab === 'weekly') {
        startDate.setDate(today.getDate() - 7)
      } else if (activeTab === 'monthly') {
        startDate.setDate(today.getDate() - 30)
      } else {
        startDate = new Date('2020-01-01') // All time
      }

      // Fetch from optimized public_profiles view
      const { data: publicProfiles, error: profilesError } = await supabase
        .from('public_profiles')
        .select('*')
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Build leaderboard based on active tab
      const leaderboardData = (publicProfiles || []).map(profile => {
        let completions = 0
        let activeDays = 0

        if (activeTab === 'weekly') {
          completions = profile.weekly_completions || 0
          activeDays = profile.weekly_active_days || 0
        } else if (activeTab === 'monthly') {
          completions = profile.monthly_completions || 0
          activeDays = profile.monthly_active_days || 0
        } else {
          completions = profile.total_completions || 0
          activeDays = profile.total_active_days || 0
        }
        
        return {
          user_id: profile.id,
          username: profile.username || 'Anonymous',
          avatar_url: profile.avatar_url,
          profile_icon: profile.current_avatar || 'user',
          completions,
          active_days: activeDays,
          streak: profile.current_streak || 0,
          xp: profile.xp || 0,
          level: profile.level || 1,
          rank: 0,
          isCurrentUser: profile.id === user.id
        }
      })
      .sort((a, b) => b.completions - a.completions || b.xp - a.xp)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

      // Set full leaderboard (not sliced) to preserve all ranks
      setLeaderboard(leaderboardData)

      // Current user stats - get from full leaderboard to ensure correct rank
      const currentUser = leaderboardData.find(e => e.isCurrentUser)
      if (currentUser) {
        setUserStats({
          rank: currentUser.rank,
          completions: currentUser.completions,
          streak: currentUser.streak,
          xp: currentUser.xp,
          level: currentUser.level
        })
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareAchievement = () => {
    const text = `🏆 I'm ranked #${userStats.rank} on Sadhana!\n📊 ${userStats.completions} habits completed\n🔥 ${userStats.streak} day streak\n⚡ Level ${userStats.level}\n\n#HabitTracking #Productivity #Sadhana`
    
    if (navigator.share) {
      navigator.share({ title: 'My Achievement', text, url: window.location.origin })
    } else {
      navigator.clipboard.writeText(text)
      showToast('Copied to clipboard!', 'success')
    }
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/50'
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/50'
    if (rank === 3) return 'bg-orange-500/10 border-orange-500/50'
    return 'bg-surface border-border-subtle'
  }

  const filteredLeaderboard = searchQuery 
    ? leaderboard.filter(e => e.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : leaderboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-foreground-muted">Compete with other habit trackers</p>
        </div>
        <button onClick={shareAchievement} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition">
          <Share2 size={18} /> Share
        </button>
      </div>

      {/* Your Stats */}
      {currentUserId && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30">
            <div className="text-sm text-foreground-muted">Rank</div>
            <div className="text-3xl font-bold text-yellow-500">#{userStats.rank || '-'}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="text-sm text-foreground-muted">Completions</div>
            <div className="text-3xl font-bold">{userStats.completions}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="text-sm text-foreground-muted flex items-center gap-1"><Flame size={14} className="text-orange-500" /> Streak</div>
            <div className="text-3xl font-bold text-orange-500">{userStats.streak}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="text-sm text-foreground-muted flex items-center gap-1"><Zap size={14} className="text-purple-500" /> XP</div>
            <div className="text-3xl font-bold text-purple-500">{userStats.xp}</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border-subtle">
            <div className="text-sm text-foreground-muted flex items-center gap-1"><TrendingUp size={14} className="text-accent-primary" /> Level</div>
            <div className="text-3xl font-bold text-accent-primary">{userStats.level}</div>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit">
          {[
            { id: 'weekly', label: 'This Week', icon: Flame },
            { id: 'monthly', label: 'This Month', icon: Calendar },
            { id: 'alltime', label: 'All Time', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id ? 'bg-accent-primary text-white' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>


      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-surface p-4 rounded-xl border border-border-subtle animate-pulse">
              <div className="h-14 bg-background rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {filteredLeaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* 2nd Place */}
              <div className={`p-6 rounded-xl border-2 text-center ${getRankBg(2)}`}>
                <div className="text-4xl mb-3">🥈</div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-400/20 flex items-center justify-center">
                  <ProfileIcon iconId={filteredLeaderboard[1]?.profile_icon} size={32} className="text-gray-400" />
                </div>
                <div className="font-semibold truncate">{filteredLeaderboard[1]?.username || '-'}</div>
                <div className="text-sm text-foreground-muted">{filteredLeaderboard[1]?.completions || 0} habits</div>
                <div className="text-xs text-orange-500 flex items-center justify-center gap-1 mt-1">
                  <Flame size={12} /> {filteredLeaderboard[1]?.streak || 0} streak
                </div>
              </div>

              {/* 1st Place */}
              <div className={`p-6 rounded-xl border-2 text-center transform scale-105 ${getRankBg(1)}`}>
                <div className="text-5xl mb-3">👑</div>
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <ProfileIcon iconId={filteredLeaderboard[0]?.profile_icon} size={40} className="text-yellow-500" />
                </div>
                <div className="font-bold truncate">{filteredLeaderboard[0]?.username || '-'}</div>
                <div className="text-sm text-foreground-muted">{filteredLeaderboard[0]?.completions || 0} habits</div>
                <div className="text-xs text-orange-500 flex items-center justify-center gap-1 mt-1">
                  <Flame size={12} /> {filteredLeaderboard[0]?.streak || 0} streak
                </div>
              </div>

              {/* 3rd Place */}
              <div className={`p-6 rounded-xl border-2 text-center ${getRankBg(3)}`}>
                <div className="text-4xl mb-3">🥉</div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <ProfileIcon iconId={filteredLeaderboard[2]?.profile_icon} size={32} className="text-orange-500" />
                </div>
                <div className="font-semibold truncate">{filteredLeaderboard[2]?.username || '-'}</div>
                <div className="text-sm text-foreground-muted">{filteredLeaderboard[2]?.completions || 0} habits</div>
                <div className="text-xs text-orange-500 flex items-center justify-center gap-1 mt-1">
                  <Flame size={12} /> {filteredLeaderboard[2]?.streak || 0} streak
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-subtle text-sm font-semibold bg-background">
              <div className="col-span-1">#</div>
              <div className="col-span-5">User</div>
              <div className="col-span-2 text-center">Habits</div>
              <div className="col-span-2 text-center">Streak</div>
              <div className="col-span-2 text-center">Level</div>
            </div>
            
            <div className="divide-y divide-border-subtle max-h-[500px] overflow-y-auto">
              {filteredLeaderboard.map(entry => (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition ${
                    entry.isCurrentUser ? 'bg-accent-primary/10' : 'hover:bg-background'
                  }`}
                >
                  <div className="col-span-1">
                    {entry.rank === 1 ? <Crown className="text-yellow-500" size={20} /> :
                     entry.rank === 2 ? <Medal className="text-gray-400" size={20} /> :
                     entry.rank === 3 ? <Medal className="text-orange-500" size={20} /> :
                     <span className="text-foreground-muted font-bold">{entry.rank}</span>}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                      <ProfileIcon iconId={entry.profile_icon} size={20} className="text-accent-primary" />
                    </div>
                    <div>
                      <Link 
                        href={`/profile/${entry.user_id}`}
                        className="font-medium hover:text-accent-primary transition"
                      >
                        {entry.username}
                      </Link>
                      {entry.isCurrentUser && <span className="text-xs text-accent-primary ml-2">You</span>}
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-semibold">{entry.completions}</div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1 text-orange-500">
                    <Flame size={14} /> {entry.streak}
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1 text-purple-500">
                    <Zap size={14} /> Lv.{entry.level}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredLeaderboard.length === 0 && (
            <div className="text-center py-12 text-foreground-muted">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? 'No users found' : 'No data yet. Start completing habits!'}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
