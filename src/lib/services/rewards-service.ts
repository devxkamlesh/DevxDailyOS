/**
 * H009: Service Layer - Rewards Service
 * Abstracts gamification operations from UI components
 */

import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export interface UserRewards {
  id: string;
  user_id: string;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  perfect_days: number;
  current_theme: string;
  current_avatar: string;
  unlocked_themes: string[];
  unlocked_avatars: string[];
  version: number;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: string;
  category?: string;
  requirement_type?: string;
  requirement_value?: number;
  xp_reward: number;
  coin_reward: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  is_primary: boolean;
  earned_at: string;
  badge?: Badge;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ============================================
// REWARDS SERVICE
// ============================================

export class RewardsService {
  private supabase = createClient();

  /**
   * Get user rewards with version for optimistic locking
   */
  async getRewards(userId: string): Promise<ServiceResult<UserRewards>> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_rewards_with_version', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { success: true, data: data as UserRewards };
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return { success: false, error: 'Failed to fetch rewards' };
    }
  }

  /**
   * Add coins safely with optimistic locking
   */
  async addCoins(
    userId: string,
    amount: number,
    reason: string
  ): Promise<ServiceResult<{ coins: number; version: number }>> {
    try {
      const { data, error } = await this.supabase.rpc('add_user_coins_safe', {
        p_user_id: userId,
        p_coins: amount,
        p_reason: reason,
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.message || 'Failed to add coins',
          errorCode: data?.error,
        };
      }

      return {
        success: true,
        data: { coins: data.coins, version: data.version },
      };
    } catch (error) {
      console.error('Error adding coins:', error);
      return { success: false, error: 'Failed to add coins' };
    }
  }

  /**
   * Spend coins safely with optimistic locking
   */
  async spendCoins(
    userId: string,
    expectedVersion: number,
    amount: number,
    reason: string
  ): Promise<ServiceResult<{ coins: number; version: number }>> {
    try {
      const { data, error } = await this.supabase.rpc('spend_coins_safe', {
        p_user_id: userId,
        p_expected_version: expectedVersion,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.message || 'Failed to spend coins',
          errorCode: data?.error,
        };
      }

      return {
        success: true,
        data: { coins: data.coins, version: data.version },
      };
    } catch (error) {
      console.error('Error spending coins:', error);
      return { success: false, error: 'Failed to spend coins' };
    }
  }

  /**
   * Add XP and handle level ups
   */
  async addXP(
    userId: string,
    expectedVersion: number,
    amount: number
  ): Promise<ServiceResult<{ xp: number; level: number; version: number; leveledUp: boolean }>> {
    try {
      // Get current rewards
      const currentResult = await this.getRewards(userId);
      if (!currentResult.success || !currentResult.data) {
        return { success: false, error: 'Failed to get current rewards' };
      }

      const currentLevel = currentResult.data.level;

      const { data, error } = await this.supabase.rpc('update_user_rewards_safe', {
        p_user_id: userId,
        p_expected_version: expectedVersion,
        p_xp_delta: amount,
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.message || 'Failed to add XP',
          errorCode: data?.error,
        };
      }

      return {
        success: true,
        data: {
          xp: data.xp,
          level: data.level,
          version: data.version,
          leveledUp: data.level > currentLevel,
        },
      };
    } catch (error) {
      console.error('Error adding XP:', error);
      return { success: false, error: 'Failed to add XP' };
    }
  }

  /**
   * Update streak
   */
  async updateStreak(
    userId: string,
    expectedVersion: number,
    currentStreak: number,
    longestStreak?: number
  ): Promise<ServiceResult<{ current_streak: number; longest_streak: number; version: number }>> {
    try {
      const { data, error } = await this.supabase.rpc('update_user_rewards_safe', {
        p_user_id: userId,
        p_expected_version: expectedVersion,
        p_current_streak: currentStreak,
        p_longest_streak: longestStreak,
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.message || 'Failed to update streak',
          errorCode: data?.error,
        };
      }

      return {
        success: true,
        data: {
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          version: data.version,
        },
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { success: false, error: 'Failed to update streak' };
    }
  }

  /**
   * Get user badges
   */
  async getUserBadges(userId: string): Promise<ServiceResult<UserBadge[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching badges:', error);
      return { success: false, error: 'Failed to fetch badges' };
    }
  }

  /**
   * Set primary badge
   */
  async setPrimaryBadge(userId: string, userBadgeId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase.rpc('set_primary_badge', {
        p_user_id: userId,
        p_user_badge_id: userBadgeId,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error setting primary badge:', error);
      return { success: false, error: 'Failed to set primary badge' };
    }
  }

  /**
   * Update theme
   */
  async updateTheme(userId: string, theme: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_rewards')
        .update({ current_theme: theme, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating theme:', error);
      return { success: false, error: 'Failed to update theme' };
    }
  }

  /**
   * Update avatar
   */
  async updateAvatar(userId: string, avatar: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_rewards')
        .update({ current_avatar: avatar, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating avatar:', error);
      return { success: false, error: 'Failed to update avatar' };
    }
  }
}

// Singleton instance
export const rewardsService = new RewardsService();
