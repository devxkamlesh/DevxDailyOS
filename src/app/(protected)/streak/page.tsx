'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame, Calendar, Trophy, Star, Crown, Lock, CheckCircle2, Gift } from 'lucide-react'
import DateManipulationBlocker from '@/components/ui/DateManipulationBlocker'

interface StreakBadge {
  days: number
  name: string
  icon: any
  color: string
  bgColor: string
  coinReward: number
  xpReward: number
  unlocked: boolean
  claimed: boolean
}

interface StreakStats {
  currentStreak: number
  longestStreak: number
  totalDaysActive: number
  perfectDays: number
  coins: number
}

// Streak badges - HARD MODE (Starting from 30 days minimum)
const STREAK_BADGES: Omit<StreakBadge, 'unlocked' | 'claimed'>[] = [
  { days: 30, name: 'Month Master', icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-500/10', coinReward: 100, xpReward: 150 },
  { days: 60, name: 'Discipline King', icon: Crown, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', coinReward: 150, xpReward: 200 },
  { days: 90, name: 'Quarter Champion', icon: Trophy, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', coinReward: 200, xpReward: 300 },
  { days: 180, name: 'Half Year Hero', icon: Star, color: 'text-pink-500', bgColor: 'bg-pink-500/10', coinReward: 350, xpReward: 500 },
  { days: 365, name: 'Year Legend', icon: Crown, color: 'text-amber-400', bgColor: 'bg-amber-400/10', coinReward: 500, xpReward: 1000 },
  { days: 500, name: 'Unstoppable', icon: Flame, color: 'text-red-600', bgColor: 'bg-red-600/10', coinReward: 750, xpReward: 1500 },
  { days: 730, name: 'Two Year Titan', icon: Crown, color: 'text-yellow-400', bgColor: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10', coinReward: 1000, xpReward: 2000 },
  { days: 1000, name: 'Immortal', icon: Star, color: 'text-gradient', bgColor: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10', coinReward: 2000, xpReward: 5000 },
]

export default function StreakPage() {
  const [stats, setStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysActive: 0,
    perfectDays: 0,
    coins: 0
  })
  const [badges, setBadges] = useState<StreakBadge[]>([])
  const [streakHistory, setStreakHistory] = useState<{ date: string; completed: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [, setClaimedStreaks] = useState<number[]>([])

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
        .select('current_streak, longest_streak, perfect_days, coins')
        .eq('user_id', user.id)
        .single()

      // Fetch habit logs for streak calculation
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })

      // Fetch claimed streak badges
      const { data: claimedData } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)
        .like('achievement_id', 'streak_%')

      const claimed = claimedData?.map(c => parseInt(c.achievement_id.replace('streak_', ''))) || []
      setClaimedStreaks(claimed)

      // Calculate streaks using IST timezone
      const uniqueDates = [...new Set(logs?.map(l => l.date) || [])].sort().reverse()
      let currentStreak = 0
      let longestStreak = rewards?.longest_streak || 0

      // Import getLocalDateString for IST timezone
      const { getLocalDateString } = await import('@/lib/date-utils')
      
      const today = new Date()
      for (let i = 0; i < uniqueDates.length; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const checkDateStr = getLocalDateString(checkDate)
        
        if (uniqueDates.includes(checkDateStr)) {
          currentStreak++
        } else if (i === 0) {
          break
        } else {
          break
        }
      }

      longestStreak = Math.max(currentStreak, longestStreak)

      // Build streak history (last 30 days) using IST timezone
      const history: { date: string; completed: number }[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = getLocalDateString(d)
        const dayLogs = logs?.filter(l => l.date === dateStr) || []
        history.push({ date: dateStr, completed: dayLogs.length })
      }
      setStreakHistory(history)

      setStats({
        currentStreak,
        longestStreak,
        totalDaysActive: uniqueDates.length,
        perfectDays: rewards?.perfect_days || 0,
        coins: rewards?.coins || 0
      })

      // Map badges with unlock status
      const badgesList = STREAK_BADGES.map(badge => ({
        ...badge,
        unlocked: longestStreak >= badge.days,
        claimed: claimed.includes(badge.days)
      }))

      setBadges(badgesList)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching streak data:', error)
      setLoading(false)
    }
  }


  const handleClaimBadge = async (days: number, coinReward: number, xpReward: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setClaiming(days)

    try {
      // Insert achievement record
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: `streak_${days}` })

      if (insertError) throw insertError

      // Award coins and XP
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('coins, xp')
        .eq('user_id', user.id)
        .single()

      await supabase
        .from('user_rewards')
        .update({ 
          coins: (rewards?.coins || 0) + coinReward,
          xp: (rewards?.xp || 0) + xpReward
        })
        .eq('user_id', user.id)

      // Update local state
      setClaimedStreaks(prev => [...prev, days])
      setBadges(prev => prev.map(b => b.days === days ? { ...b, claimed: true } : b))
      setStats(prev => ({ ...prev, coins: prev.coins + coinReward }))
    } catch (error) {
      console.error('Error claiming badge:', error)
    }

    setClaiming(null)
  }

  const unclaimedCount = badges.filter(b => b.unlocked && !b.claimed).length
  const nextBadge = badges.find(b => !b.unlocked)
  const daysToNext = nextBadge ? nextBadge.days - stats.longestStreak : 0

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 w-44 bg-surface rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-surface/50 rounded animate-pulse" />
        </div>
        
        {/* Current Streak Card Skeleton */}
        <div className="bg-surface/50 p-8 rounded-2xl border border-border-subtle">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-background rounded-2xl animate-pulse" />
              <div>
                <div className="h-4 w-24 bg-background rounded animate-pulse mb-2" />
                <div className="h-12 w-20 bg-background rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-28 bg-background rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-background rounded animate-pulse" />
            </div>
          </div>
          {/* Progress to next badge skeleton */}
          <div className="bg-background/50 p-4 rounded-xl">
            <div className="flex justify-between mb-2">
              <div className="h-4 w-32 bg-background rounded animate-pulse" />
              <div className="h-4 w-20 bg-background rounded animate-pulse" />
            </div>
            <div className="h-3 bg-background rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface/50 p-5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-background rounded-lg animate-pulse" />
                <div>
                  <div className="h-6 w-12 bg-background rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-background/50 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Badges Section Skeleton */}
        <div>
          <div className="h-6 w-36 bg-surface rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-surface/50 p-4 rounded-xl border border-border-subtle">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-background rounded-xl animate-pulse mb-3" />
                  <div className="h-4 w-24 bg-background rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-background/50 rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-background/50 rounded animate-pulse mb-3" />
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
    <DateManipulationBlocker>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Streak Tracker</h1>
        <p className="text-foreground-muted">Build consistency and unlock legendary streak badges</p>
      </div>

      {/* Current Streak Card */}
      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-8 rounded-2xl border border-orange-500/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame size={48} className="text-white" />
            </div>
            <div>
              <div className="text-5xl font-black text-orange-500">{stats.currentStreak}</div>
              <p className="text-foreground-muted">Day Streak</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">{stats.longestStreak}</div>
            <p className="text-xs text-foreground-muted">Longest Streak</p>
          </div>
        </div>

        {nextBadge && (
          <div className="bg-background/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground-muted">Next Badge: {nextBadge.name}</span>
              <span className="text-sm font-semibold">{daysToNext} days to go</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                style={{ width: `${(stats.longestStreak / nextBadge.days) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-xs text-foreground-muted">Days Active</span>
          </div>
          <span className="text-xl font-bold">{stats.totalDaysActive}</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} className="text-yellow-500" />
            <span className="text-xs text-foreground-muted">Perfect Days</span>
          </div>
          <span className="text-xl font-bold">{stats.perfectDays}</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-purple-500" />
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

      {/* 30 Day History */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-accent-primary" />
          Last 30 Days
        </h3>
        <div className="flex gap-1 flex-wrap">
          {streakHistory.map((day, i) => {
            const date = new Date(day.date)
            // Use IST timezone for today check
            const todayIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
            const todayDate = new Date(todayIST)
            const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
            const isToday = day.date === todayStr
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                  day.completed > 0
                    ? 'bg-accent-success/20 text-accent-success'
                    : 'bg-background text-foreground-muted'
                } ${isToday ? 'ring-2 ring-accent-primary' : ''}`}
                title={`${date.toLocaleDateString()}: ${day.completed} habits`}
              >
                {date.getDate()}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-foreground-muted">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-accent-success/20"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-background"></div>
            <span>Inactive</span>
          </div>
        </div>
      </div>

      {/* Streak Badges */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Flame size={20} className="text-orange-500" />
          Streak Badges
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                key={badge.days}
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
                  <div className="text-xs text-foreground-muted mb-2">{badge.days} Days</div>

                  {badge.claimed ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-accent-success">
                      <CheckCircle2 size={12} />
                      Claimed
                    </div>
                  ) : badge.unlocked ? (
                    <button
                      onClick={() => handleClaimBadge(badge.days, badge.coinReward, badge.xpReward)}
                      disabled={claiming === badge.days}
                      className="w-full py-1.5 px-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50"
                    >
                      {claiming === badge.days ? '...' : `+${badge.coinReward}`}
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

      {/* Streak Tips */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <h3 className="font-bold mb-4">🔥 Streak Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <span>1</span>
            </div>
            <div>
              <div className="font-semibold">Start Small</div>
              <div className="text-foreground-muted">Complete at least one habit daily to maintain your streak</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <span>2</span>
            </div>
            <div>
              <div className="font-semibold">Morning Routine</div>
              <div className="text-foreground-muted">Complete habits early to avoid missing days</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <span>3</span>
            </div>
            <div>
              <div className="font-semibold">Never Miss Twice</div>
              <div className="text-foreground-muted">If you miss a day, get back on track immediately</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <span>4</span>
            </div>
            <div>
              <div className="font-semibold">Aim for 1000 Days</div>
              <div className="text-foreground-muted">The ultimate Immortal badge awaits the most dedicated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DateManipulationBlocker>
  )
}
