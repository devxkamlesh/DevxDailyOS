'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Plus, Edit2, Trash2, X, CheckCircle2, Coins, Zap } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string | null
  target_type: 'completions' | 'streak' | 'perfect_days'
  target_value: number
  coin_reward: number
  xp_reward: number
  is_active: boolean
  week_start: string | null
  week_end: string | null
  created_at: string
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_type: 'completions' as 'completions' | 'streak' | 'perfect_days',
    target_value: 10,
    coin_reward: 50,
    xp_reward: 100,
    is_active: true
  })
  const supabase = createClient()

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('weekly_challenges')
      .select('*')
      .order('created_at', { ascending: false })
    setChallenges(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const payload = {
      ...formData,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0]
    }

    if (editingChallenge) {
      await supabase.from('weekly_challenges').update(payload).eq('id', editingChallenge.id)
    } else {
      await supabase.from('weekly_challenges').insert(payload)
    }

    resetForm()
    fetchChallenges()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_type: 'completions',
      target_value: 10,
      coin_reward: 50,
      xp_reward: 100,
      is_active: true
    })
    setShowForm(false)
    setEditingChallenge(null)
  }

  const openEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge)
    setFormData({
      title: challenge.title,
      description: challenge.description || '',
      target_type: challenge.target_type,
      target_value: challenge.target_value,
      coin_reward: challenge.coin_reward,
      xp_reward: challenge.xp_reward,
      is_active: challenge.is_active
    })
    setShowForm(true)
  }

  const toggleActive = async (challenge: Challenge) => {
    await supabase.from('weekly_challenges').update({ is_active: !challenge.is_active }).eq('id', challenge.id)
    fetchChallenges()
  }

  const deleteChallenge = async (id: string) => {
    if (!confirm('Delete this challenge?')) return
    await supabase.from('weekly_challenges').delete().eq('id', id)
    fetchChallenges()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            Weekly Challenges
          </h1>
          <p className="text-foreground-muted">Manage weekly challenges for users</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
        >
          <Plus size={18} />
          New Challenge
        </button>
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Trophy size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted">No challenges yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`bg-surface rounded-2xl p-6 border transition ${
                challenge.is_active ? 'border-yellow-500/50' : 'border-border-subtle opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className={challenge.is_active ? 'text-yellow-400' : 'text-foreground-muted'} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    challenge.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {challenge.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(challenge)} className="p-1.5 hover:bg-background rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteChallenge(challenge.id)} className="p-1.5 hover:bg-background rounded-lg text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2">{challenge.title}</h3>
              {challenge.description && (
                <p className="text-sm text-foreground-muted mb-4">{challenge.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Target</span>
                  <span className="font-medium capitalize">
                    {challenge.target_value} {challenge.target_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Rewards</span>
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Coins size={14} /> {challenge.coin_reward}
                    </span>
                    <span className="flex items-center gap-1 text-purple-400">
                      <Zap size={14} /> {challenge.xp_reward}
                    </span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleActive(challenge)}
                className={`w-full mt-4 py-2 rounded-xl text-sm font-medium transition ${
                  challenge.is_active
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {challenge.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg border border-border-subtle">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingChallenge ? 'Edit Challenge' : 'New Challenge'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-background rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Type</label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                  >
                    <option value="completions">Completions</option>
                    <option value="streak">Streak Days</option>
                    <option value="perfect_days">Perfect Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Value</label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Coin Reward</label>
                  <input
                    type="number"
                    value={formData.coin_reward}
                    onChange={(e) => setFormData({ ...formData, coin_reward: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">XP Reward</label>
                  <input
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2.5 bg-background border border-border-subtle rounded-xl hover:bg-surface transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition">
                  {editingChallenge ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
