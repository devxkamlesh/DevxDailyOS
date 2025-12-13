'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins, Zap, Gift, Search, TrendingUp, Award } from 'lucide-react'

interface RewardStats {
  totalCoins: number
  totalXP: number
  avgCoinsPerUser: number
  avgXPPerUser: number
  topEarners: { username: string; coins: number; xp: number; level: number }[]
}

export default function AdminRewardsPage() {
  const [stats, setStats] = useState<RewardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [giftForm, setGiftForm] = useState({ userId: '', coins: 0, xp: 0, reason: '' })
  const [gifting, setGifting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('user_id, coins, xp, level, profiles(username)')
        .order('xp', { ascending: false })

      if (!rewards) return

      const totalCoins = rewards.reduce((sum, r) => sum + (r.coins || 0), 0)
      const totalXP = rewards.reduce((sum, r) => sum + (r.xp || 0), 0)
      const userCount = rewards.length || 1

      setStats({
        totalCoins,
        totalXP,
        avgCoinsPerUser: Math.round(totalCoins / userCount),
        avgXPPerUser: Math.round(totalXP / userCount),
        topEarners: rewards.slice(0, 10).map((r: any) => ({
          username: r.profiles?.username || 'Unknown',
          coins: r.coins || 0,
          xp: r.xp || 0,
          level: r.level || 1
        }))
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGift = async () => {
    if (!giftForm.userId || (giftForm.coins === 0 && giftForm.xp === 0)) {
      alert('Please enter user ID and at least coins or XP')
      return
    }

    setGifting(true)
    try {
      const { data: current } = await supabase
        .from('user_rewards')
        .select('coins, xp')
        .eq('user_id', giftForm.userId)
        .single()

      await supabase.from('user_rewards').upsert({
        user_id: giftForm.userId,
        coins: (current?.coins || 0) + giftForm.coins,
        xp: (current?.xp || 0) + giftForm.xp
      }, { onConflict: 'user_id' })

      alert(`Gifted ${giftForm.coins} coins and ${giftForm.xp} XP!`)
      setGiftForm({ userId: '', coins: 0, xp: 0, reason: '' })
      fetchStats()
    } catch (error) {
      alert('Error gifting rewards')
    } finally {
      setGifting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Coins className="text-yellow-400" />
          Rewards Management
        </h1>
        <p className="text-foreground-muted">Overview of coins and XP distribution</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/20 rounded-xl">
              <Coins size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalCoins.toLocaleString()}</p>
              <p className="text-sm text-foreground-muted">Total Coins</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl">
              <Zap size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalXP.toLocaleString()}</p>
              <p className="text-sm text-foreground-muted">Total XP</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/20 rounded-xl">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.avgCoinsPerUser}</p>
              <p className="text-sm text-foreground-muted">Avg Coins/User</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <Award size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.avgXPPerUser}</p>
              <p className="text-sm text-foreground-muted">Avg XP/User</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gift Rewards */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Gift size={20} className="text-pink-400" />
            Gift Rewards
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <input
                type="text"
                value={giftForm.userId}
                onChange={(e) => setGiftForm({ ...giftForm, userId: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                placeholder="Enter user UUID..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coins</label>
                <input
                  type="number"
                  value={giftForm.coins}
                  onChange={(e) => setGiftForm({ ...giftForm, coins: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">XP</label>
                <input
                  type="number"
                  value={giftForm.xp}
                  onChange={(e) => setGiftForm({ ...giftForm, xp: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reason (optional)</label>
              <input
                type="text"
                value={giftForm.reason}
                onChange={(e) => setGiftForm({ ...giftForm, reason: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                placeholder="e.g., Bug report reward"
              />
            </div>
            <button
              onClick={handleGift}
              disabled={gifting}
              className="w-full py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {gifting ? 'Gifting...' : 'Send Gift'}
            </button>
          </div>
        </div>

        {/* Top Earners */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            Top Earners
          </h2>
          <div className="space-y-3">
            {stats?.topEarners.map((user, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-background text-foreground-muted'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">@{user.username}</p>
                    <p className="text-xs text-foreground-muted">Level {user.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-400">{user.coins} coins</p>
                  <p className="text-xs text-purple-400">{user.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
