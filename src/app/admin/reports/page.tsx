'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3, Users, Target, DollarSign, TrendingUp, Calendar,
  Download, RefreshCw, Activity, Award, Zap, Clock
} from 'lucide-react'

interface ReportData {
  totalUsers: number
  activeUsers: number
  totalHabits: number
  totalCompletions: number
  totalRevenue: number
  avgStreak: number
  topHabits: { name: string; count: number }[]
  userGrowth: { date: string; count: number }[]
  completionRate: number
  premiumUsers: number
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0, activeUsers: 0, totalHabits: 0, totalCompletions: 0,
    totalRevenue: 0, avgStreak: 0, topHabits: [], userGrowth: [],
    completionRate: 0, premiumUsers: 0
  })
  const supabase = createClient()

  const fetchReportData = async () => {
    setLoading(true)
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange))

    // Fetch all data in parallel
    const [usersRes, habitsRes, logsRes, rewardsRes, transactionsRes] = await Promise.all([
      supabase.from('profiles').select('id, created_at'),
      supabase.from('habits').select('id, name, user_id'),
      supabase.from('habit_logs').select('id, completed, created_at').gte('created_at', daysAgo.toISOString()),
      supabase.from('user_rewards').select('current_streak'),
      supabase.from('payment_transactions').select('amount').eq('status', 'completed')
    ])

    const users = usersRes.data || []
    const habits = habitsRes.data || []
    const logs = logsRes.data || []
    const rewards = rewardsRes.data || []
    const transactions = transactionsRes.data || []

    // Calculate metrics
    const activeUserIds = new Set(logs.map(l => l.id))
    const completedLogs = logs.filter(l => l.completed)
    const avgStreak = rewards.length > 0 ? rewards.reduce((sum, r) => sum + (r.current_streak || 0), 0) / rewards.length : 0
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)

    // Top habits by completion
    const habitCounts: Record<string, number> = {}
    habits.forEach(h => { habitCounts[h.name] = (habitCounts[h.name] || 0) + 1 })
    const topHabits = Object.entries(habitCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // User growth by day
    const growthMap: Record<string, number> = {}
    users.forEach(u => {
      const date = new Date(u.created_at).toISOString().split('T')[0]
      growthMap[date] = (growthMap[date] || 0) + 1
    })
    const userGrowth = Object.entries(growthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, count]) => ({ date, count }))

    setReportData({
      totalUsers: users.length,
      activeUsers: activeUserIds.size,
      totalHabits: habits.length,
      totalCompletions: completedLogs.length,
      totalRevenue,
      avgStreak: Math.round(avgStreak * 10) / 10,
      topHabits,
      userGrowth,
      completionRate: logs.length > 0 ? Math.round((completedLogs.length / logs.length) * 100) : 0,
      premiumUsers: 0 // Would need premium flag in profiles
    })
    setLoading(false)
  }

  useEffect(() => { fetchReportData() }, [dateRange])

  const exportCSV = () => {
    const csv = [
      ['Metric', 'Value'],
      ['Total Users', reportData.totalUsers],
      ['Active Users', reportData.activeUsers],
      ['Total Habits', reportData.totalHabits],
      ['Total Completions', reportData.totalCompletions],
      ['Completion Rate', `${reportData.completionRate}%`],
      ['Average Streak', reportData.avgStreak],
      ['Total Revenue', `₹${reportData.totalRevenue}`]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Reports & Analytics</h1>
          <p className="text-[var(--foreground-muted)]">Overview of app performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={() => fetchReportData()} className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--background)] transition">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-[var(--surface)] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Users size={20} className="text-blue-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Total Users</span>
              </div>
              <p className="text-3xl font-bold">{reportData.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg"><Activity size={20} className="text-green-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Active Users</span>
              </div>
              <p className="text-3xl font-bold text-green-400">{reportData.activeUsers.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Target size={20} className="text-purple-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Total Habits</span>
              </div>
              <p className="text-3xl font-bold">{reportData.totalHabits.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/10 rounded-lg"><Zap size={20} className="text-orange-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Completions</span>
              </div>
              <p className="text-3xl font-bold">{reportData.totalCompletions.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg"><TrendingUp size={20} className="text-cyan-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Completion Rate</span>
              </div>
              <p className="text-3xl font-bold">{reportData.completionRate}%</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg"><Award size={20} className="text-yellow-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Avg Streak</span>
              </div>
              <p className="text-3xl font-bold">{reportData.avgStreak} days</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign size={20} className="text-emerald-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">₹{reportData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-500/10 rounded-lg"><Clock size={20} className="text-pink-400" /></div>
                <span className="text-sm text-[var(--foreground-muted)]">Period</span>
              </div>
              <p className="text-3xl font-bold">{dateRange}d</p>
            </div>
          </div>

          {/* Top Habits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border-subtle)]">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Top Habits</h3>
              {reportData.topHabits.length === 0 ? (
                <p className="text-[var(--foreground-muted)] text-sm">No data available</p>
              ) : (
                <div className="space-y-3">
                  {reportData.topHabits.map((habit, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{habit.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[var(--background)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${(habit.count / reportData.topHabits[0].count) * 100}%` }} />
                        </div>
                        <span className="text-sm text-[var(--foreground-muted)] w-8 text-right">{habit.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border-subtle)]">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} /> User Growth (Last 30 days)</h3>
              {reportData.userGrowth.length === 0 ? (
                <p className="text-[var(--foreground-muted)] text-sm">No data available</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {reportData.userGrowth.slice(-30).map((day, i) => {
                    const maxCount = Math.max(...reportData.userGrowth.map(d => d.count))
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                    return (
                      <div key={i} className="flex-1 bg-[var(--accent-primary)]/50 rounded-t hover:bg-[var(--accent-primary)] transition" style={{ height: `${Math.max(height, 5)}%` }} title={`${day.date}: ${day.count} users`} />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
