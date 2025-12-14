/**
 * Offline Support (L006)
 * IndexedDB storage and sync queue for offline functionality
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export interface OfflineData<T> {
  key: string;
  data: T;
  timestamp: number;
  synced: boolean;
}

// ============================================================================
// INDEXEDDB WRAPPER
// ============================================================================

const DB_NAME = 'sadhana_offline';
const DB_VERSION = 1;

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
        }

        // Store for pending sync actions
        if (!db.objectStoreNames.contains('pending')) {
          const pendingStore = db.createObjectStore('pending', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp');
          pendingStore.createIndex('table', 'table');
        }

        // Store for habits (offline access)
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }

        // Store for habit logs (offline tracking)
        if (!db.objectStoreNames.contains('habit_logs')) {
          const logsStore = db.createObjectStore('habit_logs', { keyPath: 'id' });
          logsStore.createIndex('habit_id', 'habit_id');
          logsStore.createIndex('date', 'completed_at');
        }
      };
    });
  }

  /**
   * Get database instance
   */
  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Store data in cache
   */
  async set<T>(key: string, data: T): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        synced: true,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as OfflineData<T> | undefined;
        resolve(result?.data ?? null);
      };
    });
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add pending action to sync queue
   */
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    await this.init();
    const db = this.getDB();

    const id = `${action.table}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending', 'readwrite');
      const store = transaction.objectStore('pending');
      const request = store.add(pendingAction);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending', 'readonly');
      const store = transaction.objectStore('pending');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Remove pending action after successful sync
   */
  async removePendingAction(id: string): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending', 'readwrite');
      const store = transaction.objectStore('pending');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update pending action retry count
   */
  async updatePendingAction(id: string, updates: Partial<PendingAction>): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending', 'readwrite');
      const store = transaction.objectStore('pending');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          const putRequest = store.put({ ...action, ...updates });
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Store habits for offline access
   */
  async storeHabits(habits: Record<string, unknown>[]): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('habits', 'readwrite');
      const store = transaction.objectStore('habits');

      // Clear existing and add new
      store.clear();
      
      for (const habit of habits) {
        store.add(habit);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get offline habits
   */
  async getHabits(): Promise<Record<string, unknown>[]> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('habits', 'readonly');
      const store = transaction.objectStore('habits');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// ============================================================================
// SYNC MANAGER
// ============================================================================

class SyncManager {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start background sync
   */
  startBackgroundSync(intervalMs: number = 30000): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, intervalMs);

    // Also sync when coming back online
    window.addEventListener('online', () => this.sync());
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync pending actions
   */
  async sync(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pendingActions = await offlineStorage.getPendingActions();

      for (const action of pendingActions) {
        try {
          await this.processAction(action);
          await offlineStorage.removePendingAction(action.id);
          synced++;
        } catch (error) {
          console.error('Sync failed for action:', action.id, error);
          
          // Increment retry count
          if (action.retries < 3) {
            await offlineStorage.updatePendingAction(action.id, {
              retries: action.retries + 1,
            });
          } else {
            // Max retries reached, remove action
            await offlineStorage.removePendingAction(action.id);
          }
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  /**
   * Process a single pending action
   */
  private async processAction(action: PendingAction): Promise<void> {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    switch (action.type) {
      case 'create':
        await supabase.from(action.table).insert(action.data);
        break;
      case 'update':
        await supabase
          .from(action.table)
          .update(action.data)
          .eq('id', action.data.id);
        break;
      case 'delete':
        await supabase
          .from(action.table)
          .delete()
          .eq('id', action.data.id);
        break;
    }
  }
}

export const syncManager = new SyncManager();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for offline-first data
 */
export function useOfflineData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { syncOnMount?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isOnline = useOnlineStatus();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from offline storage first
      const cached = await offlineStorage.get<T>(key);
      if (cached) {
        setData(cached);
      }

      // If online, fetch fresh data
      if (navigator.onLine) {
        const fresh = await fetcher();
        setData(fresh);
        await offlineStorage.set(key, fresh);
      } else if (!cached) {
        throw new Error('No offline data available');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    if (options.syncOnMount !== false) {
      refresh();
    }
  }, [refresh, options.syncOnMount]);

  // Refresh when coming back online
  useEffect(() => {
    if (isOnline) {
      refresh();
    }
  }, [isOnline, refresh]);

  return { data, isLoading, error, refresh, isOnline };
}

/**
 * Hook for pending sync count
 */
export function usePendingSyncCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const actions = await offlineStorage.getPendingActions();
      setCount(actions.length);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  return count;
}

export default offlineStorage;
