/**
 * Data Export Features (L011)
 * Export user data in CSV and JSON formats for GDPR compliance
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeHabits?: boolean;
  includeHabitLogs?: boolean;
  includeRewards?: boolean;
  includeBadges?: boolean;
  includeJournal?: boolean;
  includeSettings?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportedData {
  exportedAt: string;
  userId: string;
  profile?: Record<string, unknown>;
  habits?: Record<string, unknown>[];
  habitLogs?: Record<string, unknown>[];
  rewards?: Record<string, unknown>;
  badges?: Record<string, unknown>[];
  journal?: Record<string, unknown>[];
  settings?: Record<string, unknown>;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch all user data for export
 */
async function fetchUserData(
  userId: string,
  options: ExportOptions
): Promise<ExportedData> {
  const supabase = createClient();
  const data: ExportedData = {
    exportedAt: new Date().toISOString(),
    userId,
  };

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profile) {
    // Remove sensitive fields
    const { ...safeProfile } = profile;
    data.profile = safeProfile;
  }

  // Fetch habits
  if (options.includeHabits !== false) {
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    data.habits = habits || [];
  }

  // Fetch habit logs
  if (options.includeHabitLogs !== false) {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (options.dateRange) {
      query = query
        .gte('completed_at', options.dateRange.start.toISOString())
        .lte('completed_at', options.dateRange.end.toISOString());
    }

    const { data: logs } = await query;
    data.habitLogs = logs || [];
  }

  // Fetch rewards
  if (options.includeRewards !== false) {
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    data.rewards = rewards || {};
  }

  // Fetch badges
  if (options.includeBadges !== false) {
    const { data: badges } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId);
    
    data.badges = badges || [];
  }

  // Fetch journal entries
  if (options.includeJournal !== false) {
    let query = supabase
      .from('daily_journal')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (options.dateRange) {
      query = query
        .gte('entry_date', options.dateRange.start.toISOString().split('T')[0])
        .lte('entry_date', options.dateRange.end.toISOString().split('T')[0]);
    }

    const { data: journal } = await query;
    data.journal = journal || [];
  }

  // Fetch settings
  if (options.includeSettings !== false) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    data.settings = settings || {};
  }

  return data;
}

// ============================================================================
// FORMAT CONVERTERS
// ============================================================================

/**
 * Convert data to JSON string
 */
function toJSON(data: ExportedData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, unknown>[], name: string): string {
  if (!data || data.length === 0) {
    return `# ${name}\n# No data\n\n`;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  return `# ${name}\n${headers.join(',')}\n${rows.join('\n')}\n\n`;
}

/**
 * Convert exported data to CSV format
 */
function toCSV(data: ExportedData): string {
  let csv = `# Sadhana Data Export\n# Exported: ${data.exportedAt}\n# User ID: ${data.userId}\n\n`;

  if (data.profile) {
    csv += arrayToCSV([data.profile], 'Profile');
  }

  if (data.habits && data.habits.length > 0) {
    csv += arrayToCSV(data.habits, 'Habits');
  }

  if (data.habitLogs && data.habitLogs.length > 0) {
    csv += arrayToCSV(data.habitLogs, 'Habit Logs');
  }

  if (data.rewards) {
    csv += arrayToCSV([data.rewards], 'Rewards');
  }

  if (data.badges && data.badges.length > 0) {
    csv += arrayToCSV(data.badges, 'Badges');
  }

  if (data.journal && data.journal.length > 0) {
    csv += arrayToCSV(data.journal, 'Journal Entries');
  }

  if (data.settings) {
    csv += arrayToCSV([data.settings], 'Settings');
  }

  return csv;
}

// ============================================================================
// DOWNLOAD HELPERS
// ============================================================================

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
function generateFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `sadhana-export-${timestamp}.${format}`;
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Export user data
 */
export async function exportUserData(
  userId: string,
  options: ExportOptions = { format: 'json' }
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // Fetch data
    const data = await fetchUserData(userId, options);

    // Convert to requested format
    let content: string;
    let mimeType: string;

    if (options.format === 'csv') {
      content = toCSV(data);
      mimeType = 'text/csv';
    } else {
      content = toJSON(data);
      mimeType = 'application/json';
    }

    // Generate filename and download
    const filename = generateFilename(options.format);
    downloadFile(content, filename, mimeType);

    return { success: true, filename };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Export habits only
 */
export async function exportHabits(
  userId: string,
  format: ExportFormat = 'json'
): Promise<{ success: boolean; error?: string }> {
  return exportUserData(userId, {
    format,
    includeHabits: true,
    includeHabitLogs: true,
    includeRewards: false,
    includeBadges: false,
    includeJournal: false,
    includeSettings: false,
  });
}

/**
 * Export journal entries only
 */
export async function exportJournal(
  userId: string,
  format: ExportFormat = 'json',
  dateRange?: { start: Date; end: Date }
): Promise<{ success: boolean; error?: string }> {
  return exportUserData(userId, {
    format,
    includeHabits: false,
    includeHabitLogs: false,
    includeRewards: false,
    includeBadges: false,
    includeJournal: true,
    includeSettings: false,
    dateRange,
  });
}

/**
 * Get export data as string (for preview)
 */
export async function getExportPreview(
  userId: string,
  options: ExportOptions
): Promise<string> {
  const data = await fetchUserData(userId, options);
  
  if (options.format === 'csv') {
    return toCSV(data);
  }
  
  return toJSON(data);
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useCallback } from 'react';

export function useDataExport(userId: string | null) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(
    async (options: ExportOptions = { format: 'json' }) => {
      if (!userId) {
        setError('User not authenticated');
        return false;
      }

      setIsExporting(true);
      setError(null);

      try {
        const result = await exportUserData(userId, options);
        
        if (!result.success) {
          setError(result.error || 'Export failed');
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [userId]
  );

  return {
    exportData,
    isExporting,
    error,
  };
}

export default exportUserData;
