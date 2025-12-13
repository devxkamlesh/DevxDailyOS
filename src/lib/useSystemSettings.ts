'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SystemSettings {
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

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('system_settings')
          .select('*')
          .single()

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
      } catch (error) {
        console.error('Error fetching system settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading }
}
