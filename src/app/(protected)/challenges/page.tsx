'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Calendar, Target, Coins, Zap, Users } from 'lucide-react'
import { toast } from 'sonner'

interface WeeklyChallenge {
  id: string
  title: string
  description: string
  target_type: 'completions' | 'streak' | 'perfect_days'
  target_value: number
  coin_reward: number
  xp_reward: number
  week_start: string
  week_end: string
  is_active: boolean
}

interface UserProgress {
  challenge_id: string
  progress: number
  completed: boolean
  claimed: boolean
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([])
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      // Get active weekly challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('is_active', true)
        .order('week_start', { ascending: false })

      if (challengesError) throw challengesError

      // Get user progress for these challenges
      const { data: { user } } = await supabase.auth.getUser()
      if (user && challengesData) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('challenge_id', challengesData.map(c => c.id))

        if (progressError) throw progressError

        const progressMap = progressData?.reduce((acc, p) => {
          acc[p.challenge_id] = p
          return acc
        }, {} as Record<string, UserProgress>) || {}

        setUserProgress(progressMap)
      }

      setChallenges(challengesData || [])
    } catch (error) {
      console.error('Error fetching challenges:', error)
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  const claimReward = async (challengeId: string, coinReward: number, xpReward: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current version for optimistic locking
      const { data: currentRewards } = await supabase
        .from('user_rewards')
        .select('version')
        .eq('user_id', user.id)
        .single()

      // Mark as claimed
      const { error: claimError } = await supabase
        .from('user_challenge_progress')
        .update({ claimed: true })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)

      if (claimError) throw claimError

      // Add rewards using RPC function for safe updates with proper version
      const { data: rewardResult, error: rewardError } = await supabase.rpc('update_user_rewards_safe', {
        p_user_id: user.id,
        p_expected_version: currentRewards?.version || 0,
        p_coins_delta: coinReward,
        p_xp_delta: xpReward
      })

      if (rewardError) throw rewardError
      
      // Check if the update was successful
      if (rewardResult && !rewardResult.success) {
        throw new Error(rewardResult.message || 'Failed to claim reward')
      }

      // Record the claim
      const challenge = challenges.find(c => c.id === challengeId)
      if (challenge) {
        await supabase
          .from('weekly_challenge_claims')
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            week_start: challenge.week_start,
            coins_awarded: coinReward,
            xp_awarded: xpReward
          })
      }

      toast.success(`Claimed ${coinReward} coins and ${xpReward} XP!`)
      fetchChallenges() // Refresh data
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast.error('Failed to claim reward')
    }
  }

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100)
  }

  const getTargetTypeIcon = (type: string) => {
    switch (type) {
      case 'completions': return <Target className="h-4 w-4" />
      case 'streak': return <Zap className="h-4 w-4" />
      case 'perfect_days': return <Trophy className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'completions': return 'Completions'
      case 'streak': return 'Day Streak'
      case 'perfect_days': return 'Perfect Days'
      default: return 'Target'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Weekly Challenges</h1>
        <p className="text-muted-foreground">
          Complete weekly challenges to earn extra coins and XP!
        </p>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
            <p className="text-muted-foreground text-center">
              Check back later for new weekly challenges!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => {
            const progress = userProgress[challenge.id]
            const progressPercentage = progress 
              ? getProgressPercentage(progress.progress, challenge.target_value)
              : 0
            const isCompleted = progress?.completed || false
            const isClaimed = progress?.claimed || false

            return (
              <Card key={challenge.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      {getTargetTypeIcon(challenge.target_type)}
                    </div>
                  </div>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Challenge Period */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(challenge.week_start).toLocaleDateString()} - {' '}
                      {new Date(challenge.week_end).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Target */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Target: {challenge.target_value} {getTargetTypeLabel(challenge.target_type)}
                    </span>
                    <Badge variant={isCompleted ? "default" : "secondary"}>
                      {progress?.progress || 0} / {challenge.target_value}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={progressPercentage} className="h-2" />

                  {/* Rewards */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span>{challenge.coin_reward}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span>{challenge.xp_reward}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isCompleted && !isClaimed && (
                    <Button 
                      onClick={() => claimReward(challenge.id, challenge.coin_reward, challenge.xp_reward)}
                      className="w-full"
                    >
                      Claim Reward
                    </Button>
                  )}
                  
                  {isClaimed && (
                    <Button variant="outline" disabled className="w-full">
                      Reward Claimed ✓
                    </Button>
                  )}
                  
                  {!isCompleted && (
                    <Button variant="outline" disabled className="w-full">
                      {progressPercentage > 0 ? 'In Progress...' : 'Not Started'}
                    </Button>
                  )}
                </CardContent>

                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}