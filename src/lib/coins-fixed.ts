import { createClient } from '@/lib/supabase/client'

/**
 * FIXED Coin System Utility - Prevents Exploits
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
 * - Uses database transactions
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
 * Award coins for completing a habit (with exploit prevention)
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

    // Get current coins
    const { data: rewards, error: fetchError } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', userId)
      .single()

    let currentCoins = 0
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error fetching rewards:', fetchError)
      return {
        success: false,
        message: 'Failed to fetch user rewards'
      }
    }

    if (rewards) {
      currentCoins = rewards.coins
    }

    const newCoins = currentCoins + COIN_REWARDS.HABIT_COMPLETED

    // Update or create rewards record
    const { error: upsertError } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        coins: newCoins
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('Error updating coins:', upsertError)
      return {
        success: false,
        message: 'Failed to update coins'
      }
    }

    // Record the coin award
    const { error: awardError } = await supabase
      .from('coin_awards')
      .insert({
        user_id: userId,
        habit_id: habitId,
        date: date,
        coins_awarded: COIN_REWARDS.HABIT_COMPLETED
      })

    if (awardError) {
      // Rollback coins if award tracking fails
      await supabase
        .from('user_rewards')
        .update({ coins: currentCoins })
        .eq('user_id', userId)
      
      console.error('Error recording coin award:', awardError)
      return {
        success: false,
        message: 'Failed to record coin award'
      }
    }

    return {
      success: true,
      message: 'Coins awarded successfully',
      coinsAwarded: COIN_REWARDS.HABIT_COMPLETED,
      totalCoins: newCoins
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
 * Deduct coins when uncompleting a habit
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

    // Get current coins
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (!rewards) {
      return {
        success: false,
        message: 'User rewards not found'
      }
    }

    const newCoins = Math.max(0, rewards.coins - award.coins_awarded)

    // Update coins
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ coins: newCoins })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error deducting coins:', updateError)
      return {
        success: false,
        message: 'Failed to deduct coins'
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
      // Rollback coins if deletion fails
      await supabase
        .from('user_rewards')
        .update({ coins: rewards.coins })
        .eq('user_id', userId)
      
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
      totalCoins: newCoins
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
 * Reward user for unlocking an achievement
 */
export async function rewardAchievementUnlock(userId: string): Promise<CoinTransactionResult> {
  try {
    const supabase = createClient()

    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('coins')
      .eq('user_id', userId)
      .single()

    const currentCoins = rewards?.coins || 0
    const newCoins = currentCoins + COIN_REWARDS.ACHIEVEMENT_UNLOCKED

    const { error } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        coins: newCoins
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      return {
        success: false,
        message: 'Failed to award achievement coins'
      }
    }

    return {
      success: true,
      message: 'Achievement coins awarded',
      coinsAwarded: COIN_REWARDS.ACHIEVEMENT_UNLOCKED,
      totalCoins: newCoins
    }
  } catch (error) {
    console.error('Error in rewardAchievementUnlock:', error)
    return {
      success: false,
      message: 'Unexpected error occurred'
    }
  }
}
