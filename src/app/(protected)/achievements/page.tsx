'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Award, Zap, Target, Star, Crown, Flame, CheckCircle2, Lock, Coins, Gift } from 'lucide-react'
import { ACHIEVEMENTS, getClaimedAchievements, claimAchievement, updateUserStreak } from '@/lib/achievements'
import DateManipulationBlocker from '@/components/ui/DateManipulationBlocker'

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  color: string
  unlocked: boolean
  claimed: boolean
  progress: number
  target: number
  coinReward: number
  xpReward: number
  category: 'completion' | 'streak' | 'perfect' | 'milestone'
}

interface UserStats {
  totalCoins: number
  totalCompletions: number
  currentStreak: number
  longestStreak: number
  perfectDays: number
  xp: number
  level: number
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<UserStats>({
    totalCoins: 0,
    totalCompletions: 0,
    currentStreak: 0,
    longestStreak: 0,
    perfectDays: 0,
    xp: 0,
    level: 1
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const [claiming, setClaiming] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user rewards (coins, xp, level)
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('coins, xp, level')
        .eq('user_id', user.id)
        .single()

      // Fetch claimed achievements
      const claimedIds = await getClaimedAchievements(user.id)

      // Fetch habit logs
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })

      if (!logs) {
        setLoading(false)
        return
      }

      const totalCompletions = logs.length
      
      // Calculate streaks using IST timezone
      const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse()
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      
      // Import getLocalDateString for IST timezone
      const { getLocalDateString } = await import('@/lib/date-utils')
      
      const today = new Date()
      for (let i = 0; i < uniqueDates.length; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const checkDateStr = getLocalDateString(checkDate)
        
        if (uniqueDates.includes(checkDateStr)) {
          tempStreak++
          if (i === 0 || currentStreak > 0) currentStreak = tempStreak
          longestStreak = Math.max(longestStreak, tempStreak)
        } else if (i === 0) {
          break
        } else {
          tempStreak = 0
        }
      }

      // Save streak to database
      await updateUserStreak(user.id, currentStreak, longestStreak)

      // Calculate perfect days
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const habitCount = habits?.length || 1
      const dateCompletions = new Map<string, number>()
      
      logs.forEach(log => {
        dateCompletions.set(log.date, (dateCompletions.get(log.date) || 0) + 1)
      })
      
      const perfectDays = Array.from(dateCompletions.values()).filter(count => count >= habitCount).length

      setStats({
        totalCoins: rewards?.coins || 0,
        totalCompletions,
        currentStreak,
        longestStreak,
        perfectDays,
        xp: rewards?.xp || 0,
        level: rewards?.level || 1
      })

      // Map achievement definitions to UI with progress
      const iconMap: Record<string, any> = {
        // Completion
        first_step: CheckCircle2, early_bird: Target, getting_started: Target,
        consistent: Award, dedicated: Award, habit_master: Crown,
        champion: Trophy, legend: Trophy, titan: Crown, mythic_achiever: Star,
        transcendent: Zap, eternal: Crown,
        // Streak
        streak_starter: Flame, week_warrior: Flame, two_week_hero: Flame, 
        month_master: Flame, quarter_champion: Zap, half_year_hero: Trophy,
        year_legend: Crown, unstoppable: Flame, immortal_streak: Star,
        // Perfect
        perfect_start: Star, perfectionist: Star, flawless: Star, 
        perfect_month: Star, perfect_master: Star, perfect_century: Trophy,
        perfect_elite: Crown, perfect_legend: Zap, perfect_immortal: Crown
      }
      
      const colorMap: Record<string, string> = {
        // Completion colors
        first_step: 'text-green-500', early_bird: 'text-blue-500', getting_started: 'text-cyan-500',
        consistent: 'text-indigo-500', dedicated: 'text-purple-500', habit_master: 'text-yellow-500',
        titan: 'text-orange-500', mythic_achiever: 'text-pink-500', transcendent: 'text-red-500', eternal: 'text-amber-400',
        champion: 'text-orange-500', legend: 'text-red-500',
        // Streak colors
        streak_starter: 'text-orange-500', week_warrior: 'text-red-500', two_week_hero: 'text-pink-500', 
        month_master: 'text-purple-500', quarter_champion: 'text-yellow-500', half_year_hero: 'text-cyan-500',
        year_legend: 'text-amber-400', unstoppable: 'text-red-600', immortal_streak: 'text-pink-400',
        // Perfect colors
        perfect_start: 'text-cyan-500', perfectionist: 'text-blue-500', flawless: 'text-indigo-500', 
        perfect_month: 'text-purple-500', perfect_master: 'text-yellow-500', perfect_century: 'text-orange-500',
        perfect_elite: 'text-pink-500', perfect_legend: 'text-red-500', perfect_immortal: 'text-amber-400'
      }

      const achievementsList: Achievement[] = ACHIEVEMENTS.map(a => {
        let progress = 0
        let unlocked = false
        
        if (a.category === 'completion') {
          progress = Math.min(totalCompletions, a.target)
          unlocked = totalCompletions >= a.target
        } else if (a.category === 'streak') {
          const maxStreak = Math.max(currentStreak, longestStreak)
          progress = Math.min(maxStreak, a.target)
          unlocked = maxStreak >= a.target
        } else if (a.category === 'perfect') {
          progress = Math.min(perfectDays, a.target)
          unlocked = perfectDays >= a.target
        }

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          icon: iconMap[a.id] || Trophy,
          color: colorMap[a.id] || 'text-gray-500',
          unlocked,
          claimed: claimedIds.includes(a.id),
          progress,
          target: a.target,
          coinReward: a.coinReward,
          xpReward: a.xpReward,
          category: a.category
        }
      })

      setAchievements(achievementsList)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleClaimAchievement = async (achievementId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setClaiming(achievementId)
    
    const result = await claimAchievement(user.id, achievementId)
    
    if (result.success) {
      // Update local state
      setAchievements(prev => prev.map(a => 
        a.id === achievementId ? { ...a, claimed: true } : a
      ))
      setStats(prev => ({
        ...prev,
        totalCoins: prev.totalCoins + (result.coinsAwarded || 0),
        xp: prev.xp + (result.xpAwarded || 0)
      }))
    }
    
    setClaiming(null)
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const claimedCount = achievements.filter(a => a.claimed).length
  const unclaimedCount = achievements.filter(a => a.unlocked && !a.claimed).length
  const totalCoinsEarned = achievements.filter(a => a.claimed).reduce((sum, a) => sum + a.coinReward, 0)

  const categories = [
    { id: 'completion', label: 'Completion', icon: Target, color: 'text-blue-500' },
    { id: 'streak', label: 'Streaks', icon: Flame, color: 'text-orange-500' },
    { id: 'perfect', label: 'Perfect Days', icon: Star, color: 'text-yellow-500' },
  ]

  return (
    <DateManipulationBlocker>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Achievements & Rewards</h1>
        <p className="text-foreground-muted">Complete challenges and earn coins</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-surface/50 p-5 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-lg animate-pulse" />
                  <div>
                    <div className="h-7 w-16 bg-background rounded animate-pulse mb-1" />
                    <div className="h-3 w-20 bg-background/50 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Category Tabs Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-28 bg-surface rounded-lg animate-pulse flex-shrink-0" />
            ))}
          </div>
          
          {/* Achievements Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-surface/50 p-5 rounded-xl border border-border-subtle">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-background rounded-xl animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-background rounded animate-pulse mb-2" />
                    <div className="h-3 w-full bg-background/50 rounded animate-pulse mb-3" />
                    {/* Progress bar */}
                    <div className="h-2 bg-background rounded-full animate-pulse mb-2" />
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-background/50 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-background/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-5 rounded-xl border border-yellow-500/30">
              <div className="flex items-center gap-3">
                <Coins size={28} className="text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalCoins}</div>
                  <div className="text-xs text-foreground-muted">Total Coins</div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-3">
                <Trophy size={28} className="text-accent-primary" />
                <div>
                  <div className="text-2xl font-bold">{claimedCount}/{achievements.length}</div>
                  <div className="text-xs text-foreground-muted">
                    Claimed {unclaimedCount > 0 && <span className="text-yellow-500">({unclaimedCount} to claim!)</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-3">
                <Flame size={28} className="text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.currentStreak}</div>
                  <div className="text-xs text-foreground-muted">Current Streak</div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-3">
                <Star size={28} className="text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.perfectDays}</div>
                  <div className="text-xs text-foreground-muted">Perfect Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements by Category */}
          {categories.map(category => {
            const categoryAchievements = achievements.filter(a => a.category === category.id)
            const CategoryIcon = category.icon
            
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon size={20} className={category.color} />
                  <h2 className="text-xl font-bold">{category.label}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAchievements.map((achievement, index) => {
                    const Icon = achievement.icon
                    // Find the index of the first locked achievement in this category
                    const firstLockedIndex = categoryAchievements.findIndex(a => !a.unlocked)
                    const nearCurrentIndex = firstLockedIndex === -1 ? categoryAchievements.length - 1 : firstLockedIndex
                    // Show clearly: unlocked achievements + next 2 locked achievements
                    const isNearCurrent = achievement.unlocked || index <= nearCurrentIndex + 1
                    const shouldBlur = !isNearCurrent
                    
                    return (
                      <div
                        key={achievement.id}
                        className={`relative p-5 rounded-xl border-2 transition-all ${
                          achievement.unlocked
                            ? 'bg-surface border-accent-success/50'
                            : 'bg-surface border-border-subtle'
                        } ${shouldBlur ? 'blur-sm' : ''}`}
                      >
                        {!achievement.unlocked && (
                          <div className="absolute top-4 right-4">
                            <Lock size={18} className="text-foreground-muted" />
                          </div>
                        )}

                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-accent-success/10' : 'bg-background'}`}>
                            <Icon size={24} className={achievement.unlocked ? achievement.color : 'text-foreground-muted'} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-sm mb-1">{achievement.title}</h3>
                            <p className="text-xs text-foreground-muted">{achievement.description}</p>
                          </div>
                        </div>

                        {achievement.claimed ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-accent-success">
                              <CheckCircle2 size={14} />
                              Claimed
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-yellow-500">
                              <span className="flex items-center gap-1"><Coins size={14} />+{achievement.coinReward}</span>
                              <span className="text-purple-400">+{achievement.xpReward} XP</span>
                            </div>
                          </div>
                        ) : achievement.unlocked ? (
                          <button
                            onClick={() => handleClaimAchievement(achievement.id)}
                            disabled={claiming === achievement.id}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50"
                          >
                            {claiming === achievement.id ? (
                              'Claiming...'
                            ) : (
                              <>
                                <Gift size={16} />
                                Claim +{achievement.coinReward} coins & +{achievement.xpReward} XP
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-foreground-muted">Progress</span>
                              <span className="font-semibold">{achievement.progress}/{achievement.target}</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent-primary transition-all"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2 text-xs text-foreground-muted">
                              <span className="flex items-center gap-1"><Coins size={12} />{achievement.coinReward}</span>
                              <span>+{achievement.xpReward} XP</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
    </DateManipulationBlocker>
  )
}
