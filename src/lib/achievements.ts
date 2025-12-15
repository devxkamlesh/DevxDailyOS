import { createClient } from '@/lib/supabase/client'
import { awardAchievementXP } from '@/lib/xp'

/**
 * Achievement System - Persistent Storage & Rewards
 */

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  category: 'completion' | 'streak' | 'perfect' | 'milestone'
  target: number
  coinReward: number
  xpReward: number
}

// All achievement definitions - Enhanced with harder targets
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Completion Achievements (Easy to Legendary)
  { id: 'first_step', title: 'First Step', description: 'Complete your first habit', category: 'completion', target: 1, coinReward: 10, xpReward: 25 },
  { id: 'early_bird', title: 'Early Bird', description: 'Complete 5 habits', category: 'completion', target: 5, coinReward: 15, xpReward: 25 },
  { id: 'getting_started', title: 'Getting Started', description: 'Complete 10 habits', category: 'completion', target: 10, coinReward: 20, xpReward: 25 },
  { id: 'consistent', title: 'Consistent', description: 'Complete 25 habits', category: 'completion', target: 25, coinReward: 30, xpReward: 50 },
  { id: 'dedicated', title: 'Dedicated', description: 'Complete 50 habits', category: 'completion', target: 50, coinReward: 50, xpReward: 75 },
  { id: 'habit_master', title: 'Habit Master', description: 'Complete 100 habits', category: 'completion', target: 100, coinReward: 75, xpReward: 100 },
  { id: 'champion', title: 'Champion', description: 'Complete 250 habits', category: 'completion', target: 250, coinReward: 100, xpReward: 150 },
  { id: 'legend', title: 'Legend', description: 'Complete 500 habits', category: 'completion', target: 500, coinReward: 150, xpReward: 200 },
  // HARD: New completion achievements
  { id: 'titan', title: 'Titan', description: 'Complete 1,000 habits', category: 'completion', target: 1000, coinReward: 300, xpReward: 500 },
  { id: 'mythic_achiever', title: 'Mythic Achiever', description: 'Complete 2,500 habits', category: 'completion', target: 2500, coinReward: 500, xpReward: 1000 },
  { id: 'transcendent', title: 'Transcendent', description: 'Complete 5,000 habits', category: 'completion', target: 5000, coinReward: 1000, xpReward: 2000 },
  { id: 'eternal', title: 'Eternal', description: 'Complete 10,000 habits', category: 'completion', target: 10000, coinReward: 2000, xpReward: 5000 },
  
  // Streak Achievements (Easy to Legendary)
  { id: 'streak_starter', title: 'Streak Starter', description: '3 day streak', category: 'streak', target: 3, coinReward: 15, xpReward: 25 },
  { id: 'week_warrior', title: 'Week Warrior', description: '7 day streak', category: 'streak', target: 7, coinReward: 25, xpReward: 50 },
  { id: 'two_week_hero', title: 'Two Week Hero', description: '14 day streak', category: 'streak', target: 14, coinReward: 40, xpReward: 75 },
  { id: 'month_master', title: 'Month Master', description: '30 day streak', category: 'streak', target: 30, coinReward: 75, xpReward: 100 },
  { id: 'quarter_champion', title: 'Quarter Champion', description: '90 day streak', category: 'streak', target: 90, coinReward: 150, xpReward: 200 },
  // HARD: New streak achievements
  { id: 'half_year_hero', title: 'Half Year Hero', description: '180 day streak', category: 'streak', target: 180, coinReward: 300, xpReward: 500 },
  { id: 'year_legend', title: 'Year Legend', description: '365 day streak', category: 'streak', target: 365, coinReward: 500, xpReward: 1000 },
  { id: 'unstoppable', title: 'Unstoppable', description: '500 day streak', category: 'streak', target: 500, coinReward: 750, xpReward: 1500 },
  { id: 'immortal_streak', title: 'Immortal', description: '1,000 day streak', category: 'streak', target: 1000, coinReward: 2000, xpReward: 5000 },
  
  // Perfect Day Achievements (Easy to Legendary)
  { id: 'perfect_start', title: 'Perfect Start', description: '3 perfect days', category: 'perfect', target: 3, coinReward: 20, xpReward: 25 },
  { id: 'perfectionist', title: 'Perfectionist', description: '10 perfect days', category: 'perfect', target: 10, coinReward: 40, xpReward: 50 },
  { id: 'flawless', title: 'Flawless', description: '25 perfect days', category: 'perfect', target: 25, coinReward: 75, xpReward: 100 },
  { id: 'perfect_month', title: 'Perfect Month', description: '30 perfect days', category: 'perfect', target: 30, coinReward: 100, xpReward: 125 },
  { id: 'perfect_master', title: 'Perfect Master', description: '50 perfect days', category: 'perfect', target: 50, coinReward: 150, xpReward: 200 },
  // HARD: New perfect day achievements
  { id: 'perfect_century', title: 'Perfect Century', description: '100 perfect days', category: 'perfect', target: 100, coinReward: 300, xpReward: 500 },
  { id: 'perfect_elite', title: 'Perfect Elite', description: '200 perfect days', category: 'perfect', target: 200, coinReward: 500, xpReward: 1000 },
  { id: 'perfect_legend', title: 'Perfect Legend', description: '365 perfect days', category: 'perfect', target: 365, coinReward: 1000, xpReward: 2000 },
  { id: 'perfect_immortal', title: 'Perfect Immortal', description: '500 perfect days', category: 'perfect', target: 500, coinReward: 2000, xpReward: 5000 },
]

interface ClaimResult {
  success: boolean
  message: string
  coinsAwarded?: number
  xpAwarded?: number
}

/**
 * Check if an achievement is already claimed
 */
export async function isAchievementClaimed(userId: string, achievementId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single()
  
  return !!data
}

/**
 * Get all claimed achievements for a user
 */
export async function getClaimedAchievements(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  
  return data?.map(a => a.achievement_id) || []
}

/**
 * Claim an achievement and award coins + XP
 */
export async function claimAchievement(
  userId: string,
  achievementId: string
): Promise<ClaimResult> {
  try {
    const supabase = createClient()
    
    // Find the achievement definition
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement) {
      return { success: false, message: 'Achievement not found' }
    }

    // Check if already claimed
    const alreadyClaimed = await isAchievementClaimed(userId, achievementId)
    if (alreadyClaimed) {
      return { success: false, message: 'Achievement already claimed' }
    }

    // Insert achievement record (minimal columns for compatibility)
    const { error: insertError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId
      })

    if (insertError) {
      console.error('Error inserting achievement:', insertError.message, insertError.code, insertError.details)
      if (insertError.code === '42P01') {
        return { success: false, message: 'Please run supabase-achievements-migration.sql first' }
      }
      return { success: false, message: `Failed to record achievement: ${insertError.message}` }
    }

    // Get current rewards
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('coins, xp')
      .eq('user_id', userId)
      .single()

    const currentCoins = rewards?.coins || 0
    const currentXP = rewards?.xp || 0

    // Update coins and XP
    const { error: updateError } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        coins: currentCoins + achievement.coinReward,
        xp: currentXP + achievement.xpReward
      }, { onConflict: 'user_id' })

    if (updateError) {
      // Rollback achievement insert
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
      
      console.error('Error updating rewards:', updateError)
      return { success: false, message: 'Failed to award rewards' }
    }

    return {
      success: true,
      message: `Achievement unlocked! +${achievement.coinReward} coins, +${achievement.xpReward} XP`,
      coinsAwarded: achievement.coinReward,
      xpAwarded: achievement.xpReward
    }
  } catch (error) {
    console.error('Error claiming achievement:', error)
    return { success: false, message: 'Unexpected error occurred' }
  }
}

/**
 * Auto-claim all eligible achievements based on current stats
 */
export async function autoClaimAchievements(
  userId: string,
  stats: { totalCompletions: number; currentStreak: number; longestStreak: number; perfectDays: number }
): Promise<ClaimResult[]> {
  const results: ClaimResult[] = []
  const claimedIds = await getClaimedAchievements(userId)

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already claimed
    if (claimedIds.includes(achievement.id)) continue

    // Check if eligible
    let eligible = false
    
    if (achievement.category === 'completion') {
      eligible = stats.totalCompletions >= achievement.target
    } else if (achievement.category === 'streak') {
      eligible = Math.max(stats.currentStreak, stats.longestStreak) >= achievement.target
    } else if (achievement.category === 'perfect') {
      eligible = stats.perfectDays >= achievement.target
    }

    if (eligible) {
      const result = await claimAchievement(userId, achievement.id)
      results.push(result)
    }
  }

  return results
}

/**
 * Update user streak in database
 */
export async function updateUserStreak(
  userId: string,
  currentStreak: number,
  longestStreak: number
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, longestStreak)
      }, { onConflict: 'user_id' })

    return !error
  } catch (error) {
    console.error('Error updating streak:', error)
    return false
  }
}
