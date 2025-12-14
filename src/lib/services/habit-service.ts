/**
 * H009: Service Layer - Habit Service
 * Abstracts database operations from UI components
 */

import { createClient } from '@/lib/supabase/client';
import { createHabitSchema, updateHabitSchema, habitLogSchema, validate } from '@/lib/validation';

// ============================================
// TYPES
// ============================================

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  emoji?: string;
  category?: 'morning' | 'work' | 'night' | 'health' | 'focus';
  type: 'boolean' | 'numeric';
  target_value?: number;
  target_unit?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  value?: number;
  notes?: string;
  completed_at?: string;
  duration_minutes?: number;
  focus_score?: number;
  interruptions?: number;
}

export interface HabitWithStatus extends Habit {
  completed_today: boolean;
  current_value?: number;
}

export interface HabitAnalytics {
  total_habits: number;
  active_habits: number;
  total_completions: number;
  completions_today: number;
  completions_week: number;
  completions_month: number;
  current_streak: number;
  longest_streak: number;
  perfect_days: number;
  completion_rate: number;
  best_category?: string;
  best_time_of_day?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// HABIT SERVICE
// ============================================

export class HabitService {
  private supabase = createClient();

  /**
   * Get all habits for a user with today's completion status
   */
  async getHabitsWithStatus(userId: string): Promise<ServiceResult<HabitWithStatus[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_habits_with_status', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching habits:', error);
      return { success: false, error: 'Failed to fetch habits' };
    }
  }

  /**
   * Get habit analytics for a user
   */
  async getAnalytics(userId: string): Promise<ServiceResult<HabitAnalytics>> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_habit_analytics', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { success: true, data: data as HabitAnalytics };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { success: false, error: 'Failed to fetch analytics' };
    }
  }

  /**
   * Create a new habit
   */
  async createHabit(userId: string, habitData: unknown): Promise<ServiceResult<Habit>> {
    // Validate input
    const validation = validate(createHabitSchema, habitData);
    if (!validation.success) {
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      const { data, error } = await this.supabase
        .from('habits')
        .insert({ ...validation.data, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating habit:', error);
      return { success: false, error: 'Failed to create habit' };
    }
  }

  /**
   * Update an existing habit
   */
  async updateHabit(habitId: string, userId: string, habitData: unknown): Promise<ServiceResult<Habit>> {
    // Validate input
    const validation = validate(updateHabitSchema, habitData);
    if (!validation.success) {
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      const { data, error } = await this.supabase
        .from('habits')
        .update({ ...validation.data, updated_at: new Date().toISOString() })
        .eq('id', habitId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating habit:', error);
      return { success: false, error: 'Failed to update habit' };
    }
  }

  /**
   * Delete a habit
   */
  async deleteHabit(habitId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting habit:', error);
      return { success: false, error: 'Failed to delete habit' };
    }
  }

  /**
   * Toggle habit completion for today
   */
  async toggleCompletion(
    habitId: string,
    userId: string,
    date: string,
    completed: boolean,
    value?: number
  ): Promise<ServiceResult<HabitLog>> {
    try {
      const logData = {
        user_id: userId,
        habit_id: habitId,
        date,
        completed,
        value,
        completed_at: completed ? new Date().toISOString() : null,
      };

      const { data, error } = await this.supabase
        .from('habit_logs')
        .upsert(logData, { onConflict: 'user_id,habit_id,date' })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error toggling completion:', error);
      return { success: false, error: 'Failed to update completion' };
    }
  }

  /**
   * Get habit logs for a date range
   */
  async getLogs(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<HabitLog[]>> {
    try {
      const { data, error } = await this.supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching logs:', error);
      return { success: false, error: 'Failed to fetch logs' };
    }
  }

  /**
   * Log detailed habit completion
   */
  async logHabit(userId: string, logData: unknown): Promise<ServiceResult<HabitLog>> {
    // Validate input
    const validation = validate(habitLogSchema, logData);
    if (!validation.success) {
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      const { data, error } = await this.supabase
        .from('habit_logs')
        .upsert(
          { ...validation.data, user_id: userId },
          { onConflict: 'user_id,habit_id,date' }
        )
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error logging habit:', error);
      return { success: false, error: 'Failed to log habit' };
    }
  }
}

// Singleton instance
export const habitService = new HabitService();
