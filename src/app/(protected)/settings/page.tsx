'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { User, Mail, Globe, Eye, EyeOff, Save, Shield, Bell, Palette, Lock, Download, Clock, Check, ShoppingCart } from 'lucide-react'
import { ProfileIcon, getIconComponent } from '@/lib/profile-icons'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  profile_icon: string | null
  bio: string | null
  website: string | null
  is_public: boolean
  show_on_leaderboard: boolean
  timezone: string
}

interface UserRewards {
  current_avatar: string
  current_theme: string
  unlocked_avatars: string[]
  unlocked_themes: string[]
}

interface NotificationSettings {
  daily_reminders: boolean
  achievement_alerts: boolean
  weekly_summary: boolean
}

// Icon display names mapping
const iconDisplayNames: Record<string, string> = {
  user: 'Default User',
  crown: 'Crown',
  star: 'Star',
  rocket: 'Rocket',
  flame: 'Flame',
  gem: 'Diamond',
  trophy: 'Trophy',
  zap: 'Lightning',
  heart: 'Heart',
  shield: 'Shield',
  target: 'Target',
  coffee: 'Coffee',
  music: 'Music',
  'gamepad-2': 'Gamepad',
  code: 'Code',
  brain: 'Brain',
  // Golden premium avatars
  'gold-crown': 'Golden Crown',
  'gold-star': 'Golden Star',
  'gold-trophy': 'Golden Trophy',
  'gold-gem': 'Golden Diamond',
  'gold-flame': 'Golden Flame',
  'gold-shield': 'Golden Shield'
}

const getIconDisplayName = (iconId: string): string => {
  return iconDisplayNames[iconId] || iconId
}

export default function SettingsPage() {
  const { showToast } = useToast()
  const [profile, setProfile] = useState<Profile>({
    id: '', username: '', full_name: '', avatar_url: null, profile_icon: null,
    bio: null, website: null, is_public: true, show_on_leaderboard: true, timezone: 'Asia/Kolkata'
  })
  const [rewards, setRewards] = useState<UserRewards>({
    current_avatar: 'user', current_theme: 'default',
    unlocked_avatars: ['user'],
    unlocked_themes: ['default']
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    daily_reminders: false, achievement_alerts: true, weekly_summary: true
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'theme'>('profile')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const themes = [
    { id: 'default', name: 'Default', gradient: 'from-zinc-800 to-zinc-900' },
    { id: 'ocean', name: 'Ocean Blue', gradient: 'from-blue-600 to-cyan-600' },
    { id: 'sunset', name: 'Sunset', gradient: 'from-orange-500 to-pink-500' },
    { id: 'forest', name: 'Forest', gradient: 'from-green-600 to-emerald-600' },
    { id: 'purple', name: 'Royal Purple', gradient: 'from-purple-600 to-indigo-600' },
    { id: 'gold', name: 'Golden', gradient: 'from-yellow-500 to-orange-400' },
    { id: 'rose', name: 'Rose Gold', gradient: 'from-pink-500 to-rose-400' },
    { id: 'midnight', name: 'Midnight', gradient: 'from-slate-900 to-blue-900' },
  ]

  const timezones = [
    'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'UTC'
  ]

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setEmail(user.email || '')

      // Fetch profile
      let { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profileData) {
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          profile_icon: 'user', // Set default icon
          is_public: true, show_on_leaderboard: true, timezone: 'Asia/Kolkata'
        }
        const { data: created } = await supabase.from('profiles').insert(newProfile).select().single()
        profileData = created
        
        // Also create user_rewards with default icon
        await supabase.from('user_rewards').insert({
          user_id: user.id,
          current_avatar: 'user',
          unlocked_avatars: ['user'],
          coins: 0,
          gems: 0,
          xp: 0,
          level: 1,
          current_streak: 0
        })
      }
      if (profileData) setProfile(profileData)

      // Fetch rewards
      const { data: rewardsData } = await supabase.from('user_rewards').select('*').eq('user_id', user.id).single()
      if (rewardsData) {
        // Remove duplicates from arrays
        const unlockedAvatars = [...new Set(rewardsData.unlocked_avatars || ['user'])] as string[]
        const unlockedThemes = [...new Set(rewardsData.unlocked_themes || ['default'])] as string[]
        
        setRewards({
          current_avatar: rewardsData.current_avatar || 'user',
          current_theme: rewardsData.current_theme || 'default',
          unlocked_avatars: unlockedAvatars,
          unlocked_themes: unlockedThemes
        })
      }

      // Fetch notification settings
      const { data: notifData } = await supabase.from('notification_settings').select('*').eq('user_id', user.id).single()
      if (notifData) {
        setNotifications({
          daily_reminders: notifData.daily_reminders ?? false,
          achievement_alerts: notifData.achievement_alerts ?? true,
          weekly_summary: notifData.weekly_summary ?? true
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }


  const saveAll = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save profile
      await supabase.from('profiles').update({
        username: profile.username,
        full_name: profile.full_name,
        bio: profile.bio,
        website: profile.website,
        is_public: profile.is_public,
        show_on_leaderboard: profile.show_on_leaderboard,
        timezone: profile.timezone,
        profile_icon: rewards.current_avatar
      }).eq('id', user.id)

      // Save rewards (avatar/theme) using robust sync
      const { syncProfileIcon, syncTheme } = await import('@/lib/profile-sync')
      
      await Promise.all([
        syncProfileIcon(user.id, rewards.current_avatar),
        syncTheme(user.id, rewards.current_theme)
      ])

      // Save notifications
      await supabase.from('notification_settings').upsert({
        user_id: user.id,
        daily_reminders: notifications.daily_reminders,
        achievement_alerts: notifications.achievement_alerts,
        weekly_summary: notifications.weekly_summary
      }, { onConflict: 'user_id' })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving:', error)
      showToast('Error saving settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const selectIcon = (iconId: string) => {
    if (rewards.unlocked_avatars.includes(iconId)) {
      setRewards({ ...rewards, current_avatar: iconId })
    }
  }

  const selectTheme = (themeId: string) => {
    if (rewards.unlocked_themes.includes(themeId)) {
      setRewards({ ...rewards, current_theme: themeId })
    }
  }

  const exportData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch ALL user data from ALL tables
      const [
        { data: habits },
        { data: logs },
        { data: achievements },
        { data: rewards },
        { data: coinAwards },
        { data: xpAwards },
        { data: projects },
        { data: tasks },
        { data: instagramPosts },
        { data: journal },
        { data: clients },
        { data: settings },
        { data: notifications }
      ] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('*').eq('user_id', user.id),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
        supabase.from('user_rewards').select('*').eq('user_id', user.id),
        supabase.from('coin_awards').select('*').eq('user_id', user.id),
        supabase.from('xp_awards').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('instagram_posts').select('*').eq('user_id', user.id),
        supabase.from('daily_journal').select('*').eq('user_id', user.id),
        supabase.from('freelance_clients').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id),
        supabase.from('notification_settings').select('*').eq('user_id', user.id)
      ])

      const completeExport = {
        profile,
        rewards,
        habits: {
          habits,
          logs,
          coinAwards,
          xpAwards
        },
        achievements,
        projects: {
          projects,
          tasks
        },
        content: {
          instagramPosts,
          journal
        },
        business: {
          freelanceClients: clients
        },
        settings: {
          userSettings: settings,
          notifications
        },
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(completeExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devx-daily-complete-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } catch (error) {
      console.error('Export error:', error)
      showToast('Error exporting data', 'error')
    }
  }

  const deleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete ALL user data from ALL tables
      // Using Promise.all for faster parallel deletion
      await Promise.all([
        // Rewards & Tracking System
        supabase.from('coin_awards').delete().eq('user_id', user.id),
        supabase.from('xp_awards').delete().eq('user_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('weekly_challenge_claims').delete().eq('user_id', user.id),
        supabase.from('user_rewards').delete().eq('user_id', user.id),
        
        // Habits System
        supabase.from('habit_logs').delete().eq('user_id', user.id),
        supabase.from('habits').delete().eq('user_id', user.id),
        
        // Projects & Tasks
        supabase.from('tasks').delete().eq('user_id', user.id),
        supabase.from('projects').delete().eq('user_id', user.id),
        
        // Content Management
        supabase.from('instagram_posts').delete().eq('user_id', user.id),
        supabase.from('daily_journal').delete().eq('user_id', user.id),
        
        // Business/Freelance
        supabase.from('freelance_clients').delete().eq('user_id', user.id),
        
        // Settings & Preferences
        supabase.from('notification_settings').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
      ])
      
      // Finally delete profile (CASCADE will handle any remaining references)
      await supabase.from('profiles').delete().eq('id', user.id)
      
      // Sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Error deleting account. Please try again or contact support.', 'error')
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8 text-center">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-accent-primary" /> Settings
          </h1>
          <p className="text-foreground-muted">Manage your account and preferences</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50">
          {saving ? 'Saving...' : saved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit flex-wrap">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'theme', label: 'Theme', icon: Palette },
          { id: 'privacy', label: 'Privacy', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id ? 'bg-accent-primary text-white' : 'text-foreground-muted hover:text-foreground'
              }`}>
              <Icon size={18} /> {tab.label}
            </button>
          )
        })}
      </div>


      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Icon */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4">Profile Icon</h2>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <ProfileIcon iconId={rewards.current_avatar} size={40} className="text-accent-primary" />
              </div>
              <div>
                <p className="font-medium mb-1">Current Icon: {getIconDisplayName(rewards.current_avatar)}</p>
                <Link href="/shop" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                  <ShoppingCart size={14} /> Get more icons in Shop
                </Link>
              </div>
            </div>
            
            <p className="text-sm font-medium mb-3">Your Unlocked Icons</p>
            <div className="flex gap-3 flex-wrap">
              {[...new Set(rewards.unlocked_avatars)].map(iconId => {
                const Icon = getIconComponent(iconId)
                const isSelected = rewards.current_avatar === iconId
                return (
                  <button key={iconId} onClick={() => selectIcon(iconId)}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 ${
                      isSelected ? 'border-accent-primary bg-accent-primary/20 scale-110' : 'border-border-subtle hover:border-accent-primary/50'
                    }`}>
                    <Icon size={24} className={isSelected ? 'text-accent-primary' : 'text-foreground-muted'} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary" />
                <p className="text-xs text-foreground-muted mt-1">Displayed on leaderboard</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border-subtle rounded-lg text-foreground-muted">
                  <Mail size={18} /> {email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3} className="w-full px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-foreground-muted" />
                  <input type="url" value={profile.website || ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-foreground-muted" />
                  <select value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary">
                    {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">Dashboard Theme</h2>
              <p className="text-sm text-foreground-muted">Select from your unlocked themes</p>
            </div>
            <Link href="/shop" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
              <ShoppingCart size={14} /> Get more themes
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map(theme => {
              const isUnlocked = rewards.unlocked_themes.includes(theme.id)
              const isSelected = rewards.current_theme === theme.id
              return (
                <button key={theme.id} onClick={() => selectTheme(theme.id)} disabled={!isUnlocked}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'border-accent-primary bg-accent-primary/10 scale-105' :
                    isUnlocked ? 'border-border-subtle hover:border-accent-primary/50' :
                    'border-border-subtle opacity-50 cursor-not-allowed'
                  }`}>
                  <div className={`w-full h-16 rounded-lg mb-3 bg-gradient-to-br ${theme.gradient}`} />
                  <div className="text-sm font-medium">{theme.name}</div>
                  {isSelected && <div className="text-xs text-accent-primary">Active</div>}
                  {!isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock size={14} className="text-foreground-muted" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* View Public Profile Link */}
          {profile.is_public && profile.show_on_leaderboard && (
            <div className="bg-accent-primary/10 border border-accent-primary/30 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium mb-1">Your Public Profile is Live</div>
                  <div className="text-sm text-foreground-muted">Others can view your stats and achievements</div>
                </div>
                <Link 
                  href={`/profile/${profile.id}`}
                  className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  View Profile
                </Link>
              </div>
            </div>
          )}

          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  {profile.is_public ? <Eye className="text-accent-primary" size={20} /> : <EyeOff className="text-foreground-muted" size={20} />}
                  <div>
                    <div className="font-medium">Public Profile</div>
                    <div className="text-sm text-foreground-muted">Allow others to see your profile</div>
                  </div>
                </div>
                <button onClick={() => setProfile({ ...profile, is_public: !profile.is_public })}
                  className={`relative w-12 h-6 rounded-full transition ${profile.is_public ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${profile.is_public ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="text-accent-primary" size={20} />
                  <div>
                    <div className="font-medium">Show on Leaderboard</div>
                    <div className="text-sm text-foreground-muted">Display your stats publicly</div>
                  </div>
                </div>
                <button onClick={() => setProfile({ ...profile, show_on_leaderboard: !profile.show_on_leaderboard })}
                  className={`relative w-12 h-6 rounded-full transition ${profile.show_on_leaderboard ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${profile.show_on_leaderboard ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4">Your Data</h2>
            <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded-lg hover:bg-accent-primary/20 transition">
              <Download size={18} /> Export All Data
            </button>
            <p className="text-xs text-foreground-muted mt-2">Download all your habits, logs, and achievements as JSON</p>
          </div>
        </div>
      )}


      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <h2 className="font-semibold mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium">Daily Reminders</div>
                <div className="text-sm text-foreground-muted">Get reminded to complete habits</div>
              </div>
              <button onClick={() => setNotifications({ ...notifications, daily_reminders: !notifications.daily_reminders })}
                className={`relative w-12 h-6 rounded-full transition ${notifications.daily_reminders ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.daily_reminders ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium">Achievement Alerts</div>
                <div className="text-sm text-foreground-muted">Notify when you unlock achievements</div>
              </div>
              <button onClick={() => setNotifications({ ...notifications, achievement_alerts: !notifications.achievement_alerts })}
                className={`relative w-12 h-6 rounded-full transition ${notifications.achievement_alerts ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.achievement_alerts ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium">Weekly Summary</div>
                <div className="text-sm text-foreground-muted">Receive weekly progress reports</div>
              </div>
              <button onClick={() => setNotifications({ ...notifications, weekly_summary: !notifications.weekly_summary })}
                className={`relative w-12 h-6 rounded-full transition ${notifications.weekly_summary ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.weekly_summary ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl">
        <h2 className="font-semibold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-foreground-muted mb-4">Irreversible actions</p>
        
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-red-500 font-medium">Are you sure? This will delete ALL your data permanently.</p>
            <div className="flex gap-3">
              <button onClick={deleteAccount} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                Yes, Delete Everything
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-surface border border-border-subtle rounded-lg hover:bg-background transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={deleteAccount} className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition">
            Delete Account
          </button>
        )}
      </div>
    </div>
  )
}
