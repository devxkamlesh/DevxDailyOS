'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save, Shield, Database, Key, RefreshCw, Check, AlertCircle } from 'lucide-react'

interface SystemSettings {
  maintenance_mode: boolean
  registration_enabled: boolean
  leaderboard_enabled: boolean
  shop_enabled: boolean
  max_habits_per_user: number
  max_active_habits: number
  daily_coin_limit: number
  daily_xp_limit: number
}

const defaultSettings: SystemSettings = {
  maintenance_mode: false,
  registration_enabled: true,
  leaderboard_enabled: true,
  shop_enabled: true,
  max_habits_per_user: 30,
  max_active_habits: 30,
  daily_coin_limit: 50,
  daily_xp_limit: 500
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
    
    // Cleanup timer on unmount
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
    }
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error)
      }

      if (data) {
        setSettings({
          maintenance_mode: data.maintenance_mode ?? false,
          registration_enabled: data.registration_enabled ?? true,
          leaderboard_enabled: data.leaderboard_enabled ?? true,
          shop_enabled: data.shop_enabled ?? true,
          max_habits_per_user: data.max_habits_per_user ?? 30,
          max_active_habits: data.max_active_habits ?? 30,
          daily_coin_limit: data.daily_coin_limit ?? 50,
          daily_xp_limit: data.daily_xp_limit ?? 500
        })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .single()

      const payload = {
        ...settings,
        updated_at: new Date().toISOString()
      }

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update(payload)
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert(payload)
        if (error) throw error
      }

      setSaved(true)
      
      // Clear existing timer if any
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
      
      // Set timer with cleanup
      savedTimerRef.current = setTimeout(() => {
        setSaved(false)
        savedTimerRef.current = null
      }, 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-accent-primary' : 'bg-border-subtle'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
        checked ? 'translate-x-7' : 'translate-x-1'
      }`} />
    </button>
  )

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-20 bg-surface rounded-2xl animate-pulse" />
        <div className="h-64 bg-surface rounded-2xl animate-pulse" />
        <div className="h-48 bg-surface rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="text-gray-400" />
          System Settings
        </h1>
        <p className="text-foreground-muted">Configure platform settings</p>
      </div>

      {/* Status Messages */}
      {saved && (
        <div className="flex items-center gap-2 p-4 bg-accent-success/10 border border-accent-success/30 rounded-xl text-accent-success">
          <Check size={18} /> Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-blue-400" />
          General Settings
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-foreground-muted">Disable access for non-admin users</p>
            </div>
            <ToggleSwitch
              checked={settings.maintenance_mode}
              onChange={(val) => setSettings({ ...settings, maintenance_mode: val })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div>
              <p className="font-medium">Registration Enabled</p>
              <p className="text-sm text-foreground-muted">Allow new user signups</p>
            </div>
            <ToggleSwitch
              checked={settings.registration_enabled}
              onChange={(val) => setSettings({ ...settings, registration_enabled: val })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div>
              <p className="font-medium">Leaderboard Enabled</p>
              <p className="text-sm text-foreground-muted">Show public leaderboard</p>
            </div>
            <ToggleSwitch
              checked={settings.leaderboard_enabled}
              onChange={(val) => setSettings({ ...settings, leaderboard_enabled: val })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div>
              <p className="font-medium">Shop Enabled</p>
              <p className="text-sm text-foreground-muted">Allow coin purchases in shop</p>
            </div>
            <ToggleSwitch
              checked={settings.shop_enabled}
              onChange={(val) => setSettings({ ...settings, shop_enabled: val })}
            />
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Database size={20} className="text-purple-400" />
          Limits & Caps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-background rounded-xl">
            <label className="block text-sm font-medium mb-2">Max Habits Per User</label>
            <input
              type="number"
              value={settings.max_habits_per_user}
              onChange={(e) => setSettings({ ...settings, max_habits_per_user: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
              min={1}
            />
          </div>
          <div className="p-4 bg-background rounded-xl">
            <label className="block text-sm font-medium mb-2">Max Active Habits</label>
            <input
              type="number"
              value={settings.max_active_habits}
              onChange={(e) => setSettings({ ...settings, max_active_habits: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
              min={1}
            />
          </div>
          <div className="p-4 bg-background rounded-xl">
            <label className="block text-sm font-medium mb-2">Daily Coin Limit</label>
            <input
              type="number"
              value={settings.daily_coin_limit}
              onChange={(e) => setSettings({ ...settings, daily_coin_limit: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
              min={0}
            />
            <p className="text-xs text-foreground-muted mt-1">0 = unlimited</p>
          </div>
          <div className="p-4 bg-background rounded-xl">
            <label className="block text-sm font-medium mb-2">Daily XP Limit</label>
            <input
              type="number"
              value={settings.daily_xp_limit}
              onChange={(e) => setSettings({ ...settings, daily_xp_limit: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
              min={0}
            />
            <p className="text-xs text-foreground-muted mt-1">0 = unlimited</p>
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Key size={20} className="text-green-400" />
          Environment
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 bg-background rounded-xl">
            <span className="text-foreground-muted">Supabase URL</span>
            <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...</span>
          </div>
          <div className="flex justify-between p-3 bg-background rounded-xl">
            <span className="text-foreground-muted">Environment</span>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Production</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full py-3 bg-accent-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
