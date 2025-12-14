/**
 * Safe User Rewards Operations with Optimistic Locking
 * 
 * This module provides thread-safe operations for user rewards to prevent
 * data corruption under concurrent access scenarios (C008 fix).
 * 
 * All operations use optimistic locking with version numbers to ensure
 * data consistency when multiple processes try to update the same user's
 * rewards simultaneously.
 */

import { createClient } from '@/lib/supabase/client'

export interface UserRewards {
  id?: string
  user_id: string
  coins: number
  gems: number
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  perfect_days: number
  current_theme: string
  current_avatar: string
  unlocked_themes: string[]
  unlocked_avatars: string[]
  version: number
  created_at?: string
  updated_at?: string
}

export interface SafeUpdateResult {
  success: boolean
  error?: string
  message?: string
  version?: number
  coins?: number
  xp?: number
  level?: number
  current_streak?: number
  longest_streak?: number
  perfect_days?: number
  current_theme?: string
  current_avatar?: string
  unlocked_themes?: string[]
  unlocked_avatars?: string[]
  current_version?: number
  expected_version?: number
  required?: number
  available?: number
}

/**
 * Get user rewards with version number for optimistic locking
 */
export async function getUserRewardsWithVersion(userId: string): Promise<UserRewards | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('get_user_rewards_with_version', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error fetching user rewards:', error)
      return null
    }

    return data as UserRewards
  } catch (error) {
    console.error('Failed to get user rewards:', error)
    return null
  }
}

/**
 * Safely add coins with optimistic locking
 */
export async function addCoinsSafe(
  userId: string, 
  expectedVersion: number, 
  amount: number, 
  reason?: string
): Promise<SafeUpdateResult> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('add_coins_safe', {
      p_user_id: userId,
      p_expected_version: expectedVersion,
      p_amount: amount,
      p_reason: reason
    })

    if (error) {
      console.error('Error adding coins:', error)
      return {
        success: false,
        error: 'database_error',
        message: error.message
      }
    }

    return data as SafeUpdateResult
  } catch (error) {
    console.error('Failed to add coins:', error)
    return {
      success: false,
      error: 'network_error',
      message: 'Failed to add coins. Please try again.'
    }
  }
}

/**
 * Safely spend coins with balance check and optimistic locking
 */
export async function spendCoinsSafe(
  userId: string, 
  expectedVersion: number, 
  amount: number, 
  reason?: string
): Promise<SafeUpdateResult> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('spend_coins_safe', {
      p_user_id: userId,
      p_expected_version: expectedVersion,
      p_amount: amount,
      p_reason: reason
    })

    if (error) {
      console.error('Error spending coins:', error)
      return {
        success: false,
        error: 'database_error',
        message: error.message
      }
    }

    return data as SafeUpdateResult
  } catch (error) {
    console.error('Failed to spend coins:', error)
    return {
      success: false,
      error: 'network_error',
      message: 'Failed to spend coins. Please try again.'
    }
  }
}

/**
 * Safely update user rewards with optimistic locking
 */
export async function updateUserRewardsSafe(
  userId: string,
  expectedVersion: number,
  updates: {
    coinsChange?: number
    xpChange?: number
    levelChange?: number
    currentStreak?: number
    longestStreak?: number
    perfectDaysChange?: number
    currentTheme?: string
    currentAvatar?: string
    unlockedThemes?: string[]
    unlockedAvatars?: string[]
  }
): Promise<SafeUpdateResult> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('update_user_rewards_safe', {
      p_user_id: userId,
      p_expected_version: expectedVersion,
      p_coins_delta: updates.coinsChange || 0,
      p_xp_delta: updates.xpChange || 0,
      p_level_delta: updates.levelChange || 0,
      p_current_streak: updates.currentStreak,
      p_longest_streak: updates.longestStreak,
      p_perfect_days_delta: updates.perfectDaysChange || 0,
      p_current_theme: updates.currentTheme,
      p_current_avatar: updates.currentAvatar,
      p_unlocked_themes: updates.unlockedThemes,
      p_unlocked_avatars: updates.unlockedAvatars
    })

    if (error) {
      console.error('Error updating user rewards:', error)
      return {
        success: false,
        error: 'database_error',
        message: error.message
      }
    }

    return data as SafeUpdateResult
  } catch (error) {
    console.error('Failed to update user rewards:', error)
    return {
      success: false,
      error: 'network_error',
      message: 'Failed to update rewards. Please try again.'
    }
  }
}

/**
 * Retry wrapper for optimistic locking operations
 * Automatically retries on version mismatch up to maxRetries times
 */
export async function withOptimisticLockingRetry<T>(
  operation: (rewards: UserRewards) => Promise<SafeUpdateResult>,
  userId: string,
  maxRetries: number = 3
): Promise<SafeUpdateResult> {
  let attempts = 0
  
  while (attempts < maxRetries) {
    attempts++
    
    // Get current rewards with version
    const rewards = await getUserRewardsWithVersion(userId)
    if (!rewards) {
      return {
        success: false,
        error: 'user_not_found',
        message: 'User rewards not found'
      }
    }
    
    // Attempt the operation
    const result = await operation(rewards)
    
    // If successful or non-retryable error, return result
    if (result.success || result.error !== 'version_mismatch') {
      return result
    }
    
    // If version mismatch and we have retries left, continue
    if (attempts < maxRetries) {
      console.log(`Optimistic locking retry ${attempts}/${maxRetries} for user ${userId}`)
      // Small delay to reduce contention
      await new Promise(resolve => setTimeout(resolve, 50 * attempts))
      continue
    }
    
    // Max retries exceeded
    return {
      success: false,
      error: 'max_retries_exceeded',
      message: 'Operation failed after multiple attempts due to concurrent updates. Please try again.'
    }
  }
  
  // Should never reach here
  return {
    success: false,
    error: 'unexpected_error',
    message: 'Unexpected error in retry logic'
  }
}

/**
 * Helper function to add coins with automatic retry on version conflicts
 */
export async function addCoinsWithRetry(
  userId: string, 
  amount: number, 
  reason?: string,
  maxRetries: number = 3
): Promise<SafeUpdateResult> {
  return withOptimisticLockingRetry(
    async (rewards) => addCoinsSafe(userId, rewards.version, amount, reason),
    userId,
    maxRetries
  )
}

/**
 * Helper function to spend coins with automatic retry on version conflicts
 */
export async function spendCoinsWithRetry(
  userId: string, 
  amount: number, 
  reason?: string,
  maxRetries: number = 3
): Promise<SafeUpdateResult> {
  return withOptimisticLockingRetry(
    async (rewards) => spendCoinsSafe(userId, rewards.version, amount, reason),
    userId,
    maxRetries
  )
}

/**
 * Helper function to update XP with automatic retry on version conflicts
 */
export async function updateXPWithRetry(
  userId: string,
  xpChange: number,
  levelChange: number = 0,
  maxRetries: number = 3
): Promise<SafeUpdateResult> {
  return withOptimisticLockingRetry(
    async (rewards) => updateUserRewardsSafe(userId, rewards.version, {
      xpChange,
      levelChange
    }),
    userId,
    maxRetries
  )
}

/**
 * Helper function to update streaks with automatic retry on version conflicts
 */
export async function updateStreaksWithRetry(
  userId: string,
  currentStreak: number,
  longestStreak?: number,
  maxRetries: number = 3
): Promise<SafeUpdateResult> {
  return withOptimisticLockingRetry(
    async (rewards) => updateUserRewardsSafe(userId, rewards.version, {
      currentStreak,
      longestStreak: longestStreak || Math.max(rewards.longest_streak, currentStreak)
    }),
    userId,
    maxRetries
  )
}