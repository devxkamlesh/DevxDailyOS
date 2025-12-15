'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Zap, Flame, Crown, Medal, Target, Check, Users, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { ProfileIcon } from '@/lib/profile-icons'

interface Friend {
  id: string
  friend_id: string
  status: string
  profile: {
    id: string
    username: string
    full_name: string
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

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  fullName: string
  avatar: string
  level: number
  xp: number
  streak: number
  completions: number
  weeklyCompletions: number
  todayCompletions: number
  totalHabits: number
  todayFocusMinutes: number
  totalFocusMinutes: number
  isCurrentUser: boolean
}

export default function SocialLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserStats, setCurrentUserStats] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboard()
  }, [])


  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch friends
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('id, friend_id, status')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const friendIds = friendships?.map(f => f.friend_id) || []

      // Fetch friend profiles
      let friendProfiles: any[] = []
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('*')
          .in('id', friendIds)
        friendProfiles = profiles || []
      }

      // Get current user's profile
      const { data: myProfile } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Build leaderboard
      const allUsers: LeaderboardEntry[] = []

      // Add current user
      if (myProfile) {
        allUsers.push({
          rank: 0,
          userId: myProfile.id,
          username: myProfile.username || 'user',
          fullName: myProfile.full_name || myProfile.username || 'You',
          avatar: myProfile.current_avatar || 'user',
          level: myProfile.level || 1,
          xp: myProfile.xp || 0,
          streak: myProfile.current_streak || 0,
          completions: myProfile.total_completions || 0,
          weeklyCompletions: myProfile.weekly_completions || 0,
          todayCompletions: myProfile.today_completions || 0,
          totalHabits: myProfile.total_habits || 0,
          todayFocusMinutes: myProfile.today_focus_minutes || 0,
          totalFocusMinutes: myProfile.total_focus_minutes || 0,
          isCurrentUser: true
        })
      }

      // Add friends
      friendProfiles.forEach(profile => {
        allUsers.push({
          rank: 0,
          userId: profile.id,
          username: profile.username || 'user',
          fullName: profile.full_name || profile.username || 'Friend',
          avatar: profile.current_avatar || 'user',
          level: profile.level || 1,
          xp: profile.xp || 0,
          streak: profile.current_streak || 0,
          completions: profile.total_completions || 0,
          weeklyCompletions: profile.weekly_completions || 0,
          todayCompletions: profile.today_completions || 0,
          totalHabits: profile.total_habits || 0,
          todayFocusMinutes: profile.today_focus_minutes || 0,
          totalFocusMinutes: profile.total_focus_minutes || 0,
          isCurrentUser: false
        })
      })

      // Sort by XP and assign ranks
      const sorted = allUsers
        .sort((a, b) => b.xp - a.xp || b.completions - a.completions)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))

      setLeaderboard(sorted)
      setCurrentUserStats(sorted.find(e => e.isCurrentUser) || null)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={20} />
    if (rank === 2) return <Medal className="text-gray-400" size={20} />
    if (rank === 3) return <Medal className="text-orange-500" size={20} />
    return <span className="text-foreground-muted font-bold w-5 text-center">{rank}</span>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface rounded-2xl border border-border-subtle animate-pulse w-1/3"></div>
        <div className="bg-surface p-8 rounded-2xl border border-border-subtle animate-pulse h-48"></div>
        <div className="bg-surface p-4 rounded-2xl border border-border-subtle animate-pulse h-64"></div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={28} />
            Social Leaderboard
          </h1>
          <p className="text-foreground-muted">Compete with your friends</p>
        </div>
        <Link href="/friends">
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl hover:opacity-90 transition">
            <UserPlus size={18} />
            Add Friends
          </button>
        </Link>
      </div>

      {leaderboard.length <= 1 ? (
        <div className="bg-surface rounded-2xl border border-border-subtle p-12 text-center">
          <Users className="h-16 w-16 text-foreground-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Add Friends to Compete</h3>
          <p className="text-foreground-muted mb-6 max-w-md mx-auto">
            Add friends to see how you rank against them on the leaderboard!
          </p>
          <Link href="/friends">
            <button className="px-6 py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition">
              <UserPlus className="inline-block mr-2" size={18} />
              Find Friends
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Your Stats Card */}
          {currentUserStats && (
            <div className="bg-gradient-to-br from-accent-primary/20 to-purple-500/20 p-6 rounded-2xl border border-accent-primary/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-black text-accent-primary">#{currentUserStats.rank}</div>
                  <div>
                    <div className="font-bold text-xl">Your Rank</div>
                    <div className="text-foreground-muted">Among {leaderboard.length} friends</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-background/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-purple-500">{currentUserStats.level}</div>
                    <div className="text-xs text-foreground-muted">Level</div>
                  </div>
                  <div className="bg-background/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-blue-500">{currentUserStats.xp.toLocaleString()}</div>
                    <div className="text-xs text-foreground-muted">XP</div>
                  </div>
                  <div className="bg-background/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-orange-500">{currentUserStats.streak}</div>
                    <div className="text-xs text-foreground-muted">Streak</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
            <div className="grid grid-cols-16 gap-2 p-4 border-b border-border-subtle text-xs font-semibold bg-background">
              <div className="col-span-1">#</div>
              <div className="col-span-4">User</div>
              <div className="col-span-2 text-center">Level</div>
              <div className="col-span-2 text-center">XP</div>
              <div className="col-span-2 text-center">Streak</div>
              <div className="col-span-2 text-center">Today</div>
              <div className="col-span-3 text-center">Focus</div>
            </div>
            
            <div className="divide-y divide-border-subtle">
              {leaderboard.map(entry => (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-16 gap-2 p-4 items-center transition ${
                    entry.isCurrentUser ? 'bg-accent-primary/10' : 'hover:bg-background'
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      entry.avatar?.startsWith('gold-') ? 'bg-yellow-500/20' : 'bg-accent-primary/20'
                    }`}>
                      <ProfileIcon iconId={entry.avatar} size={18} className={
                        entry.avatar?.startsWith('gold-') ? '' : 'text-accent-primary'
                      } />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-1">
                        {entry.fullName}
                        {entry.isCurrentUser && <span className="text-xs text-accent-primary">(You)</span>}
                      </div>
                      <div className="text-xs text-foreground-muted truncate">@{entry.username}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-semibold text-purple-500">{entry.level}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-semibold text-blue-500 text-sm">{entry.xp.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Flame size={12} className="text-orange-500" />
                    <span className="font-semibold text-orange-500">{entry.streak}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-semibold text-green-500">{entry.todayCompletions}/{entry.totalHabits}</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="font-semibold text-cyan-500">{entry.todayFocusMinutes}m</span>
                    <span className="text-foreground-muted text-xs ml-1">/ {Math.round(entry.totalFocusMinutes / 60)}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <Target size={20} className="mx-auto mb-2 text-green-500" />
              <div className="text-xl font-bold">{leaderboard.reduce((sum, e) => sum + e.completions, 0)}</div>
              <div className="text-xs text-foreground-muted">Total Done</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <Check size={20} className="mx-auto mb-2 text-emerald-500" />
              <div className="text-xl font-bold">{leaderboard.reduce((sum, e) => sum + e.todayCompletions, 0)}</div>
              <div className="text-xs text-foreground-muted">Today</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <Zap size={20} className="mx-auto mb-2 text-blue-500" />
              <div className="text-xl font-bold">{Math.round(leaderboard.reduce((sum, e) => sum + e.xp, 0) / leaderboard.length)}</div>
              <div className="text-xs text-foreground-muted">Avg XP</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <Flame size={20} className="mx-auto mb-2 text-orange-500" />
              <div className="text-xl font-bold">{Math.max(...leaderboard.map(e => e.streak))}</div>
              <div className="text-xs text-foreground-muted">Best Streak</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <Trophy size={20} className="mx-auto mb-2 text-purple-500" />
              <div className="text-xl font-bold">{Math.max(...leaderboard.map(e => e.level))}</div>
              <div className="text-xs text-foreground-muted">Top Level</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <Target size={20} className="mx-auto mb-2 text-cyan-500" />
              <div className="text-xl font-bold">{Math.round(leaderboard.reduce((sum, e) => sum + e.totalFocusMinutes, 0) / 60)}h</div>
              <div className="text-xs text-foreground-muted">Total Focus</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
