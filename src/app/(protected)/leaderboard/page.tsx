'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Crown, Flame, Share2, Users, Calendar } from 'lucide-react'

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  profile_icon: string | null
  completions: number
  active_days: number
  rank: number
  isCurrentUser: boolean
}

export default function LeaderboardPage() {
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userStats, setUserStats] = useState({ rank: 0, completions: 0 })

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      
      setCurrentUserId(user.id)

      // Ensure user profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        console.log('Creating profile for user:', user.id)
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          })
      }

      // Fetch all profiles with their habit completions
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 7)
      const monthStart = new Date(today)
      monthStart.setDate(today.getDate() - 30)

      // Get all profiles (show_on_leaderboard defaults to true, so include null values too)
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, show_on_leaderboard, profile_icon')

      // Filter to only show profiles that want to be on leaderboard (true or null = show)
      const profiles = allProfiles?.filter(p => p.show_on_leaderboard !== false) || []

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Get all habit logs
      const { data: allLogs, error: logsError } = await supabase
        .from('habit_logs')
        .select('user_id, date, completed')
        .eq('completed', true)

      if (logsError) {
        console.error('Error fetching logs:', logsError)
      }

      console.log('Profiles:', profiles?.length || 0)
      console.log('Logs:', allLogs?.length || 0)

      if (!profiles) {
        console.log('No profiles found')
        setLoading(false)
        return
      }

      // If no logs, still show profiles with 0 completions
      const logs = allLogs || []

      // Calculate weekly leaderboard
      const weeklyData = profiles.map(profile => {
        const userLogs = logs.filter(log => {
          const logDate = new Date(log.date)
          return log.user_id === profile.id && logDate >= weekStart
        })
        return {
          user_id: profile.id,
          username: profile.username || 'Anonymous',
          avatar_url: profile.avatar_url,
          profile_icon: profile.profile_icon || null,
          completions: userLogs.length,
          active_days: new Set(userLogs.map(l => l.date)).size,
          rank: 0,
          isCurrentUser: profile.id === user?.id
        }
      })
      .sort((a, b) => b.completions - a.completions)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

      // Calculate monthly leaderboard
      const monthlyData = profiles.map(profile => {
        const userLogs = logs.filter(log => {
          const logDate = new Date(log.date)
          return log.user_id === profile.id && logDate >= monthStart
        })
        return {
          user_id: profile.id,
          username: profile.username || 'Anonymous',
          avatar_url: profile.avatar_url,
          profile_icon: profile.profile_icon || null,
          completions: userLogs.length,
          active_days: new Set(userLogs.map(l => l.date)).size,
          rank: 0,
          isCurrentUser: profile.id === user?.id
        }
      })
      .sort((a, b) => b.completions - a.completions)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

      console.log('Weekly leaderboard:', weeklyData.length)
      console.log('Monthly leaderboard:', monthlyData.length)

      setWeeklyLeaderboard(weeklyData.slice(0, 50))
      setMonthlyLeaderboard(monthlyData.slice(0, 50))

      // Set current user stats
      const currentUserWeekly = weeklyData.find(e => e.isCurrentUser)
      if (currentUserWeekly) {
        setUserStats({ rank: currentUserWeekly.rank, completions: currentUserWeekly.completions })
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLoading(false)
    }
  }

  const shareAchievement = () => {
    const text = `🏆 I'm ranked #${userStats.rank} on DevX Daily OS with ${userStats.completions} habits completed this week! #HabitTracking #Productivity`
    
    if (navigator.share) {
      navigator.share({
        title: 'My Habit Tracking Achievement',
        text: text,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(text)
      alert('Achievement copied to clipboard!')
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={24} />
    if (rank === 2) return <Medal className="text-gray-400" size={24} />
    if (rank === 3) return <Medal className="text-orange-500" size={24} />
    return <span className="text-foreground-muted font-bold w-6 text-center">{rank}</span>
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30'
    if (rank === 2) return 'bg-gray-500/10 border-gray-500/30'
    if (rank === 3) return 'bg-orange-500/10 border-orange-500/30'
    return 'bg-surface border-border-subtle'
  }

  const leaderboard = activeTab === 'weekly' ? weeklyLeaderboard : monthlyLeaderboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-foreground-muted">See how you rank against other habit trackers</p>
        </div>
        <button
          onClick={shareAchievement}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
        >
          <Share2 size={18} />
          Share Achievement
        </button>
      </div>

      {/* Your Rank Card */}
      {currentUserId && (
        <div className="bg-gradient-to-r from-accent-primary/20 to-purple-500/20 p-6 rounded-xl border border-accent-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-foreground-muted mb-1">Your Rank</div>
              <div className="text-4xl font-bold text-accent-primary">#{userStats.rank}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-foreground-muted mb-1">Completions</div>
              <div className="text-4xl font-bold">{userStats.completions}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'weekly'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <Flame size={18} />
          This Week
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'monthly'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <Calendar size={18} />
          This Month
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-surface p-4 rounded-xl border border-border-subtle animate-pulse">
              <div className="h-12 bg-background rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 2nd Place */}
            <div className={`p-6 rounded-xl border-2 text-center ${leaderboard[1] ? getRankBg(2) : 'bg-surface border-border-subtle opacity-50'}`}>
              <div className="text-4xl mb-2">🥈</div>
              <div className="text-4xl mb-2">{leaderboard[1]?.profile_icon || '👤'}</div>
              <div className="font-semibold truncate">{leaderboard[1]?.username || '-'}</div>
              <div className="text-sm text-foreground-muted">{leaderboard[1]?.completions || 0} habits</div>
            </div>

            {/* 1st Place */}
            <div className={`p-6 rounded-xl border-2 text-center transform scale-105 ${leaderboard[0] ? getRankBg(1) : 'bg-surface border-border-subtle opacity-50'}`}>
              <div className="text-5xl mb-2">👑</div>
              <div className="text-5xl mb-2">{leaderboard[0]?.profile_icon || '👤'}</div>
              <div className="font-bold truncate">{leaderboard[0]?.username || '-'}</div>
              <div className="text-sm text-foreground-muted">{leaderboard[0]?.completions || 0} habits</div>
            </div>

            {/* 3rd Place */}
            <div className={`p-6 rounded-xl border-2 text-center ${leaderboard[2] ? getRankBg(3) : 'bg-surface border-border-subtle opacity-50'}`}>
              <div className="text-4xl mb-2">🥉</div>
              <div className="text-4xl mb-2">{leaderboard[2]?.profile_icon || '👤'}</div>
              <div className="font-semibold truncate">{leaderboard[2]?.username || '-'}</div>
              <div className="text-sm text-foreground-muted">{leaderboard[2]?.completions || 0} habits</div>
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-subtle text-sm font-semibold bg-background">
              <div className="col-span-1 text-foreground">Rank</div>
              <div className="col-span-7 text-foreground">User</div>
              <div className="col-span-2 text-center text-foreground">Habits</div>
              <div className="col-span-2 text-center text-foreground">Days</div>
            </div>
            
            <div className="divide-y divide-border-subtle">
              {leaderboard.map(entry => (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition ${
                    entry.isCurrentUser ? 'bg-accent-primary/10' : 'hover:bg-background'
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-7 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-2xl">
                      {entry.profile_icon || entry.avatar_url || '👤'}
                    </div>
                    <div>
                      <div className="font-medium">{entry.username}</div>
                      {entry.isCurrentUser && (
                        <span className="text-xs text-accent-primary">You</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-semibold">{entry.completions}</div>
                  <div className="col-span-2 text-center text-foreground-muted">{entry.active_days}</div>
                </div>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-foreground-muted">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No data yet. Start completing habits to appear on the leaderboard!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
