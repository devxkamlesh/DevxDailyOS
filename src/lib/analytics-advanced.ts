/**
 * Advanced Analytics (L012)
 * Comprehensive analytics, trends, and insights
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface HabitTrend {
  habitId: string;
  habitName: string;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
  currentRate: number;
  previousRate: number;
}

export interface TimeOfDayAnalysis {
  hour: number;
  completions: number;
  percentage: number;
}

export interface DayOfWeekAnalysis {
  day: number;
  dayName: string;
  completions: number;
  percentage: number;
  averageCompletionRate: number;
}

export interface StreakAnalysis {
  currentStreak: number;
  longestStreak: number;
  averageStreak: number;
  streakHistory: { date: string; length: number }[];
  streakBreaks: { date: string; previousLength: number }[];
}

export interface CategoryAnalysis {
  category: string;
  habitCount: number;
  totalCompletions: number;
  completionRate: number;
  averageStreak: number;
}

export interface InsightType {
  type: 'achievement' | 'warning' | 'suggestion' | 'milestone';
  title: string;
  description: string;
  metric?: number;
  icon?: string;
}

export interface AdvancedAnalytics {
  overview: {
    totalHabits: number;
    activeHabits: number;
    totalCompletions: number;
    overallCompletionRate: number;
    perfectDays: number;
    currentStreak: number;
    longestStreak: number;
  };
  trends: HabitTrend[];
  timeOfDay: TimeOfDayAnalysis[];
  dayOfWeek: DayOfWeekAnalysis[];
  streaks: StreakAnalysis;
  categories: CategoryAnalysis[];
  insights: InsightType[];
  predictions: {
    nextMilestone: string;
    estimatedDays: number;
    riskHabits: string[];
  };
}

// ============================================================================
// ANALYTICS CALCULATIONS
// ============================================================================

/**
 * Calculate completion rate for a period
 */
function calculateCompletionRate(
  completions: number,
  totalPossible: number
): number {
  if (totalPossible === 0) return 0;
  return Math.round((completions / totalPossible) * 100) / 100;
}

/**
 * Determine trend direction
 */
function determineTrend(
  current: number,
  previous: number
): 'improving' | 'declining' | 'stable' {
  const change = current - previous;
  if (Math.abs(change) < 0.05) return 'stable';
  return change > 0 ? 'improving' : 'declining';
}

/**
 * Calculate change percentage
 */
function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch advanced analytics for a user
 */
export async function fetchAdvancedAnalytics(
  userId: string,
  days: number = 30
): Promise<AdvancedAnalytics> {
  const supabase = createClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  // Fetch habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId);

  // Fetch habit logs for current period
  const { data: currentLogs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  // Fetch habit logs for previous period
  const { data: previousLogs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', previousStartDate.toISOString())
    .lt('completed_at', startDate.toISOString());

  // Fetch user rewards
  const { data: rewards } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', userId)
    .single();

  const activeHabits = habits?.filter((h) => h.is_active) || [];
  const completedLogs = currentLogs?.filter((l) => l.completed) || [];
  const previousCompletedLogs = previousLogs?.filter((l) => l.completed) || [];

  // Calculate overview
  const totalPossible = activeHabits.length * days;
  const overview = {
    totalHabits: habits?.length || 0,
    activeHabits: activeHabits.length,
    totalCompletions: completedLogs.length,
    overallCompletionRate: calculateCompletionRate(completedLogs.length, totalPossible),
    perfectDays: calculatePerfectDays(completedLogs, activeHabits.length, days),
    currentStreak: rewards?.current_streak || 0,
    longestStreak: rewards?.longest_streak || 0,
  };

  // Calculate trends per habit
  const trends = calculateHabitTrends(
    activeHabits,
    completedLogs,
    previousCompletedLogs,
    days
  );

  // Calculate time of day analysis
  const timeOfDay = calculateTimeOfDayAnalysis(completedLogs);

  // Calculate day of week analysis
  const dayOfWeek = calculateDayOfWeekAnalysis(completedLogs, activeHabits.length);

  // Calculate streak analysis
  const streaks = calculateStreakAnalysis(currentLogs || [], activeHabits.length);

  // Calculate category analysis
  const categories = calculateCategoryAnalysis(activeHabits, completedLogs, days);

  // Generate insights
  const insights = generateInsights(overview, trends, streaks, categories);

  // Generate predictions
  const predictions = generatePredictions(overview, trends, rewards);

  return {
    overview,
    trends,
    timeOfDay,
    dayOfWeek,
    streaks,
    categories,
    insights,
    predictions,
  };
}

/**
 * Calculate perfect days count
 */
function calculatePerfectDays(
  logs: Record<string, unknown>[],
  habitCount: number,
  days: number
): number {
  if (habitCount === 0) return 0;

  const completionsByDate = new Map<string, number>();
  
  for (const log of logs) {
    const date = new Date(log.completed_at as string).toISOString().split('T')[0];
    completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1);
  }

  let perfectDays = 0;
  for (const count of completionsByDate.values()) {
    if (count >= habitCount) {
      perfectDays++;
    }
  }

  return perfectDays;
}

/**
 * Calculate habit trends
 */
function calculateHabitTrends(
  habits: Record<string, unknown>[],
  currentLogs: Record<string, unknown>[],
  previousLogs: Record<string, unknown>[],
  days: number
): HabitTrend[] {
  return habits.map((habit) => {
    const habitId = habit.id as string;
    const currentCompletions = currentLogs.filter(
      (l) => l.habit_id === habitId
    ).length;
    const previousCompletions = previousLogs.filter(
      (l) => l.habit_id === habitId
    ).length;

    const currentRate = calculateCompletionRate(currentCompletions, days);
    const previousRate = calculateCompletionRate(previousCompletions, days);

    return {
      habitId,
      habitName: habit.name as string,
      trend: determineTrend(currentRate, previousRate),
      changePercent: calculateChangePercent(currentRate, previousRate),
      currentRate,
      previousRate,
    };
  });
}

/**
 * Calculate time of day analysis
 */
function calculateTimeOfDayAnalysis(
  logs: Record<string, unknown>[]
): TimeOfDayAnalysis[] {
  const hourCounts = new Array(24).fill(0);
  
  for (const log of logs) {
    const hour = new Date(log.completed_at as string).getHours();
    hourCounts[hour]++;
  }

  const total = logs.length || 1;
  
  return hourCounts.map((count, hour) => ({
    hour,
    completions: count,
    percentage: Math.round((count / total) * 100),
  }));
}

/**
 * Calculate day of week analysis
 */
function calculateDayOfWeekAnalysis(
  logs: Record<string, unknown>[],
  habitCount: number
): DayOfWeekAnalysis[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);
  const dayOccurrences = new Array(7).fill(0);

  // Count completions per day
  const datesSeen = new Set<string>();
  for (const log of logs) {
    const date = new Date(log.completed_at as string);
    const day = date.getDay();
    dayCounts[day]++;
    
    const dateStr = date.toISOString().split('T')[0];
    if (!datesSeen.has(dateStr)) {
      datesSeen.add(dateStr);
      dayOccurrences[day]++;
    }
  }

  const total = logs.length || 1;

  return dayCounts.map((count, day) => ({
    day,
    dayName: dayNames[day],
    completions: count,
    percentage: Math.round((count / total) * 100),
    averageCompletionRate: dayOccurrences[day] > 0
      ? calculateCompletionRate(count, dayOccurrences[day] * habitCount)
      : 0,
  }));
}

/**
 * Calculate streak analysis
 */
function calculateStreakAnalysis(
  logs: Record<string, unknown>[],
  habitCount: number
): StreakAnalysis {
  const completionsByDate = new Map<string, number>();
  
  for (const log of logs) {
    if (log.completed) {
      const date = new Date(log.completed_at as string).toISOString().split('T')[0];
      completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1);
    }
  }

  const sortedDates = Array.from(completionsByDate.keys()).sort();
  const streakHistory: { date: string; length: number }[] = [];
  const streakBreaks: { date: string; previousLength: number }[] = [];
  
  let currentStreak = 0;
  let maxStreak = 0;
  let totalStreaks = 0;
  let streakCount = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const completions = completionsByDate.get(date) || 0;
    
    if (completions >= habitCount) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      if (currentStreak > 0) {
        streakHistory.push({ date: sortedDates[i - 1], length: currentStreak });
        streakBreaks.push({ date, previousLength: currentStreak });
        totalStreaks += currentStreak;
        streakCount++;
      }
      currentStreak = 0;
    }
  }

  // Add final streak if exists
  if (currentStreak > 0) {
    streakHistory.push({ date: sortedDates[sortedDates.length - 1], length: currentStreak });
    totalStreaks += currentStreak;
    streakCount++;
  }

  return {
    currentStreak,
    longestStreak: maxStreak,
    averageStreak: streakCount > 0 ? Math.round(totalStreaks / streakCount) : 0,
    streakHistory: streakHistory.slice(-10), // Last 10 streaks
    streakBreaks: streakBreaks.slice(-5), // Last 5 breaks
  };
}

/**
 * Calculate category analysis
 */
function calculateCategoryAnalysis(
  habits: Record<string, unknown>[],
  logs: Record<string, unknown>[],
  days: number
): CategoryAnalysis[] {
  const categoryMap = new Map<string, {
    habits: Record<string, unknown>[];
    completions: number;
  }>();

  // Group habits by category
  for (const habit of habits) {
    const category = (habit.category as string) || 'Uncategorized';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { habits: [], completions: 0 });
    }
    categoryMap.get(category)!.habits.push(habit);
  }

  // Count completions per category
  for (const log of logs) {
    const habit = habits.find((h) => h.id === log.habit_id);
    if (habit) {
      const category = (habit.category as string) || 'Uncategorized';
      const data = categoryMap.get(category);
      if (data) {
        data.completions++;
      }
    }
  }

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    habitCount: data.habits.length,
    totalCompletions: data.completions,
    completionRate: calculateCompletionRate(data.completions, data.habits.length * days),
    averageStreak: 0, // Would need more complex calculation
  }));
}

/**
 * Generate insights based on analytics
 */
function generateInsights(
  overview: AdvancedAnalytics['overview'],
  trends: HabitTrend[],
  streaks: StreakAnalysis,
  categories: CategoryAnalysis[]
): InsightType[] {
  const insights: InsightType[] = [];

  // Completion rate insights
  if (overview.overallCompletionRate >= 0.9) {
    insights.push({
      type: 'achievement',
      title: 'Excellent Consistency!',
      description: `You're completing ${Math.round(overview.overallCompletionRate * 100)}% of your habits. Keep it up!`,
      metric: overview.overallCompletionRate,
      icon: '🏆',
    });
  } else if (overview.overallCompletionRate < 0.5) {
    insights.push({
      type: 'suggestion',
      title: 'Room for Improvement',
      description: 'Try focusing on fewer habits to build consistency before adding more.',
      metric: overview.overallCompletionRate,
      icon: '💡',
    });
  }

  // Streak insights
  if (streaks.currentStreak >= 7) {
    insights.push({
      type: 'milestone',
      title: `${streaks.currentStreak} Day Streak!`,
      description: "You're on fire! Don't break the chain.",
      metric: streaks.currentStreak,
      icon: '🔥',
    });
  }

  // Trend insights
  const improvingHabits = trends.filter((t) => t.trend === 'improving');
  const decliningHabits = trends.filter((t) => t.trend === 'declining');

  if (improvingHabits.length > 0) {
    insights.push({
      type: 'achievement',
      title: 'Habits Improving',
      description: `${improvingHabits.map((h) => h.habitName).join(', ')} ${improvingHabits.length === 1 ? 'is' : 'are'} trending up!`,
      icon: '📈',
    });
  }

  if (decliningHabits.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Attention Needed',
      description: `${decliningHabits.map((h) => h.habitName).join(', ')} ${decliningHabits.length === 1 ? 'needs' : 'need'} more focus.`,
      icon: '⚠️',
    });
  }

  // Category insights
  const bestCategory = categories.reduce((best, cat) =>
    cat.completionRate > (best?.completionRate || 0) ? cat : best
  , categories[0]);

  if (bestCategory && bestCategory.completionRate > 0.7) {
    insights.push({
      type: 'achievement',
      title: `Strong in ${bestCategory.category}`,
      description: `Your ${bestCategory.category} habits have a ${Math.round(bestCategory.completionRate * 100)}% completion rate.`,
      icon: '💪',
    });
  }

  return insights;
}

/**
 * Generate predictions
 */
function generatePredictions(
  overview: AdvancedAnalytics['overview'],
  trends: HabitTrend[],
  rewards: Record<string, unknown> | null
): AdvancedAnalytics['predictions'] {
  const riskHabits = trends
    .filter((t) => t.trend === 'declining' && t.changePercent < -20)
    .map((t) => t.habitName);

  // Calculate next milestone
  const currentXP = (rewards?.xp as number) || 0;
  const currentLevel = (rewards?.level as number) || 1;
  const xpForNextLevel = currentLevel * 100;
  const xpNeeded = xpForNextLevel - (currentXP % xpForNextLevel);
  const avgXPPerDay = overview.totalCompletions * 10 / 30; // Rough estimate
  const daysToNextLevel = avgXPPerDay > 0 ? Math.ceil(xpNeeded / avgXPPerDay) : 999;

  return {
    nextMilestone: `Level ${currentLevel + 1}`,
    estimatedDays: daysToNextLevel,
    riskHabits,
  };
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useAdvancedAnalytics(userId: string | null, days: number = 30) {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdvancedAnalytics(userId, days);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { analytics, isLoading, error, refresh };
}

export default fetchAdvancedAnalytics;
