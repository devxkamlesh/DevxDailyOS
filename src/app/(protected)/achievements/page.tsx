'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Award, Zap, Target, Star, Crown, Flame, TrendingUp, Calendar, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  color: string
  gradient: string
  unlocked: boolean
  progress: number
  target: number
  xpReward: number
}

interface UserStats {
  level: number
  xp: number
  xpToNextLevel: number
  totalCompletions: number
  currentStreak: number
  longestStreak: number
  perfectDays: number
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalCompletions: 0,
    currentStreak: 0,
    longestStreak: 0,
    perfectDays: 0
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      await fetchGamificationData()
      if (mounted) setLoading(false)
    }
    
    loadData()
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  const fetchGamificationData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      // Fetch all habit logs
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })

      if (logsError) {
        console.error('Error fetching logs:', logsError)
        setLoading(false)
        return
      }

      if (!logs) {
        setLoading(false)
        return
      }

      const totalCompletions = logs.length
      
      // Calculate streaks
      const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse()
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      
      const today = new Date()
      for (let i = 0; i < uniqueDates.length; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const checkDateStr = checkDate.toISOString().split('T')[0]
        
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

      // Calculate perfect days
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (habitsError) {
        console.error('Error fetching habits:', habitsError)
      }

      const habitCount = habits?.length || 1
      const dateCompletions = new Map<string, number>()
      
      logs.forEach(log => {
        dateCompletions.set(log.date, (dateCompletions.get(log.date) || 0) + 1)
      })
      
      const perfectDays = Array.from(dateCompletions.values()).filter(count => count >= habitCount).length

      // Calculate level and XP
      const xp = totalCompletions * 10 + currentStreak * 50 + perfectDays * 100
      const level = Math.floor(xp / 100) + 1
      const xpToNextLevel = (level * 100) - xp

      setStats({
        level,
        xp,
        xpToNextLevel,
        totalCompletions,
        currentStreak,
        longestStreak,
        perfectDays
      })

      // Define achievements
      const achievementsList: Achievement[] = [
        {
          id: 'first_step',
          title: 'First Step',
          description: 'Complete your first habit',
          icon: CheckCircle2,
          color: 'text-green-500',
          gradient: '',
          unlocked: totalCompletions >= 1,
          progress: Math.min(totalCompletions, 1),
          target: 1,
          xpReward: 50
        },
        {
          id: 'early_bird',
          title: 'Early Bird',
          description: 'Complete 5 habits',
          icon: Target,
          color: 'text-blue-500',
          gradient: '',
          unlocked: totalCompletions >= 5,
          progress: Math.min(totalCompletions, 5),
          target: 5,
          xpReward: 75
        },
        {
          id: 'getting_started',
          title: 'Getting Started',
          description: 'Complete 10 habits',
          icon: Target,
          color: 'text-cyan-500',
          gradient: '',
          unlocked: totalCompletions >= 10,
          progress: Math.min(totalCompletions, 10),
          target: 10,
          xpReward: 100
        },
        {
          id: 'consistent',
          title: 'Consistent',
          description: 'Complete 25 habits',
          icon: Award,
          color: 'text-indigo-500',
          gradient: '',
          unlocked: totalCompletions >= 25,
          progress: Math.min(totalCompletions, 25),
          target: 25,
          xpReward: 150
        },
        {
          id: 'dedicated',
          title: 'Dedicated',
          description: 'Complete 50 habits',
          icon: Award,
          color: 'text-purple-500',
          gradient: '',
          unlocked: totalCompletions >= 50,
          progress: Math.min(totalCompletions, 50),
          target: 50,
          xpReward: 250
        },
        {
          id: 'habit_master',
          title: 'Habit Master',
          description: 'Complete 100 habits',
          icon: Crown,
          color: 'text-yellow-500',
          gradient: '',
          unlocked: totalCompletions >= 100,
          progress: Math.min(totalCompletions, 100),
          target: 100,
          xpReward: 500
        },
        {
          id: 'champion',
          title: 'Champion',
          description: 'Complete 250 habits',
          icon: Trophy,
          color: 'text-orange-500',
          gradient: '',
          unlocked: totalCompletions >= 250,
          progress: Math.min(totalCompletions, 250),
          target: 250,
          xpReward: 1000
        },
        {
          id: 'legend',
          title: 'Legend',
          description: 'Complete 500 habits',
          icon: Trophy,
          color: 'text-red-500',
          gradient: '',
          unlocked: totalCompletions >= 500,
          progress: Math.min(totalCompletions, 500),
          target: 500,
          xpReward: 2000
        },
        {
          id: 'streak_starter',
          title: 'Streak Starter',
          description: '3 day streak',
          icon: Flame,
          color: 'text-orange-500',
          gradient: '',
          unlocked: currentStreak >= 3,
          progress: Math.min(currentStreak, 3),
          target: 3,
          xpReward: 100
        },
        {
          id: 'week_warrior',
          title: 'Week Warrior',
          description: '7 day streak',
          icon: Flame,
          color: 'text-red-500',
          gradient: '',
          unlocked: currentStreak >= 7,
          progress: Math.min(currentStreak, 7),
          target: 7,
          xpReward: 200
        },
        {
          id: 'two_week_hero',
          title: 'Two Week Hero',
          description: '14 day streak',
          icon: Flame,
          color: 'text-pink-500',
          gradient: '',
          unlocked: currentStreak >= 14,
          progress: Math.min(currentStreak, 14),
          target: 14,
          xpReward: 400
        },
        {
          id: 'month_master',
          title: 'Month Master',
          description: '30 day streak',
          icon: Calendar,
          color: 'text-purple-500',
          gradient: '',
          unlocked: currentStreak >= 30,
          progress: Math.min(currentStreak, 30),
          target: 30,
          xpReward: 1000
        },
        {
          id: 'quarter_champion',
          title: 'Quarter Champion',
          description: '90 day streak',
          icon: Zap,
          color: 'text-yellow-500',
          gradient: '',
          unlocked: longestStreak >= 90,
          progress: Math.min(longestStreak, 90),
          target: 90,
          xpReward: 3000
        },
        {
          id: 'unstoppable',
          title: 'Unstoppable',
          description: '100 day streak',
          icon: Zap,
          color: 'text-amber-500',
          gradient: '',
          unlocked: longestStreak >= 100,
          progress: Math.min(longestStreak, 100),
          target: 100,
          xpReward: 5000
        },
        {
          id: 'perfect_start',
          title: 'Perfect Start',
          description: '3 perfect days',
          icon: Star,
          color: 'text-cyan-500',
          gradient: '',
          unlocked: perfectDays >= 3,
          progress: Math.min(perfectDays, 3),
          target: 3,
          xpReward: 200
        },
        {
          id: 'perfectionist',
          title: 'Perfectionist',
          description: '10 perfect days',
          icon: Star,
          color: 'text-blue-500',
          gradient: '',
          unlocked: perfectDays >= 10,
          progress: Math.min(perfectDays, 10),
          target: 10,
          xpReward: 500
        },
        {
          id: 'flawless',
          title: 'Flawless',
          description: '25 perfect days',
          icon: Star,
          color: 'text-indigo-500',
          gradient: '',
          unlocked: perfectDays >= 25,
          progress: Math.min(perfectDays, 25),
          target: 25,
          xpReward: 1500
        },
        {
          id: 'rising_star',
          title: 'Rising Star',
          description: 'Reach level 5',
          icon: TrendingUp,
          color: 'text-green-500',
          gradient: '',
          unlocked: level >= 5,
          progress: Math.min(level, 5),
          target: 5,
          xpReward: 300
        },
        {
          id: 'overachiever',
          title: 'Overachiever',
          description: 'Reach level 10',
          icon: TrendingUp,
          color: 'text-blue-500',
          gradient: '',
          unlocked: level >= 10,
          progress: Math.min(level, 10),
          target: 10,
          xpReward: 1000
        },
        {
          id: 'elite',
          title: 'Elite',
          description: 'Reach level 25',
          icon: Crown,
          color: 'text-purple-500',
          gradient: '',
        unlocked: level >= 25,
        progress: Math.min(level, 25),
          target: 25,
          xpReward: 2500
        },
        {
          id: 'master',
          title: 'Master',
          description: 'Reach level 50',
          icon: Crown,
          color: 'text-yellow-500',
          gradient: '',
          unlocked: level >= 50,
          progress: Math.min(level, 50),
          target: 50,
          xpReward: 5000
        },
        {
          id: 'grandmaster',
          title: 'Grandmaster',
          description: 'Reach level 100',
          icon: Crown,
          color: 'text-orange-500',
          gradient: '',
          unlocked: level >= 100,
          progress: Math.min(level, 100),
          target: 100,
          xpReward: 10000
        },
        {
          id: 'titan',
          title: 'Titan',
          description: 'Complete 1000 habits',
          icon: Trophy,
          color: 'text-purple-500',
          gradient: '',
          unlocked: totalCompletions >= 1000,
          progress: Math.min(totalCompletions, 1000),
          target: 1000,
          xpReward: 5000
        },
        {
          id: 'immortal',
          title: 'Immortal',
          description: 'Complete 2500 habits',
          icon: Trophy,
          color: 'text-pink-500',
          gradient: '',
          unlocked: totalCompletions >= 2500,
          progress: Math.min(totalCompletions, 2500),
          target: 2500,
          xpReward: 15000
        },
        {
          id: 'half_year_streak',
          title: 'Half Year Hero',
          description: '180 day streak',
          icon: Flame,
          color: 'text-orange-500',
          gradient: '',
          unlocked: longestStreak >= 180,
          progress: Math.min(longestStreak, 180),
          target: 180,
          xpReward: 8000
        },
        {
          id: 'year_warrior',
          title: 'Year Warrior',
          description: '365 day streak',
          icon: Flame,
          color: 'text-red-500',
          gradient: '',
          unlocked: longestStreak >= 365,
          progress: Math.min(longestStreak, 365),
          target: 365,
          xpReward: 20000
        },
        {
          id: 'perfect_month',
          title: 'Perfect Month',
          description: '30 perfect days',
          icon: Star,
          color: 'text-purple-500',
          gradient: '',
          unlocked: perfectDays >= 30,
          progress: Math.min(perfectDays, 30),
          target: 30,
          xpReward: 3000
        },
        {
          id: 'perfect_quarter',
          title: 'Perfect Quarter',
          description: '90 perfect days',
          icon: Star,
          color: 'text-pink-500',
          gradient: '',
          unlocked: perfectDays >= 90,
          progress: Math.min(perfectDays, 90),
          target: 90,
          xpReward: 10000
        },
        {
          id: 'perfect_year',
          title: 'Perfect Year',
          description: '365 perfect days',
          icon: Star,
          color: 'text-yellow-500',
          gradient: '',
          unlocked: perfectDays >= 365,
          progress: Math.min(perfectDays, 365),
          target: 365,
          xpReward: 50000
        },
        {
          id: 'centurion',
          title: 'Centurion',
          description: '100 habits in a single day',
          icon: Zap,
          color: 'text-cyan-500',
          gradient: '',
          unlocked: false, // This would need special tracking
          progress: 0,
          target: 100,
          xpReward: 5000
        },
        {
          id: 'marathon_runner',
          title: 'Marathon Runner',
          description: '500 day longest streak',
          icon: Flame,
          color: 'text-purple-500',
          gradient: '',
          unlocked: longestStreak >= 500,
          progress: Math.min(longestStreak, 500),
          target: 500,
          xpReward: 30000
        },
        {
          id: 'ultimate_legend',
          title: 'Ultimate Legend',
          description: 'Complete 5000 habits',
          icon: Trophy,
          color: 'text-yellow-500',
          gradient: '',
          unlocked: totalCompletions >= 5000,
          progress: Math.min(totalCompletions, 5000),
          target: 5000,
          xpReward: 50000
        },
        {
          id: 'god_mode',
          title: 'God Mode',
          description: 'Complete 10000 habits',
          icon: Crown,
          color: 'text-red-500',
          gradient: '',
          unlocked: totalCompletions >= 10000,
          progress: Math.min(totalCompletions, 10000),
          target: 10000,
          xpReward: 100000
        }
      ]

      setAchievements(achievementsList)
    } catch (error) {
      console.error('Error in fetchGamificationData:', error)
    }
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const progressPercentage = (stats.xp / (stats.level * 100)) * 100
  const totalXpEarned = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Achievements & Rewards</h1>
          <p className="text-foreground-muted">Track your progress and unlock rewards</p>
        </div>
        <Link 
          href="/habits"
          className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition text-sm"
        >
          Back to Habits
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-2xl border border-border-subtle animate-pulse">
              <div className="h-32 bg-background rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Level & Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Level Card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Crown size={32} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">Level {stats.level}</div>
                  <div className="text-sm text-foreground-muted">{stats.xp} XP</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Next Level</span>
                  <span className="font-semibold text-purple-400">{stats.xpToNextLevel} XP</span>
                </div>
                <div className="relative h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Achievements Progress */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-2xl border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Trophy size={32} className="text-yellow-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{unlockedCount}/{achievements.length}</div>
                  <div className="text-sm text-foreground-muted">Unlocked</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Completion</span>
                  <span className="font-semibold text-yellow-400">{Math.round((unlockedCount / achievements.length) * 100)}%</span>
                </div>
                <div className="relative h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total XP Earned */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-2xl border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Zap size={32} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalXpEarned}</div>
                  <div className="text-sm text-foreground-muted">XP from Achievements</div>
                </div>
              </div>
              <div className="text-sm text-foreground-muted">
                Keep unlocking achievements to earn more XP and level up faster!
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <div className="text-2xl font-bold text-accent-success">{stats.totalCompletions}</div>
              <div className="text-xs text-foreground-muted">Total Completions</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.currentStreak}</div>
              <div className="text-xs text-foreground-muted">Current Streak</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.longestStreak}</div>
              <div className="text-xs text-foreground-muted">Longest Streak</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.perfectDays}</div>
              <div className="text-xs text-foreground-muted">Perfect Days</div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div>
            <h2 className="text-xl font-bold mb-4">All Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(achievement => {
                const Icon = achievement.icon
                return (
                  <div
                    key={achievement.id}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      achievement.unlocked
                        ? 'bg-surface border-accent-success shadow-md'
                        : 'bg-surface border-border-subtle'
                    }`}
                  >
                    {/* Lock Overlay for Locked Achievements */}
                    {!achievement.unlocked && (
                      <div className="absolute top-4 right-4">
                        <Lock size={20} className="text-foreground-muted" />
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg ${achievement.unlocked ? 'bg-accent-success/10' : 'bg-background'}`}>
                        <Icon size={32} className={achievement.unlocked ? achievement.color : 'text-foreground-muted'} strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base mb-1">{achievement.title}</h3>
                        <p className="text-sm text-foreground-muted">{achievement.description}</p>
                      </div>
                    </div>

                    {/* Progress or Unlocked Status */}
                    {achievement.unlocked ? (
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 text-sm font-semibold ${achievement.color}`}>
                          <CheckCircle2 size={16} />
                          Unlocked!
                        </div>
                        <div className="text-sm font-semibold text-yellow-400">
                          +{achievement.xpReward} XP
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-muted">Progress</span>
                          <span className="font-semibold">{achievement.progress} / {achievement.target}</span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent-primary transition-all duration-300"
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-foreground-muted text-right">
                          Reward: +{achievement.xpReward} XP
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* How to Earn XP */}
          <div className="bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 p-6 rounded-2xl border border-accent-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Award size={24} className="text-accent-primary" />
              <h3 className="text-lg font-semibold">How to Earn XP</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface/50 p-4 rounded-xl">
                <div className="text-2xl font-bold text-accent-success mb-1">+10 XP</div>
                <div className="text-sm text-foreground-muted">Per habit completed</div>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl">
                <div className="text-2xl font-bold text-orange-400 mb-1">+50 XP</div>
                <div className="text-sm text-foreground-muted">Per day in streak</div>
              </div>
              <div className="bg-surface/50 p-4 rounded-xl">
                <div className="text-2xl font-bold text-yellow-400 mb-1">+100 XP</div>
                <div className="text-sm text-foreground-muted">Per perfect day</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
