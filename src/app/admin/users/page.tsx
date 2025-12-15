'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, Search, ChevronLeft, ChevronRight, 
  Eye, CheckCircle2, Coins, Target, Flame,
  Activity, Calendar, Clock, TrendingUp,
  Settings, Mail, Phone, MapPin, CreditCard,
  ShoppingCart, X, AlertCircle, XCircle,
  RefreshCw, DollarSign, BarChart3, Trophy, Zap
} from 'lucide-react'

interface User {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  is_public: boolean
  bio?: string
  website?: string
  timezone?: string
  profile_icon?: string
  rewards?: {
    coins: number
    xp: number
    level: number
    current_streak: number
    longest_streak: number
    gems: number
    current_theme: string
    current_avatar: string
    unlocked_themes: string[]
    unlocked_avatars: string[]
    perfect_days: number
  }
  habits_count?: number
  completions_count?: number
  last_active?: string
  total_focus_time?: number
  avg_session_length?: number
  completion_rate?: number
  best_category?: string
  most_active_time?: string
  engagement_score?: number
  risk_level?: 'low' | 'medium' | 'high'
  user_status?: 'active' | 'inactive' | 'new' | 'churned'
}

interface DetailedUserData extends User {
  email?: string
  phone?: string
  location?: string
  login_streak?: number
  total_sessions?: number
  avg_session_duration?: number
  last_login?: string
  total_screen_time?: number
  habit_categories?: { [key: string]: number }
  weekly_completion_rate?: number
  monthly_completion_rate?: number
  yearly_completion_rate?: number
  best_performing_habits?: any[]
  struggling_habits?: any[]
  friends_count?: number
  challenges_joined?: number
  challenges_won?: number
  leaderboard_rank?: number
  social_interactions?: number
  total_spent?: number
  coins_earned?: number
  coins_spent?: number
  premium_status?: boolean
  subscription_type?: string
  device_type?: string
  os_version?: string
  app_version?: string
  network_type?: string
  battery_optimization?: boolean
  transactions?: any[]
  orders?: any[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [timelineUser, setTimelineUser] = useState<User | null>(null)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineStats, setTimelineStats] = useState<{ level: number; xp: number; streak: number; habits: number; completionRate: number; completions: number } | null>(null)
  const pageSize = 10
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search) {
        query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      // Get habits count and rewards for each user separately (more reliable than join)
      const usersWithStats = await Promise.all(
        (data || []).map(async (user: any) => {
          const [{ count: habitsCount }, { count: completionsCount }, { data: rewardsData }] = await Promise.all([
            supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
            supabase.from('user_rewards').select('coins, xp, level, current_streak, longest_streak, gems').eq('user_id', user.id).single()
          ])

          return {
            ...user,
            rewards: rewardsData || { coins: 0, xp: 0, level: 1, current_streak: 0, longest_streak: 0, gems: 0 },
            habits_count: habitsCount || 0,
            completions_count: completionsCount || 0
          }
        })
      )

      setUsers(usersWithStats)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const openTimeline = async (user: User) => {
    setTimelineUser(user)
    setTimelineLoading(true)
    setTimelineStats(null)
    
    try {
      const [logsRes, habitsRes, rewardsRes, focusRes, purchasesRes] = await Promise.all([
        supabase.from('habit_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_rewards').select('*').eq('user_id', user.id).single(),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('payment_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      ])

      const rewards = rewardsRes.data
      const totalHabits = habitsRes.data?.length || 0
      const completedLogs = logsRes.data?.filter(l => l.completed).length || 0
      const completionRate = totalHabits > 0 ? Math.round((completedLogs / totalHabits) * 100) : 0
      
      setTimelineStats({
        level: rewards?.level || 1,
        xp: rewards?.xp || 0,
        streak: rewards?.current_streak || 0,
        habits: totalHabits,
        completionRate,
        completions: completedLogs
      })

      const events: any[] = []

      events.push({ type: 'account', title: 'Account Created', description: 'User joined Sadhana', date: user.created_at, color: 'blue' })

      habitsRes.data?.forEach(habit => {
        events.push({ type: 'habit', title: `Created: ${habit.name}`, description: `Category: ${habit.category || 'General'}`, date: habit.created_at, color: 'green' })
      })

      focusRes.data?.forEach(session => {
        events.push({ type: 'focus', title: `Focus: ${session.duration || 0} min`, description: session.notes || 'Focus session', date: session.created_at, color: 'purple' })
      })

      purchasesRes.data?.forEach(purchase => {
        if (purchase.status === 'completed') {
          events.push({ type: 'purchase', title: `Purchase: ₹${(purchase.amount / 100).toFixed(0)}`, description: purchase.description || 'Coin package', date: purchase.created_at, color: 'yellow' })
        }
      })

      const completionsByDate: Record<string, number> = {}
      logsRes.data?.forEach(log => { if (log.completed) completionsByDate[log.date] = (completionsByDate[log.date] || 0) + 1 })
      Object.entries(completionsByDate).slice(0, 20).forEach(([date, count]) => {
        events.push({ type: 'completion', title: `Completed ${count} habit${count > 1 ? 's' : ''}`, description: new Date(date).toLocaleDateString('en-IN', { weekday: 'long' }), date: new Date(date).toISOString(), color: 'green' })
      })

      if (rewards?.level > 1) events.push({ type: 'level', title: `Current Level: ${rewards.level}`, description: `${rewards.xp || 0} XP • ${rewards.coins || 0} coins`, date: new Date().toISOString(), color: 'orange' })
      if (rewards?.current_streak > 0) events.push({ type: 'streak', title: `${rewards.current_streak}-Day Streak! 🔥`, description: `Best: ${rewards.longest_streak || 0} days`, date: new Date().toISOString(), color: 'orange' })

      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTimelineData(events)
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setTimelineLoading(false)
    }
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'account': return <Users size={16} />
      case 'habit': return <Target size={16} />
      case 'focus': return <Zap size={16} />
      case 'purchase': return <TrendingUp size={16} />
      case 'level': return <Trophy size={16} />
      case 'streak': return <Activity size={16} />
      case 'completion': return <CheckCircle2 size={16} />
      default: return <CheckCircle2 size={16} />
    }
  }

  const getTimelineColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'green': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'purple': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'yellow': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-blue-400" />
            User Management
          </h1>
          <p className="text-foreground-muted">{totalCount} total users</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Level</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">XP</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Coins</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Streak</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Habits</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Completions</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Joined</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-4">
                      <div className="h-10 bg-background rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-foreground-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-background/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-accent-primary font-bold">
                              {(user.full_name || user.username || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-foreground-muted">@{user.username || 'no-username'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                        Lvl {user.rewards?.level || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{(user.rewards?.xp || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Coins size={14} />
                        {user.rewards?.coins || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-orange-400">
                        <Flame size={14} />
                        {user.rewards?.current_streak || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.habits_count}</td>
                    <td className="px-4 py-3">{user.completions_count}</td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-background rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openTimeline(user)}
                          className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"
                          title="Timeline"
                        >
                          <BarChart3 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p className="text-sm text-foreground-muted">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1 bg-background rounded-lg text-sm">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced User Detail Modal */}
      {selectedUser && <AdvancedUserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {/* Timeline Modal */}
      {timelineUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-border-subtle max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border-subtle flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="text-purple-400" />
                    User Journey Timeline
                  </h2>
                  <p className="text-foreground-muted">@{timelineUser.username} • {timelineUser.full_name}</p>
                </div>
                <button onClick={() => setTimelineUser(null)} className="p-2 hover:bg-background rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2 mt-4">
                <div className="bg-background p-2.5 rounded-lg text-center">
                  <div className="text-base font-bold text-purple-400">Lv.{timelineStats?.level || '...'}</div>
                  <div className="text-[10px] text-foreground-muted">Level</div>
                </div>
                <div className="bg-background p-2.5 rounded-lg text-center">
                  <div className="text-base font-bold text-blue-400">{timelineStats?.xp?.toLocaleString() || '...'}</div>
                  <div className="text-[10px] text-foreground-muted">XP</div>
                </div>
                <div className="bg-background p-2.5 rounded-lg text-center">
                  <div className="text-base font-bold text-orange-400">{timelineStats?.streak || 0}🔥</div>
                  <div className="text-[10px] text-foreground-muted">Streak</div>
                </div>
                <div className="bg-background p-2.5 rounded-lg text-center">
                  <div className="text-base font-bold text-cyan-400">{timelineStats?.habits || 0}</div>
                  <div className="text-[10px] text-foreground-muted">Habits</div>
                </div>
                <div className="bg-background p-2.5 rounded-lg text-center">
                  <div className="text-base font-bold text-green-400">{timelineStats?.completions || 0}</div>
                  <div className="text-[10px] text-foreground-muted">Done</div>
                </div>
                <div className="bg-background p-2.5 rounded-lg text-center">
                  <div className="text-base font-bold text-yellow-400">{timelineStats?.completionRate || 0}%</div>
                  <div className="text-[10px] text-foreground-muted">Rate</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {timelineLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
              ) : timelineData.length === 0 ? (
                <div className="text-center py-12 text-foreground-muted">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No activity data available</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border-subtle" />
                  <div className="space-y-4">
                    {timelineData.map((event, index) => (
                      <div key={index} className="relative flex gap-4">
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 ${getTimelineColor(event.color)}`}>
                          {getTimelineIcon(event.type)}
                        </div>
                        <div className="flex-1 bg-background rounded-xl p-4 border border-border-subtle">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-foreground-muted">{event.description}</p>
                            </div>
                            <span className="text-xs text-foreground-muted whitespace-nowrap">
                              {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Advanced User Modal Component with 3 Essential Cards
function AdvancedUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [currentCard, setCurrentCard] = useState(0)
  const [detailedData, setDetailedData] = useState<DetailedUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDetailedUserData()
  }, [user.id])

  const fetchDetailedUserData = async () => {
    setLoading(true)
    try {
      // Fetch comprehensive user data from multiple tables
      const [
        profileData,
        habitsData,
        logsData,
        rewardsData,
        sessionsData,
        transactionsData,
        ordersData
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('user_rewards').select('*').eq('user_id', user.id).single(),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('payment_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payment_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ])

      // Process and aggregate data
      const habits = habitsData.data || []
      const logs = logsData.data || []
      const completedLogs = logs.filter(log => log.completed)
      const rewards = rewardsData.data || {}
      const sessions = sessionsData.data || []
      const transactions = transactionsData.data || []
      const orders = ordersData.data || []

      // Calculate analytics
      const totalSessions = sessions.length
      const totalFocusTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
      const avgSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0
      
      const completionRate = habits.length > 0 ? (completedLogs.length / (habits.length * 30)) * 100 : 0
      
      const categoryStats = habits.reduce((acc: any, habit: any) => {
        acc[habit.category] = (acc[habit.category] || 0) + 1
        return acc
      }, {})

      const bestCategory = Object.entries(categoryStats).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'None'

      // Time analysis
      const timeStats = logs.reduce((acc: any, log: any) => {
        if (log.completed_at) {
          const hour = new Date(log.completed_at).getHours()
          if (hour >= 6 && hour < 12) acc.morning++
          else if (hour >= 12 && hour < 18) acc.afternoon++
          else if (hour >= 18 && hour < 22) acc.evening++
          else acc.night++
        }
        return acc
      }, { morning: 0, afternoon: 0, evening: 0, night: 0 })

      const mostActiveTime = Object.entries(timeStats).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'morning'

      // User status calculation
      const lastActivity = logs[0]?.created_at || user.created_at
      const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      
      let userStatus: 'active' | 'inactive' | 'new' | 'churned' = 'active'
      const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      
      if (accountAge <= 7) userStatus = 'new'
      else if (daysSinceActivity > 30) userStatus = 'churned'
      else if (daysSinceActivity > 7) userStatus = 'inactive'

      // Risk assessment
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (daysSinceActivity > 14 || completionRate < 30) riskLevel = 'high'
      else if (daysSinceActivity > 7 || completionRate < 60) riskLevel = 'medium'

      // Engagement score (0-100)
      const engagementScore = Math.min(100, Math.round(
        (completionRate * 0.4) + 
        (Math.min(rewards.current_streak || 0, 30) * 2) + 
        (Math.min(totalSessions, 50) * 0.6)
      ))

      const detailedUserData: DetailedUserData = {
        ...user,
        ...profileData.data,
        
        // Activity & Engagement
        login_streak: rewards.current_streak || 0,
        total_sessions: totalSessions,
        avg_session_duration: avgSessionLength,
        last_login: lastActivity,
        total_screen_time: totalFocusTime,
        
        // Habits & Performance
        habit_categories: categoryStats,
        weekly_completion_rate: completionRate,
        monthly_completion_rate: completionRate,
        yearly_completion_rate: completionRate,
        best_performing_habits: habits.slice(0, 5),
        struggling_habits: habits.slice(-3),
        
        // Financial & Purchases
        total_spent: transactions.filter(t => t.status === 'completed').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) / 100, // Convert from paise to rupees
        coins_earned: rewards.total_coins_earned || 0,
        coins_spent: rewards.total_coins_spent || 0,
        premium_status: rewards.premium_status || false,
        subscription_type: rewards.subscription_type || 'free',
        
        // Transaction data
        transactions: transactions,
        orders: orders,
        
        // Analytics & Insights
        completion_rate: completionRate,
        best_category: bestCategory,
        most_active_time: mostActiveTime,
        user_status: userStatus,
        risk_level: riskLevel,
        engagement_score: engagementScore,
        
        // Additional computed data
        habits_count: habits.length,
        completions_count: completedLogs.length,
        total_focus_time: totalFocusTime,
        avg_session_length: avgSessionLength,
        rewards: rewards
      }

      setDetailedData(detailedUserData)
    } catch (error) {
      console.error('Error fetching detailed user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      id: 'profile',
      title: 'Profile & Account',
      icon: <Users className="text-blue-400" />,
      color: 'blue'
    },
    {
      id: 'activity',
      title: 'Activity & Performance',
      icon: <Activity className="text-green-400" />,
      color: 'green'
    },
    {
      id: 'financial',
      title: 'Financial & Rewards',
      icon: <CreditCard className="text-yellow-400" />,
      color: 'yellow'
    }
  ]

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const renderCardContent = () => {
    if (loading || !detailedData) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
        </div>
      )
    }

    const currentCardData = cards[currentCard]

    switch (currentCardData.id) {
      case 'profile':
        return <ProfileCard data={detailedData} />
      case 'activity':
        return <ActivityCard data={detailedData} />
      case 'financial':
        return <FinancialCard data={detailedData} />
      default:
        return <div>Card not found</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl border border-border-subtle w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-accent-primary font-bold text-lg">
                  {(user.full_name || user.username || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.full_name || 'No name'}</h2>
              <p className="text-foreground-muted">@{user.username || 'no-username'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <button
            onClick={prevCard}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            {cards[currentCard].icon}
            <span className="font-medium">{cards[currentCard].title}</span>
            <span className="text-sm text-foreground-muted">
              ({currentCard + 1}/{cards.length})
            </span>
          </div>
          
          <button
            onClick={nextCard}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderCardContent()}
        </div>

        {/* Card Indicators */}
        <div className="flex items-center justify-center gap-2 p-4 border-t border-border-subtle">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCard(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentCard ? 'bg-accent-primary' : 'bg-background'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Individual Card Components
function ProfileCard({ data }: { data: DetailedUserData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Basic Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-foreground-muted" />
              <span>{data.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-foreground-muted" />
              <span>{data.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-foreground-muted" />
              <span>{data.location || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-foreground-muted" />
              <span>Joined {new Date(data.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={20} className="text-gray-400" />
            Account Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                data.user_status === 'active' ? 'bg-green-500/20 text-green-400' :
                data.user_status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                data.user_status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {data.user_status?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Risk Level</span>
              <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                data.risk_level === 'low' ? 'bg-green-500/20 text-green-400' :
                data.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {data.risk_level?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Public Profile</span>
              <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                data.is_public ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {data.is_public ? 'YES' : 'NO'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {data.bio && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Bio</h3>
          <p className="text-foreground-muted bg-background p-4 rounded-lg">{data.bio}</p>
        </div>
      )}
    </div>
  )
}

function ActivityCard({ data }: { data: DetailedUserData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-purple-400" />
            <span className="text-sm text-foreground-muted">Total Habits</span>
          </div>
          <p className="text-2xl font-bold">{data.habits_count || 0}</p>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-sm text-foreground-muted">Completions</span>
          </div>
          <p className="text-2xl font-bold">{data.completions_count || 0}</p>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm text-foreground-muted">Current Streak</span>
          </div>
          <p className="text-2xl font-bold">{data.login_streak || 0}</p>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-sm text-foreground-muted">Success Rate</span>
          </div>
          <p className="text-2xl font-bold">{Math.round(data.completion_rate || 0)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Activity Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Last Login</span>
              <span className="text-foreground-muted">
                {data.last_login ? new Date(data.last_login).toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Most Active Time</span>
              <span className="text-foreground-muted capitalize">{data.most_active_time || 'Morning'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Focus Sessions</span>
              <span className="text-foreground-muted">{data.total_sessions || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Total Focus Time</span>
              <span className="text-foreground-muted">{Math.round((data.total_focus_time || 0) / 60)}h</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Habit Categories</h3>
          <div className="space-y-2">
            {Object.entries(data.habit_categories || {}).slice(0, 4).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="capitalize">{category}</span>
                <span className="text-foreground-muted font-medium">{count} habits</span>
              </div>
            ))}
            {Object.keys(data.habit_categories || {}).length === 0 && (
              <p className="text-foreground-muted text-center py-4">No habits found</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">User Status & Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                data.user_status === 'active' ? 'bg-green-500/20 text-green-400' :
                data.user_status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                data.user_status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {data.user_status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-sm text-foreground-muted">User Status</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                data.risk_level === 'low' ? 'bg-green-500/20 text-green-400' :
                data.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {data.risk_level?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-sm text-foreground-muted">Risk Level</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-accent-primary">
                {data.engagement_score || 0}%
              </span>
            </div>
            <p className="text-sm text-foreground-muted">Engagement Score</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FinancialCard({ data }: { data: DetailedUserData }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle2 size={16} className="text-green-400" />
      case 'failed':
        return <XCircle size={16} className="text-red-400" />
      case 'pending':
      case 'created':
        return <RefreshCw size={16} className="text-yellow-400" />
      case 'refunded':
        return <AlertCircle size={16} className="text-orange-400" />
      default:
        return <AlertCircle size={16} className="text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-500/20 text-green-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      case 'pending':
      case 'created':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'refunded':
        return 'bg-orange-500/20 text-orange-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={16} className="text-yellow-400" />
            <span className="text-sm text-foreground-muted">Current Coins</span>
          </div>
          <p className="text-2xl font-bold">{data.rewards?.coins || 0}</p>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-sm text-foreground-muted">Coins Earned</span>
          </div>
          <p className="text-2xl font-bold">{data.coins_earned || 0}</p>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={16} className="text-blue-400" />
            <span className="text-sm text-foreground-muted">Coins Spent</span>
          </div>
          <p className="text-2xl font-bold">{data.coins_spent || 0}</p>
        </div>
        <div className="bg-background p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-purple-400" />
            <span className="text-sm text-foreground-muted">Lifetime Value</span>
          </div>
          <p className="text-2xl font-bold">₹{(data.total_spent || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Subscription Details</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Status</span>
              <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                data.premium_status ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {data.premium_status ? 'PREMIUM' : 'FREE'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Plan Type</span>
              <span className="text-foreground-muted capitalize">{data.subscription_type || 'free'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Total Transactions</span>
              <span className="text-foreground-muted">{(data.transactions || []).length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Gems</span>
              <span className="text-foreground-muted">{data.rewards?.gems || 0}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Rewards Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Current Level</span>
              <span className="text-foreground-muted">Level {data.rewards?.level || 1}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Total XP</span>
              <span className="text-foreground-muted">{(data.rewards?.xp || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Perfect Days</span>
              <span className="text-foreground-muted">{data.rewards?.perfect_days || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>Best Streak</span>
              <span className="text-foreground-muted">{data.rewards?.longest_streak || 0} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-background p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {(data.transactions || []).length === 0 ? (
            <p className="text-foreground-muted text-center py-4">No transactions found</p>
          ) : (
            (data.transactions || []).map((transaction: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium">₹{(transaction.amount / 100).toFixed(2)}</p>
                    <p className="text-sm text-foreground-muted">
                      {transaction.coins_purchased ? `${transaction.coins_purchased} coins` : 'Payment'}
                      {transaction.bonus_coins ? ` + ${transaction.bonus_coins} bonus` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-foreground-muted mt-1">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Orders (if different from transactions) */}
      {(data.orders || []).length > 0 && (
        <div className="bg-background p-4 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Payment Orders</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(data.orders || []).map((order: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium">₹{(order.amount / 100).toFixed(2)}</p>
                    <p className="text-sm text-foreground-muted">Order ID: {order.order_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-foreground-muted mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}