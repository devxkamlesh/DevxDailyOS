import { createClient } from '@/lib/supabase/client'

/**
 * XP & Level System Utility
 * 
 * XP Earning Rules:
 * - +10 XP per habit completed (ONCE per day per habit)
 * - +25 XP for achievement unlocked
 * - +50 XP for weekly challenge completed
 * - Bonus XP for streaks
 * 
 * Level Formula:
 * - Level = floor(sqrt(xp / 100)) + 1
 * - Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
 */

export const XP_REWARDS = {
  HABIT_COMPLETED: 10,
  ACHIEVEMENT_UNLOCKED: 25,
  WEEKLY_CHALLENGE: 50,
  STREAK_BONUS_3: 5,   // +5 XP bonus at 3 day streak
  STREAK_BONUS_7: 10,  // +10 XP bonus at 7 day streak
  STREAK_BONUS_14: 20, // +20 XP bonus at 14 day streak
  STREAK_BONUS_30: 50, // +50 XP bonus at 30 day streak
} as const

interface XPTransactionResult {
  success: boolean
  message: string
  xpAwarded?: number
  totalXP?: number
  level?: number
  leveledUp?: boolean
  newLevel?: number
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1)
}

/**
 * Calculate XP needed for a specific level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

/**
 * Calculate XP progress within current level
 */
export function getLevelProgress(xp: number): { 
  currentLevel: number
  currentLevelXP: number
  nextLevelXP: number
  progressXP: number
  progressPercent: number 
} {
  const currentLevel = calculateLevel(xp)
  const currentLevelXP = xpForLevel(currentLevel)
  const nextLevelXP = xpForLevel(currentLevel + 1)
  const progressXP = xp - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  const progressPercent = Math.min(100, (progressXP / xpNeeded) * 100)
  
  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    progressXP,
    progressPercent
  }
}

/**
 * Award XP for completing a habit (with exploit prevention)
 */
export async function awardHabitXP(
  userId: string,
  habitId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<XPTransactionResult> {
  try {
    const supabase = createClient()

    // Check if XP already awarded for this habit today
    const { data: existingAward } = await supabase
      .from('xp_awards')
      .select('id')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (existingAward) {
      return {
        success: false,
        message: 'XP already awarded for this habit today'
      }
    }

    // Get current XP and level
    const { data: rewards, error: fetchError } = await supabase
      .from('user_rewards')
      .select('xp, level')
      .eq('user_id', userId)
      .single()

    let currentXP = 0
    let currentLevel = 1
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching rewards:', fetchError)
      return { success: false, message: 'Failed to fetch user rewards' }
    }

    if (rewards) {
      currentXP = rewards.xp || 0
      currentLevel = rewards.level || 1
    }

    const newXP = currentXP + XP_REWARDS.HABIT_COMPLETED
    const newLevel = calculateLevel(newXP)
    const leveledUp = newLevel > currentLevel

    // Update or create rewards record
    const { error: upsertError } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        xp: newXP,
        level: newLevel
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Error updating XP:', upsertError)
      return { success: false, message: 'Failed to update XP' }
    }

    // Record the XP award
    const { error: awardError } = await supabase
      .from('xp_awards')
      .insert({
        user_id: userId,
        habit_id: habitId,
        date: date,
        xp_awarded: XP_REWARDS.HABIT_COMPLETED
      })

    if (awardError) {
      // Rollback XP if award tracking fails
      await supabase
        .from('user_rewards')
        .update({ xp: currentXP, level: currentLevel })
        .eq('user_id', userId)
      
      console.error('Error recording XP award:', awardError)
      return { success: false, message: 'Failed to record XP award' }
    }

    return {
      success: true,
      message: leveledUp ? `Level up! You're now level ${newLevel}!` : 'XP awarded successfully',
      xpAwarded: XP_REWARDS.HABIT_COMPLETED,
      totalXP: newXP,
      level: newLevel,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined
    }
  } catch (error) {
    console.error('Error in awardHabitXP:', error)
    return { success: false, message: 'Unexpected error occurred' }
  }
}

/**
 * Deduct XP when uncompleting a habit
 */
export async function deductHabitXP(
  userId: string,
  habitId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<XPTransactionResult> {
  try {
    const supabase = createClient()

    // Check if XP was awarded for this habit today
    const { data: award, error: awardError } = await supabase
      .from('xp_awards')
      .select('xp_awarded')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (awardError || !award) {
      return { success: true, message: 'No XP to deduct' }
    }

    // Get current XP
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('xp, level')
      .eq('user_id', userId)
      .single()

    if (!rewards) {
      return { success: false, message: 'User rewards not found' }
    }

    const newXP = Math.max(0, (rewards.xp || 0) - award.xp_awarded)
    const newLevel = calculateLevel(newXP)

    // Update XP
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ xp: newXP, level: newLevel })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error deducting XP:', updateError)
      return { success: false, message: 'Failed to deduct XP' }
    }

    // Delete the XP award record
    const { error: deleteError } = await supabase
      .from('xp_awards')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)

    if (deleteError) {
      // Rollback
      await supabase
        .from('user_rewards')
        .update({ xp: rewards.xp, level: rewards.level })
        .eq('user_id', userId)
      
      console.error('Error deleting XP award:', deleteError)
      return { success: false, message: 'Failed to remove XP award record' }
    }

    return {
      success: true,
      message: 'XP deducted successfully',
      xpAwarded: -award.xp_awarded,
      totalXP: newXP,
      level: newLevel
    }
  } catch (error) {
    console.error('Error in deductHabitXP:', error)
    return { success: false, message: 'Unexpected error occurred' }
  }
}

/**
 * Award XP for achievement unlock
 */
export async function awardAchievementXP(userId: string): Promise<XPTransactionResult> {
  try {
    const supabase = createClient()

    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('xp, level')
      .eq('user_id', userId)
      .single()

    const currentXP = rewards?.xp || 0
    const currentLevel = rewards?.level || 1
    const newXP = currentXP + XP_REWARDS.ACHIEVEMENT_UNLOCKED
    const newLevel = calculateLevel(newXP)
    const leveledUp = newLevel > currentLevel

    const { error } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        xp: newXP,
        level: newLevel
      }, { onConflict: 'user_id' })

    if (error) {
      return { success: false, message: 'Failed to award achievement XP' }
    }

    return {
      success: true,
      message: leveledUp ? `Level up! You're now level ${newLevel}!` : 'Achievement XP awarded',
      xpAwarded: XP_REWARDS.ACHIEVEMENT_UNLOCKED,
      totalXP: newXP,
      level: newLevel,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined
    }
  } catch (error) {
    console.error('Error in awardAchievementXP:', error)
    return { success: false, message: 'Unexpected error occurred' }
  }
}

/**
 * Get user's current XP and level info
 */
export async function getUserXPInfo(userId: string): Promise<{
  xp: number
  level: number
  progress: ReturnType<typeof getLevelProgress>
} | null> {
  try {
    const supabase = createClient()
    
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('xp, level')
      .eq('user_id', userId)
      .single()

    const xp = rewards?.xp || 0
    const level = rewards?.level || calculateLevel(xp)
    
    return {
      xp,
      level,
      progress: getLevelProgress(xp)
    }
  } catch (error) {
    console.error('Error getting user XP info:', error)
    return null
  }
}
