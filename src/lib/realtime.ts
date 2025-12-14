/**
 * Real-time Features (L005)
 * Supabase Realtime subscriptions for live updates
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealtimeOptions {
  event?: RealtimeEvent;
  filter?: string;
}

type ChangeHandler<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

// ============================================================================
// REALTIME MANAGER
// ============================================================================

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase = createClient();

  /**
   * Subscribe to table changes
   */
  subscribeToTable<T extends Record<string, unknown>>(
    table: string,
    handler: ChangeHandler<T>,
    options: RealtimeOptions = {}
  ): RealtimeSubscription {
    const { event = '*', filter } = options;
    const channelName = `${table}:${event}:${filter || 'all'}`;

    // Reuse existing channel if available
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = this.supabase.channel(channelName);
      
      const config: {
        event: RealtimeEvent;
        schema: string;
        table: string;
        filter?: string;
      } = {
        event,
        schema: 'public',
        table,
      };
      
      if (filter) {
        config.filter = filter;
      }

      channel
        .on(
          'postgres_changes',
          config,
          (payload) => handler(payload as RealtimePostgresChangesPayload<T>)
        )
        .subscribe();

      this.channels.set(channelName, channel);
    }

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };
  }

  /**
   * Subscribe to user-specific changes
   */
  subscribeToUser<T extends Record<string, unknown>>(
    userId: string,
    table: string,
    handler: ChangeHandler<T>
  ): RealtimeSubscription {
    return this.subscribeToTable<T>(table, handler, {
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to habit completions for a user
   */
  subscribeToHabitLogs(
    userId: string,
    handler: ChangeHandler<{ habit_id: string; completed: boolean; completed_at: string }>
  ): RealtimeSubscription {
    return this.subscribeToUser(userId, 'habit_logs', handler);
  }

  /**
   * Subscribe to user rewards changes
   */
  subscribeToRewards(
    userId: string,
    handler: ChangeHandler<{ coins: number; xp: number; level: number }>
  ): RealtimeSubscription {
    return this.subscribeToUser(userId, 'user_rewards', handler);
  }

  /**
   * Subscribe to badge awards
   */
  subscribeToBadges(
    userId: string,
    handler: ChangeHandler<{ badge_id: string; awarded_at: string }>
  ): RealtimeSubscription {
    return this.subscribeToUser(userId, 'user_badges', handler);
  }

  /**
   * Subscribe to friend activity
   */
  subscribeToFriendActivity(
    userId: string,
    handler: ChangeHandler<{ friend_id: string; status: string }>
  ): RealtimeSubscription {
    return this.subscribeToTable('friends', handler, {
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to challenge updates
   */
  subscribeToChallenges(
    handler: ChangeHandler<{ id: string; title: string; status: string }>
  ): RealtimeSubscription {
    return this.subscribeToTable('weekly_challenges', handler);
  }

  /**
   * Broadcast a custom event
   */
  broadcast(channel: string, event: string, payload: Record<string, unknown>): void {
    const ch = this.supabase.channel(channel);
    ch.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Subscribe to broadcast events
   */
  subscribeToBroadcast(
    channelName: string,
    event: string,
    handler: (payload: Record<string, unknown>) => void
  ): RealtimeSubscription {
    const channel = this.supabase.channel(channelName);
    
    channel
      .on('broadcast', { event }, ({ payload }) => handler(payload))
      .subscribe();

    this.channels.set(`broadcast:${channelName}:${event}`, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(`broadcast:${channelName}:${event}`),
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const [name, channel] of this.channels) {
      this.supabase.removeChannel(channel);
      this.channels.delete(name);
    }
  }

  /**
   * Get active channel count
   */
  getActiveChannels(): number {
    return this.channels.size;
  }
}

// Singleton instance
export const realtime = new RealtimeManager();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for subscribing to table changes
 */
export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  handler: ChangeHandler<T>,
  options: RealtimeOptions = {}
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const subscription = realtime.subscribeToTable<T>(
      table,
      (payload) => handlerRef.current(payload),
      options
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [table, options.event, options.filter]);
}

/**
 * Hook for subscribing to user-specific changes
 */
export function useRealtimeUser<T extends Record<string, unknown>>(
  userId: string | null,
  table: string,
  handler: ChangeHandler<T>
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!userId) return;

    const subscription = realtime.subscribeToUser<T>(
      userId,
      table,
      (payload) => handlerRef.current(payload)
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, table]);
}

/**
 * Hook for real-time rewards updates
 */
export function useRealtimeRewards(
  userId: string | null,
  onUpdate: (rewards: { coins: number; xp: number; level: number }) => void
) {
  useRealtimeUser(userId, 'user_rewards', (payload) => {
    if (payload.eventType === 'UPDATE' && payload.new) {
      onUpdate(payload.new as { coins: number; xp: number; level: number });
    }
  });
}

/**
 * Hook for real-time habit log updates
 */
export function useRealtimeHabitLogs(
  userId: string | null,
  onUpdate: (log: { habit_id: string; completed: boolean }) => void
) {
  useRealtimeUser(userId, 'habit_logs', (payload) => {
    if (payload.new) {
      onUpdate(payload.new as { habit_id: string; completed: boolean });
    }
  });
}

/**
 * Hook for presence (online status)
 */
export function usePresence(userId: string | null, channelName: string = 'online-users') {
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence state:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, channelName, supabase]);
}

export default realtime;
