'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Award, Zap, Target, Star, Crown, Flame, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  color: string
  unlocked: boolean
  progress: number
  target: number
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

export default function Gamification() {
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
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchGamificationData()
  }, [])

  const fetchGamificationData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch all habit logs
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('date', { ascending: false })

    if (!logs) return

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

    // Calculate perfect days (all habits completed)
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
        color: 'text-green-400',
        unlocked: totalCompletions >= 1,
        progress: Math.min(totalCompletions, 1),
        target: 1
      },
      {
        id: 'getting_started',
        title: 'Getting Started',
        description: 'Complete 10 habits',
        icon: Target,
        color: 'text-blue-400',
        unlocked: totalCompletions >= 10,
        progress: Math.min(totalCompletions, 10),
        target: 10
      },
      {
        id: 'habit_master',
        title: 'Habit Master',
        description: 'Complete 100 habits',
        icon: Crown,
        color: 'text-yellow-400',
        unlocked: totalCompletions >= 100,
        progress: Math.min(totalCompletions, 100),
        target: 100
      },
      {
        id: 'legend',
        title: 'Legend',
        description: 'Complete 500 habits',
        icon: Trophy,
        color: 'text-purple-400',
        unlocked: totalCompletions >= 500,
        progress: Math.min(totalCompletions, 500),
        target: 500
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: '7 day streak',
        icon: Flame,
        color: 'text-orange-400',
        unlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        target: 7
      },
      {
        id: 'month_master',
        title: 'Month Master',
        description: '30 day streak',
        icon: Calendar,
        color: 'text-red-400',
        unlocked: currentStreak >= 30,
        progress: Math.min(currentStreak, 30),
        target: 30
      },
      {
        id: 'unstoppable',
        title: 'Unstoppable',
        description: '100 day streak',
        icon: Zap,
        color: 'text-yellow-500',
        unlocked: longestStreak >= 100,
        progress: Math.min(longestStreak, 100),
        target: 100
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: '10 perfect days',
        icon: Star,
        color: 'text-cyan-400',
        unlocked: perfectDays >= 10,
        progress: Math.min(perfectDays, 10),
        target: 10
      },
      {
        id: 'overachiever',
        title: 'Overachiever',
        description: 'Reach level 10',
        icon: TrendingUp,
        color: 'text-pink-400',
        unlocked: level >= 10,
        progress: Math.min(level, 10),
        target: 10
      }
    ]

    setAchievements(achievementsList)

    // Check for new achievements and celebrate
    const newlyUnlocked = achievementsList.filter(a => 
      a.unlocked && a.progress === a.target
    )
    
    if (newlyUnlocked.length > 0) {
      const achievement = newlyUnlocked[0]
      setCelebrationMessage(`🎉 Achievement Unlocked: ${achievement.title}!`)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 5000)
    }
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const progressPercentage = (stats.xp / (stats.level * 100)) * 100

  return (
    <div className="space-y-6">
      {/* Celebration Toast */}
      {showCelebration && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce">
          <p className="font-bold text-lg">{celebrationMessage}</p>
        </div>
      )}

      {/* Level & XP Card */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Crown size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Level {stats.level}</h3>
              <p className="text-sm text-foreground-muted">{stats.xp} XP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground-muted">Next Level</p>
            <p className="text-lg font-bold text-purple-400">{stats.xpToNextLevel} XP</p>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="relative h-3 bg-background rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-foreground-muted mt-2 text-center">
          Complete habits to earn XP and level up!
        </p>
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

      {/* Achievements */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            <h3 className="text-lg font-semibold">Achievements</h3>
          </div>
          <span className="text-sm text-foreground-muted">
            {unlockedCount} / {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                    : 'bg-background border-border-subtle opacity-60'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-yellow-500/20' : 'bg-surface'}`}>
                    <Icon size={20} className={achievement.unlocked ? achievement.color : 'text-foreground-muted'} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                    <p className="text-xs text-foreground-muted">{achievement.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-foreground-muted">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.target}</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-primary transition-all duration-300"
                        style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {achievement.unlocked && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                    <CheckCircle2 size={14} />
                    Unlocked!
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rewards Info */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-2xl border border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Award size={24} className="text-blue-400" />
          <h3 className="text-lg font-semibold">How to Earn Rewards</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="font-semibold text-accent-success mb-1">+10 XP</div>
            <div className="text-foreground-muted">Per habit completed</div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="font-semibold text-orange-400 mb-1">+50 XP</div>
            <div className="text-foreground-muted">Per day in streak</div>
          </div>
          <div className="bg-surface/50 p-3 rounded-lg">
            <div className="font-semibold text-yellow-400 mb-1">+100 XP</div>
            <div className="text-foreground-muted">Per perfect day</div>
          </div>
        </div>
      </div>
    </div>
  )
}
