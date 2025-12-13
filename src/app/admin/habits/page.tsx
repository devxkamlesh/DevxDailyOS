'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Search, Filter, TrendingUp, Users, CheckCircle2 } from 'lucide-react'

interface HabitStats {
  id: string
  name: string
  category: string
  type: string
  target_unit: string | null
  user_count: number
  total_completions: number
  avg_completion_rate: number
}

export default function AdminHabitsPage() {
  const [habits, setHabits] = useState<HabitStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    setLoading(true)
    try {
      // Get all habits with completion counts
      const { data: habitsData } = await supabase
        .from('habits')
        .select('id, name, category, type, target_unit, user_id')

      if (!habitsData) return

      // Get completion counts for each habit
      const habitsWithStats = await Promise.all(
        habitsData.map(async (habit) => {
          const { count: completions } = await supabase
            .from('habit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('habit_id', habit.id)
            .eq('completed', true)

          const { count: totalLogs } = await supabase
            .from('habit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('habit_id', habit.id)

          return {
            ...habit,
            user_count: 1, // Each habit belongs to one user
            total_completions: completions || 0,
            avg_completion_rate: totalLogs ? Math.round(((completions || 0) / totalLogs) * 100) : 0
          }
        })
      )

      // Aggregate by habit name (same habits across users)
      const aggregated = new Map<string, HabitStats>()
      habitsWithStats.forEach(h => {
        const key = h.name.toLowerCase()
        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!
          existing.user_count++
          existing.total_completions += h.total_completions
        } else {
          aggregated.set(key, { ...h })
        }
      })

      setHabits(Array.from(aggregated.values()).sort((a, b) => b.total_completions - a.total_completions))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHabits = habits.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || h.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'morning', 'work', 'night', 'health', 'focus']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="text-purple-400" />
          Habits Data
        </h1>
        <p className="text-foreground-muted">Overview of all habits across users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition capitalize ${
                categoryFilter === cat
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface text-foreground-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl">
              <Target size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{habits.length}</p>
              <p className="text-sm text-foreground-muted">Unique Habits</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/20 rounded-xl">
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{habits.reduce((sum, h) => sum + h.total_completions, 0).toLocaleString()}</p>
              <p className="text-sm text-foreground-muted">Total Completions</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {habits.length ? Math.round(habits.reduce((sum, h) => sum + h.avg_completion_rate, 0) / habits.length) : 0}%
              </p>
              <p className="text-sm text-foreground-muted">Avg Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habits Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Habit</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Users</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Completions</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Avg Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-8 bg-background rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredHabits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground-muted">No habits found</td>
                </tr>
              ) : (
                filteredHabits.map((habit) => (
                  <tr key={habit.id} className="hover:bg-background/50 transition">
                    <td className="px-4 py-3 font-medium">{habit.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-background rounded-lg text-sm capitalize">{habit.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {habit.type === 'numeric' ? `${habit.target_unit || 'numeric'}` : 'boolean'}
                    </td>
                    <td className="px-4 py-3">{habit.user_count}</td>
                    <td className="px-4 py-3 font-medium text-accent-success">{habit.total_completions}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-accent-primary" style={{ width: `${habit.avg_completion_rate}%` }} />
                        </div>
                        <span className="text-sm">{habit.avg_completion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
