'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, Activity, TrendingUp, Clock, Target, Zap, 
  Calendar, BarChart3, Eye, Search, Filter, Download,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle,
  XCircle, Minus, Plus, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts'

interface UserData {
  id: string
  username: string
  full_name: string
  email: string
  created_at: string
  last_active: string
  
  // Stats
  total_habits: number
  active_habits: number
  completed_today: number
  current_streak: number
  longest_streak: number
  total_completions: number
  
  // Rewards
  level: number
  xp: number
  coins: number
  gems: number
  
  // Activity
  days_active: number
  avg_daily_completions: number
  completion_rate: number
  
  // Time tracking
  total_focus_time: number
  avg_session_length: number
  best_time_of_day: string
  
  // Status
  status: 'active' | 'inactive' | 'new' | 'churned'
  risk_level: 'low' | 'medium' | 'high'
}

interface SystemMetrics {
  total_users: number
  active_users_today: number
  active_users_week: number
  active_users_month: number
  new_users_today: number
  new_users_week: number
  new_users_month: number
  churned_users: number
  avg_session_time: number
  total_habits_created: number
  total_completions: number
  avg_completion_rate: number
}

export default function UserTrackingPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
    fetchSystemMetrics()
  }, [timeRange, sortBy, sortOrder])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Fetch users with comprehensive data
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          created_at,
          user_rewards (
            level,
            xp,
            coins,
            gems,
            current_streak,
            longest_streak
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (!usersData) return

      // Fetch additional data for each user
      const enrichedUsers = await Promise.all(
        usersData.map(async (user) => {
          // Get user email from auth
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
          
          // Get habits data
          const { data: habits } = await supabase
            .from('habits')
            .select('id, is_active')
            .eq('user_id', user.id)

          // Get habit logs for activity analysis
          const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
          const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
          
          const { data: logs } = await supabase
            .from('habit_logs')
            .select('date, completed, duration_minutes, completed_at')
            .eq('user_id', user.id)
            .gte('date', startDate.toISOString().split('T')[0])

          // Calculate metrics
          const totalHabits = habits?.length || 0
          const activeHabits = habits?.filter(h => h.is_active).length || 0
          const totalCompletions = logs?.filter(l => l.completed).length || 0
          const completedToday = logs?.filter(l => 
            l.completed && l.date === new Date().toISOString().split('T')[0]
          ).length || 0
          
          const uniqueDays = new Set(logs?.map(l => l.date)).size
          const avgDailyCompletions = uniqueDays > 0 ? totalCompletions / uniqueDays : 0
          const completionRate = logs?.length ? (totalCompletions / logs.length) * 100 : 0
          
          const totalFocusTime = logs?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0
          const focusSessions = logs?.filter(l => l.duration_minutes).length || 0
          const avgSessionLength = focusSessions > 0 ? totalFocusTime / focusSessions : 0
          
          // Determine best time of day
          const hourCounts = Array(24).fill(0)
          logs?.forEach(log => {
            if (log.completed_at) {
              const hour = new Date(log.completed_at).getHours()
              hourCounts[hour]++
            }
          })
          const bestHour = hourCounts.indexOf(Math.max(...hourCounts))
          const bestTimeOfDay = bestHour < 12 ? 'Morning' : bestHour < 17 ? 'Afternoon' : 'Evening'
          
          // Determine user status and risk level
          const lastActivity = logs?.length ? Math.max(...logs.map(l => new Date(l.date).getTime())) : 0
          const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity) / (24 * 60 * 60 * 1000)) : 999
          
          let status: 'active' | 'inactive' | 'new' | 'churned' = 'inactive'
          let riskLevel: 'low' | 'medium' | 'high' = 'low'
          
          const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000))
          
          if (accountAge <= 7) {
            status = 'new'
            riskLevel = completionRate < 30 ? 'high' : completionRate < 60 ? 'medium' : 'low'
          } else if (daysSinceActivity <= 1) {
            status = 'active'
            riskLevel = completionRate < 50 ? 'medium' : 'low'
          } else if (daysSinceActivity <= 7) {
            status = 'inactive'
            riskLevel = 'medium'
          } else {
            status = 'churned'
            riskLevel = 'high'
          }

          return {
            id: user.id,
            username: user.username || 'Unknown',
            full_name: user.full_name || 'Unknown',
            email: authUser?.user?.email || 'Unknown',
            created_at: user.created_at,
            last_active: lastActivity ? new Date(lastActivity).toISOString() : 'Never',
            
            total_habits: totalHabits,
            active_habits: activeHabits,
            completed_today: completedToday,
            current_streak: user.user_rewards?.[0]?.current_streak || 0,
            longest_streak: user.user_rewards?.[0]?.longest_streak || 0,
            total_completions: totalCompletions,
            
            level: user.user_rewards?.[0]?.level || 1,
            xp: user.user_rewards?.[0]?.xp || 0,
            coins: user.user_rewards?.[0]?.coins || 0,
            gems: user.user_rewards?.[0]?.gems || 0,
            
            days_active: uniqueDays,
            avg_daily_completions: Math.round(avgDailyCompletions * 10) / 10,
            completion_rate: Math.round(completionRate),
            
            total_focus_time: totalFocusTime,
            avg_session_length: Math.round(avgSessionLength),
            best_time_of_day: bestTimeOfDay,
            
            status,
            risk_level: riskLevel
          } as UserData
        })
      )

      setUsers(enrichedUsers)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get new users
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      const { count: newUsersWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo)

      const { count: newUsersMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo)

      // Get active users (users with habit logs)
      const { data: activeToday } = await supabase
        .from('habit_logs')
        .select('user_id')
        .eq('date', today)

      const { data: activeWeek } = await supabase
        .from('habit_logs')
        .select('user_id')
        .gte('date', weekAgo)

      const { data: activeMonth } = await supabase
        .from('habit_logs')
        .select('user_id')
        .gte('date', monthAgo)

      // Get total habits and completions
      const { count: totalHabits } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })

      const { count: totalCompletions } = await supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)

      const { data: allLogs } = await supabase
        .from('habit_logs')
        .select('completed')

      const avgCompletionRate = allLogs?.length 
        ? (allLogs.filter(l => l.completed).length / allLogs.length) * 100 
        : 0

      setMetrics({
        total_users: totalUsers || 0,
        active_users_today: new Set(activeToday?.map(a => a.user_id)).size,
        active_users_week: new Set(activeWeek?.map(a => a.user_id)).size,
        active_users_month: new Set(activeMonth?.map(a => a.user_id)).size,
        new_users_today: newUsersToday || 0,
        new_users_week: newUsersWeek || 0,
        new_users_month: newUsersMonth || 0,
        churned_users: users.filter(u => u.status === 'churned').length,
        avg_session_time: Math.round(users.reduce((sum, u) => sum + u.avg_session_length, 0) / users.length) || 0,
        total_habits_created: totalHabits || 0,
        total_completions: totalCompletions || 0,
        avg_completion_rate: Math.round(avgCompletionRate)
      })
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const exportUserData = () => {
    const csv = [
      ['Username', 'Full Name', 'Email', 'Status', 'Level', 'XP', 'Coins', 'Total Habits', 'Completion Rate', 'Current Streak', 'Total Completions'],
      ...filteredUsers.map(user => [
        user.username,
        user.full_name,
        user.email,
        user.status,
        user.level,
        user.xp,
        user.coins,
        user.total_habits,
        `${user.completion_rate}%`,
        user.current_streak,
        user.total_completions
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-tracking-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'inactive': return 'text-yellow-400 bg-yellow-500/20'
      case 'new': return 'text-blue-400 bg-blue-500/20'
      case 'churned': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Advanced User Tracking</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-2xl border border-border-subtle animate-pulse">
              <div className="h-12 bg-background rounded mb-4" />
              <div className="h-8 bg-background rounded mb-2" />
              <div className="h-4 bg-background rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Advanced User Tracking</h1>
          <p className="text-foreground-muted">Comprehensive user analytics and behavior insights</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportUserData}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 rounded-2xl border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users size={24} className="text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-blue-500">{metrics.total_users}</span>
            </div>
            <h3 className="font-semibold mb-1">Total Users</h3>
            <p className="text-sm text-foreground-muted">+{metrics.new_users_month} this month</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-2xl border border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity size={24} className="text-green-500" />
              </div>
              <span className="text-3xl font-bold text-green-500">{metrics.active_users_today}</span>
            </div>
            <h3 className="font-semibold mb-1">Active Today</h3>
            <p className="text-sm text-foreground-muted">{metrics.active_users_week} this week</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-6 rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Target size={24} className="text-purple-500" />
              </div>
              <span className="text-3xl font-bold text-purple-500">{metrics.avg_completion_rate}%</span>
            </div>
            <h3 className="font-semibold mb-1">Avg Completion Rate</h3>
            <p className="text-sm text-foreground-muted">{metrics.total_completions} total completions</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-6 rounded-2xl border border-orange-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock size={24} className="text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-orange-500">{metrics.avg_session_time}m</span>
            </div>
            <h3 className="font-semibold mb-1">Avg Session Time</h3>
            <p className="text-sm text-foreground-muted">Focus session duration</p>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface p-4 rounded-xl border border-border-subtle">
        <div className="flex-1">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:border-accent-primary"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="new">New</option>
          <option value="churned">Churned</option>
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:border-accent-primary"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-')
            setSortBy(field)
            setSortOrder(order as 'asc' | 'desc')
          }}
          className="px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:border-accent-primary"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="completion_rate-desc">Highest Completion Rate</option>
          <option value="completion_rate-asc">Lowest Completion Rate</option>
          <option value="level-desc">Highest Level</option>
          <option value="total_completions-desc">Most Completions</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border-subtle">
              <tr>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Level & XP</th>
                <th className="text-left p-4 font-semibold">Habits</th>
                <th className="text-left p-4 font-semibold">Completion Rate</th>
                <th className="text-left p-4 font-semibold">Streak</th>
                <th className="text-left p-4 font-semibold">Risk Level</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border-subtle hover:bg-background/50 transition">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-foreground-muted">{user.full_name}</div>
                      <div className="text-xs text-foreground-muted">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div>Level {user.level}</div>
                      <div className="text-foreground-muted">{user.xp} XP</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div>{user.active_habits} active</div>
                      <div className="text-foreground-muted">{user.total_habits} total</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{user.completion_rate}%</div>
                      <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-primary transition-all"
                          style={{ width: `${Math.min(user.completion_rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="font-medium">{user.current_streak} days</div>
                      <div className="text-foreground-muted">Best: {user.longest_streak}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${getRiskColor(user.risk_level)}`}>
                      {user.risk_level}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-1 px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition text-sm"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-border-subtle max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.username}</h2>
                  <p className="text-foreground-muted">{selectedUser.full_name} • {selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-background rounded-lg transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background p-4 rounded-xl">
                  <div className="text-2xl font-bold text-accent-primary">{selectedUser.level}</div>
                  <div className="text-sm text-foreground-muted">Level</div>
                </div>
                <div className="bg-background p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-500">{selectedUser.completion_rate}%</div>
                  <div className="text-sm text-foreground-muted">Completion Rate</div>
                </div>
                <div className="bg-background p-4 rounded-xl">
                  <div className="text-2xl font-bold text-orange-500">{selectedUser.current_streak}</div>
                  <div className="text-sm text-foreground-muted">Current Streak</div>
                </div>
                <div className="bg-background p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-500">{selectedUser.total_focus_time}m</div>
                  <div className="text-sm text-foreground-muted">Total Focus Time</div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Created:</span>
                      <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Last Active:</span>
                      <span>{selectedUser.last_active !== 'Never' ? new Date(selectedUser.last_active).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Risk Level:</span>
                      <span className={getRiskColor(selectedUser.risk_level)}>{selectedUser.risk_level}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Activity Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Days Active:</span>
                      <span>{selectedUser.days_active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Avg Daily Completions:</span>
                      <span>{selectedUser.avg_daily_completions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Best Time of Day:</span>
                      <span>{selectedUser.best_time_of_day}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Avg Session Length:</span>
                      <span>{selectedUser.avg_session_length}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}