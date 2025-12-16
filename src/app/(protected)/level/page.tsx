'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Star, Crown, Trophy, Award, Target, Flame, Lock, CheckCircle2, Coins, Gift } from 'lucide-react'


interface LevelBadge {
  level: number
  name: string
  icon: any
  color: string
  bgColor: string
  xpRequired: number
  coinReward: number
  unlocked: boolean
  claimed: boolean
}

interface UserStats {
  xp: number
  level: number
  coins: number
  totalCompletions: number
}

// XP required for each level (exponential growth)
const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

// Level badges - Starting from Level 30 (HARD MODE) - Coin rewards: 100-300
const LEVEL_BADGES: Omit<LevelBadge, 'unlocked' | 'claimed'>[] = [
  { level: 30, name: 'Grandmaster', icon: Crown, color: 'text-orange-500', bgColor: 'bg-orange-500/10', xpRequired: calculateXPForLevel(30), coinReward: 100 },
  { level: 40, name: 'Legend', icon: Flame, color: 'text-red-500', bgColor: 'bg-red-500/10', xpRequired: calculateXPForLevel(40), coinReward: 125 },
  { level: 50, name: 'Mythic', icon: Crown, color: 'text-pink-500', bgColor: 'bg-pink-500/10', xpRequired: calculateXPForLevel(50), coinReward: 150 },
  { level: 60, name: 'Divine', icon: Star, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', xpRequired: calculateXPForLevel(60), coinReward: 175 },
  { level: 75, name: 'Immortal', icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-400/10', xpRequired: calculateXPForLevel(75), coinReward: 200 },
  { level: 100, name: 'Transcendent', icon: Crown, color: 'text-purple-500', bgColor: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10', xpRequired: calculateXPForLevel(100), coinReward: 225 },
  { level: 150, name: 'Celestial', icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-400/10', xpRequired: calculateXPForLevel(150), coinReward: 275 },
  { level: 200, name: 'Eternal', icon: Crown, color: 'text-yellow-400', bgColor: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10', xpRequired: calculateXPForLevel(200), coinReward: 300 },
]

export default function LevelPage() {
  const [stats, setStats] = useState<UserStats>({ xp: 0, level: 1, coins: 0, totalCompletions: 0 })
  const [badges, setBadges] = useState<LevelBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [, setClaimedLevels] = useState<number[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user rewards
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('xp, level, coins')
        .eq('user_id', user.id)
        .single()

      // Fetch total completions
      const { count } = await supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)

      // Fetch claimed level badges
      const { data: claimedData } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)
        .like('achievement_id', 'level_%')

      const claimed = claimedData?.map(c => parseInt(c.achievement_id.replace('level_', ''))) || []
      setClaimedLevels(claimed)

      const currentLevel = rewards?.level || 1
      const currentXP = rewards?.xp || 0

      setStats({
        xp: currentXP,
        level: currentLevel,
        coins: rewards?.coins || 0,
        totalCompletions: count || 0
      })

      // Map badges with unlock status
      const badgesList = LEVEL_BADGES.map(badge => ({
        ...badge,
        unlocked: currentLevel >= badge.level,
        claimed: claimed.includes(badge.level)
      }))

      setBadges(badgesList)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching level data:', error)
      setLoading(false)
    }
  }


  const handleClaimBadge = async (level: number, coinReward: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setClaiming(level)

    try {
      // Insert achievement record
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: `level_${level}` })

      if (insertError) throw insertError

      // Award coins
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('coins')
        .eq('user_id', user.id)
        .single()

      await supabase
        .from('user_rewards')
        .update({ coins: (rewards?.coins || 0) + coinReward })
        .eq('user_id', user.id)

      // Update local state
      setClaimedLevels(prev => [...prev, level])
      setBadges(prev => prev.map(b => b.level === level ? { ...b, claimed: true } : b))
      setStats(prev => ({ ...prev, coins: prev.coins + coinReward }))
    } catch (error) {
      console.error('Error claiming badge:', error)
    }

    setClaiming(null)
  }

  const currentLevelXP = calculateXPForLevel(stats.level)
  const nextLevelXP = calculateXPForLevel(stats.level + 1)
  const xpProgress = stats.xp - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  const progressPercent = Math.min((xpProgress / xpNeeded) * 100, 100)

  const unclaimedCount = badges.filter(b => b.unlocked && !b.claimed).length

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 w-48 bg-surface rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-80 bg-surface/50 rounded animate-pulse" />
        </div>
        
        {/* Current Level Card Skeleton */}
        <div className="bg-surface/50 p-8 rounded-2xl border border-border-subtle">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-background rounded-2xl animate-pulse" />
              <div>
                <div className="h-4 w-20 bg-background rounded animate-pulse mb-2" />
                <div className="h-10 w-32 bg-background rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-24 bg-background rounded animate-pulse mb-2" />
              <div className="h-6 w-36 bg-background rounded animate-pulse" />
            </div>
          </div>
          {/* Progress bar skeleton */}
          <div className="h-4 bg-background rounded-full animate-pulse mb-2" />
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-background/50 rounded animate-pulse" />
            <div className="h-3 w-24 bg-background/50 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface/50 p-5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-background rounded-lg animate-pulse" />
                <div>
                  <div className="h-6 w-16 bg-background rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-background/50 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Badges Grid Skeleton */}
        <div>
          <div className="h-6 w-32 bg-surface rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-surface/50 p-4 rounded-xl border border-border-subtle">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-background rounded-xl animate-pulse mb-3" />
                  <div className="h-4 w-20 bg-background rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-background/50 rounded animate-pulse mb-3" />
                  <div className="h-8 w-full bg-background rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Level Progress</h1>
        <p className="text-foreground-muted">Earn XP by completing habits and unlock exclusive badges</p>
      </div>

      {/* Current Level Card */}
      <div className="bg-gradient-to-br from-accent-primary/20 to-purple-500/20 p-8 rounded-2xl border border-accent-primary/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-accent-primary/20 flex items-center justify-center">
              <span className="text-4xl font-black text-accent-primary">{stats.level}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Level {stats.level}</h2>
              <p className="text-foreground-muted">{stats.xp.toLocaleString()} Total XP</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-yellow-500">
              <Coins size={24} />
              <span className="text-2xl font-bold">{stats.coins}</span>
            </div>
            <p className="text-xs text-foreground-muted">Total Coins</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Progress to Level {stats.level + 1}</span>
            <span className="font-semibold">{xpProgress.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
          </div>
          <div className="h-4 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-primary to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-foreground-muted text-center">
            {(xpNeeded - xpProgress).toLocaleString()} XP needed for next level
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-blue-500" />
            <span className="text-xs text-foreground-muted">Completions</span>
          </div>
          <span className="text-xl font-bold">{stats.totalCompletions}</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} className="text-purple-500" />
            <span className="text-xs text-foreground-muted">XP Rate</span>
          </div>
          <span className="text-xl font-bold">10/habit</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-yellow-500" />
            <span className="text-xs text-foreground-muted">Badges Earned</span>
          </div>
          <span className="text-xl font-bold">{badges.filter(b => b.unlocked).length}/{badges.length}</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={18} className="text-green-500" />
            <span className="text-xs text-foreground-muted">To Claim</span>
          </div>
          <span className="text-xl font-bold text-yellow-500">{unclaimedCount}</span>
        </div>
      </div>

      {/* Level Badges */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award size={20} className="text-accent-primary" />
          Level Badges
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            // Find the index of the first unlocked badge or next to unlock
            const firstUnlockedIndex = badges.findIndex(b => !b.unlocked)
            const nearCurrentIndex = firstUnlockedIndex === -1 ? badges.length - 1 : firstUnlockedIndex
            // Show clearly: unlocked badges + next 2 locked badges
            const isNearCurrent = badge.unlocked || index <= nearCurrentIndex + 1
            const shouldBlur = !isNearCurrent
            
            return (
              <div
                key={badge.level}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  badge.unlocked
                    ? badge.claimed
                      ? 'bg-surface border-accent-success/50'
                      : 'bg-surface border-yellow-500/50 animate-pulse'
                    : 'bg-surface/50 border-border-subtle opacity-60'
                } ${shouldBlur ? 'blur-sm' : ''}`}
              >
                {!badge.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={14} className="text-foreground-muted" />
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl ${badge.bgColor} flex items-center justify-center mb-3 mx-auto`}>
                  <Icon size={24} className={badge.color} />
                </div>

                <div className="text-center">
                  <div className="font-bold text-sm">{badge.name}</div>
                  <div className="text-xs text-foreground-muted mb-2">Level {badge.level}</div>

                  {badge.claimed ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-accent-success">
                      <CheckCircle2 size={12} />
                      Claimed
                    </div>
                  ) : badge.unlocked ? (
                    <button
                      onClick={() => handleClaimBadge(badge.level, badge.coinReward)}
                      disabled={claiming === badge.level}
                      className="w-full py-1.5 px-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50"
                    >
                      {claiming === badge.level ? '...' : `+${badge.coinReward}`}
                    </button>
                  ) : (
                    <div className="text-xs text-foreground-muted">
                      +{badge.coinReward} coins
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* XP Guide */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <h3 className="font-bold mb-4">How to Earn XP</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-500" />
            </div>
            <div>
              <div className="font-semibold">Complete Habit</div>
              <div className="text-foreground-muted">+10 XP</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Star size={20} className="text-yellow-500" />
            </div>
            <div>
              <div className="font-semibold">Perfect Day</div>
              <div className="text-foreground-muted">+50 XP Bonus</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Trophy size={20} className="text-purple-500" />
            </div>
            <div>
              <div className="font-semibold">Achievements</div>
              <div className="text-foreground-muted">25-200 XP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
