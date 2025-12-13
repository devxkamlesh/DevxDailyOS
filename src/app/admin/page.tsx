'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, Target, CheckCircle2, Coins, TrendingUp, 
  Calendar, Clock, Award, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeToday: number
  totalHabits: number
  completionsToday: number
  totalCoins: number
  totalXP: number
  newUsersWeek: number
  avgCompletionRate: number
}

interface RecentUser {
  id: string
  username: string
  full_name: string
  created_at: string
}

interface TopUser {
  id: string
  username: string
  full_name: string
  xp: number
  level: number
  current_streak: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: totalHabits },
        { count: completionsToday },
        { count: newUsersWeek },
        { data: rewardsData },
        { data: recentUsersData },
        { data: topUsersData },
        { data: activeUsersData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('habits').select('*', { count: 'exact', head: true }),
        supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('date', today).eq('completed', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('user_rewards').select('coins, xp'),
        supabase.from('profiles').select('id, username, full_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('user_rewards').select('user_id, xp, level, current_streak, profiles(username, full_name)').order('xp', { ascending: false }).limit(5),
        supabase.from('habit_logs').select('user_id').eq('date', today).eq('completed', true)
      ])

      // Calculate totals
      const totalCoins = rewardsData?.reduce((sum, r) => sum + (r.coins || 0), 0) || 0
      const totalXP = rewardsData?.reduce((sum, r) => sum + (r.xp || 0), 0) || 0
      const uniqueActiveUsers = new Set(activeUsersData?.map(l => l.user_id) || []).size

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: uniqueActiveUsers,
        totalHabits: totalHabits || 0,
        completionsToday: completionsToday || 0,
        totalCoins,
        totalXP,
        newUsersWeek: newUsersWeek || 0,
        avgCompletionRate: totalUsers ? Math.round((uniqueActiveUsers / totalUsers) * 100) : 0
      })

      setRecentUsers(recentUsersData || [])
      
      // Format top users
      const formattedTopUsers = topUsersData?.map((u: any) => ({
        id: u.user_id,
        username: u.profiles?.username || 'Unknown',
        full_name: u.profiles?.full_name || 'Unknown',
        xp: u.xp || 0,
        level: u.level || 1,
        current_streak: u.current_streak || 0
      })) || []
      setTopUsers(formattedTopUsers)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-foreground-muted text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-foreground-muted mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-foreground-muted">Overview of DevX Daily OS platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers.toLocaleString()} 
          icon={Users} 
          color="bg-blue-500/20 text-blue-400"
          subtext={`+${stats?.newUsersWeek} this week`}
        />
        <StatCard 
          title="Active Today" 
          value={stats?.activeToday.toLocaleString()} 
          icon={Activity} 
          color="bg-green-500/20 text-green-400"
          subtext={`${stats?.avgCompletionRate}% of users`}
        />
        <StatCard 
          title="Total Habits" 
          value={stats?.totalHabits.toLocaleString()} 
          icon={Target} 
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard 
          title="Completions Today" 
          value={stats?.completionsToday.toLocaleString()} 
          icon={CheckCircle2} 
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard 
          title="Total Coins" 
          value={stats?.totalCoins.toLocaleString()} 
          icon={Coins} 
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard 
          title="Total XP" 
          value={stats?.totalXP.toLocaleString()} 
          icon={TrendingUp} 
          color="bg-orange-500/20 text-orange-400"
        />
        <StatCard 
          title="New This Week" 
          value={stats?.newUsersWeek} 
          icon={Calendar} 
          color="bg-pink-500/20 text-pink-400"
        />
        <StatCard 
          title="Avg Completion" 
          value={`${stats?.avgCompletionRate}%`} 
          icon={Award} 
          color="bg-cyan-500/20 text-cyan-400"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Recent Users
          </h2>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
                <div>
                  <p className="font-medium">{user.full_name || user.username || 'Unknown'}</p>
                  <p className="text-sm text-foreground-muted">@{user.username || 'no-username'}</p>
                </div>
                <p className="text-xs text-foreground-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="text-foreground-muted text-center py-4">No users yet</p>
            )}
          </div>
        </div>

        {/* Top Users by XP */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            Top Users by XP
          </h2>
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-background text-foreground-muted'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{user.full_name || user.username}</p>
                    <p className="text-xs text-foreground-muted">Level {user.level} • {user.current_streak} day streak</p>
                  </div>
                </div>
                <p className="font-bold text-accent-primary">{user.xp.toLocaleString()} XP</p>
              </div>
            ))}
            {topUsers.length === 0 && (
              <p className="text-foreground-muted text-center py-4">No users yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
