import { createClient } from '@/lib/supabase/client'
import { addCoinsWithRetry, spendCoinsWithRetry } from '@/lib/user-rewards-safe'

/**
 * FIXED Coin System Utility - Prevents Exploits & Concurrent Data Corruption
 * 
 * Earning Rules:
 * - +1 coin per habit completed (ONCE per day)
 * - -1 coin if habit uncompleted (refund prevention)
 * - +5 coins per achievement unlocked
 * - Coins can be purchased via Razorpay
 * 
 * Security Features:
 * - Tracks coin awards per habit per day
 * - Prevents double-awarding
 * - Deducts coins on uncompletion
 * - Uses optimistic locking to prevent concurrent data corruption (C008 fix)
 * - Automatic retry on version conflicts
 */

export const COIN_REWARDS = {
  HABIT_COMPLETED: 1,
  ACHIEVEMENT_UNLOCKED: 5,
} as const

interface CoinTransactionResult {
  success: boolean
  message: string
  coinsAwarded?: number
  totalCoins?: number
}

/**
 * Award coins for completing a habit (with exploit prevention & optimistic locking)
 */
export async function awardHabitCoins(
  userId: string,
  habitId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<CoinTransactionResult> {
  try {
    const supabase = createClient()

    // Check if coins already awarded for this habit today
    const { data: existingAward } = await supabase
      .from('coin_awards')
      .select('id')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (existingAward) {
      return {
        success: false,
        message: 'Coins already awarded for this habit today'
      }
    }

    // Use safe coin addition with optimistic locking and automatic retry
    const result = await addCoinsWithRetry(
      userId, 
      COIN_REWARDS.HABIT_COMPLETED, 
      `Habit completed: ${habitId} on ${date}`
    )

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to award coins'
      }
    }

    // Record the coin award (this is tracked separately from the transaction log)
    const { error: awardError } = await supabase
      .from('coin_awards')
      .insert({
        user_id: userId,
        habit_id: habitId,
        date: date,
        coins_awarded: COIN_REWARDS.HABIT_COMPLETED
      })

    if (awardError) {
      console.error('Error recording coin award:', awardError)
      // Note: We don't rollback here as the coin transaction is already logged
      // The coin_awards table is for preventing double-awards, not for accounting
      return {
        success: false,
        message: 'Coins awarded but failed to record award tracking'
      }
    }

    return {
      success: true,
      message: 'Coins awarded successfully',
      coinsAwarded: COIN_REWARDS.HABIT_COMPLETED,
      totalCoins: result.coins || 0
    }
  } catch (error) {
    console.error('Error in awardHabitCoins:', error)
    return {
      success: false,
      message: 'Unexpected error occurred'
    }
  }
}

/**
 * Deduct coins when uncompleting a habit (with optimistic locking)
 */
export async function deductHabitCoins(
  userId: string,
  habitId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<CoinTransactionResult> {
  try {
    const supabase = createClient()

    // Check if coins were awarded for this habit today
    const { data: award, error: awardError } = await supabase
      .from('coin_awards')
      .select('coins_awarded')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (awardError || !award) {
      return {
        success: true,
        message: 'No coins to deduct'
      }
    }

    // Use safe coin spending with optimistic locking and automatic retry
    const result = await spendCoinsWithRetry(
      userId, 
      award.coins_awarded, 
      `Habit uncompleted: ${habitId} on ${date}`
    )

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to deduct coins'
      }
    }

    // Delete the coin award record
    const { error: deleteError } = await supabase
      .from('coin_awards')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)

    if (deleteError) {
      console.error('Error deleting coin award:', deleteError)
      return {
        success: false,
        message: 'Failed to remove coin award record'
      }
    }

    return {
      success: true,
      message: 'Coins deducted successfully',
      coinsAwarded: -award.coins_awarded,
      totalCoins: result.coins || 0
    }
  } catch (error) {
    console.error('Error in deductHabitCoins:', error)
    return {
      success: false,
      message: 'Unexpected error occurred'
    }
  }
}

/**
 * Check if coins were already awarded for a habit today
 */
export async function checkCoinsAwarded(
  userId: string,
  habitId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('coin_awards')
      .select('id')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    return !!data
  } catch (error) {
    return false
  }
}

/**
 * Reward user for unlocking an achievement (with optimistic locking)
 */
export async function rewardAchievementUnlock(userId: string): Promise<CoinTransactionResult> {
  try {
    // Use safe coin addition with optimistic locking and automatic retry
    const result = await addCoinsWithRetry(
      userId, 
      COIN_REWARDS.ACHIEVEMENT_UNLOCKED, 
      'Achievement unlocked'
    )

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to award achievement coins'
      }
    }

    return {
      success: true,
      message: 'Achievement coins awarded',
      coinsAwarded: COIN_REWARDS.ACHIEVEMENT_UNLOCKED,
      totalCoins: result.coins || 0
    }
  } catch (error) {
    console.error('Error in rewardAchievementUnlock:', error)
    return {
      success: false,
      message: 'Unexpected error occurred'
    }
  }
}
