'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Globe, Eye, EyeOff, Save, Camera, Shield, Bell, Palette } from 'lucide-react'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  website: string | null
  is_public: boolean
  show_on_leaderboard: boolean
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    id: '',
    username: '',
    full_name: '',
    avatar_url: null,
    bio: null,
    website: null,
    is_public: true,
    show_on_leaderboard: true
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications'>('profile')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setEmail(user.email || '')

      // Fetch or create profile
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          is_public: true,
          show_on_leaderboard: true
        }

        const { data: created } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        profileData = created
      }

      if (profileData) {
        setProfile(profileData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          website: profile.website,
          is_public: profile.is_public,
          show_on_leaderboard: profile.show_on_leaderboard
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving profile:', error)
        alert('Error saving profile')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-surface p-8 rounded-xl border border-border-subtle text-center">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-accent-primary" />
            Settings & Profile
          </h1>
          <p className="text-foreground-muted">Manage your account and public profile</p>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? (
            <>Saving...</>
          ) : saved ? (
            <>
              ✓ Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'profile'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <User size={18} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'privacy'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <Shield size={18} />
          Privacy
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'notifications'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <Bell size={18} />
          Notifications
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          {/* Profile Icon */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4">Profile Icon</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="w-24 h-24 rounded-full bg-accent-primary/20 flex items-center justify-center text-5xl">
                {profile.avatar_url || '👤'}
              </div>
              <div>
                <p className="font-medium mb-1">Current Icon</p>
                <p className="text-sm text-foreground-muted">
                  Go to Rewards → Shop to unlock more icons
                </p>
              </div>
            </div>
            
            {/* Free Icons Selection */}
            <div>
              <p className="text-sm font-medium mb-3">Quick Select (Free Icons)</p>
              <div className="flex gap-2 flex-wrap">
                {['👤', '😊', '😎', '⭐', '🔥'].map(icon => (
                  <button
                    key={icon}
                    onClick={() => setProfile({ ...profile, avatar_url: icon })}
                    className={`w-12 h-12 rounded-lg border-2 text-2xl transition-all ${
                      profile.avatar_url === icon
                        ? 'border-accent-primary bg-accent-primary/10 scale-110'
                        : 'border-border-subtle hover:border-accent-primary/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-surface p-6 rounded-xl border border-border-subtle">
            <h2 className="font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="username"
                  className="w-full px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <p className="text-xs text-foreground-muted mt-1">This will be displayed on the leaderboard</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border-subtle rounded-lg text-foreground-muted">
                  <Mail size={18} />
                  <span>{email}</span>
                </div>
                <p className="text-xs text-foreground-muted mt-1">Email cannot be changed here</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-foreground-muted" />
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'privacy' && (
        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <h2 className="font-semibold mb-4">Privacy Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                {profile.is_public ? (
                  <Eye className="text-accent-primary" size={20} />
                ) : (
                  <EyeOff className="text-foreground-muted" size={20} />
                )}
                <div>
                  <div className="font-medium">Public Profile</div>
                  <div className="text-sm text-foreground-muted">
                    Allow others to see your profile information
                  </div>
                </div>
              </div>
              <button
                onClick={() => setProfile({ ...profile, is_public: !profile.is_public })}
                className={`relative w-12 h-6 rounded-full transition ${
                  profile.is_public ? 'bg-accent-primary' : 'bg-border-subtle'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    profile.is_public ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="text-accent-primary" size={20} />
                <div>
                  <div className="font-medium">Show on Leaderboard</div>
                  <div className="text-sm text-foreground-muted">
                    Display your stats on the public leaderboard
                  </div>
                </div>
              </div>
              <button
                onClick={() => setProfile({ ...profile, show_on_leaderboard: !profile.show_on_leaderboard })}
                className={`relative w-12 h-6 rounded-full transition ${
                  profile.show_on_leaderboard ? 'bg-accent-primary' : 'bg-border-subtle'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    profile.show_on_leaderboard ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-500">
                💡 <strong>Note:</strong> If you disable "Show on Leaderboard", you won't appear in rankings but can still track your own progress.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-surface p-6 rounded-xl border border-border-subtle">
          <h2 className="font-semibold mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium">Daily Reminders</div>
                <div className="text-sm text-foreground-muted">Get reminded to complete your habits</div>
              </div>
              <button className="relative w-12 h-6 rounded-full bg-border-subtle">
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium">Achievement Unlocked</div>
                <div className="text-sm text-foreground-muted">Notify when you unlock achievements</div>
              </div>
              <button className="relative w-12 h-6 rounded-full bg-accent-primary">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium">Weekly Summary</div>
                <div className="text-sm text-foreground-muted">Receive weekly progress reports</div>
              </div>
              <button className="relative w-12 h-6 rounded-full bg-accent-primary">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>

            <div className="p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
              <p className="text-sm">
                🔔 <strong>Coming Soon:</strong> Email and push notifications will be available in the next update!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl">
        <h2 className="font-semibold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Irreversible actions that affect your account
        </p>
        <button className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition">
          Delete Account
        </button>
      </div>
    </div>
  )
}
