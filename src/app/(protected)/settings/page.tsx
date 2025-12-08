'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import LogoutButton from '@/components/LogoutButton'
import { User as UserIcon, Mail, Shield, Bell, Palette, Database, Info } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState({ full_name: '', username: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            username: profileData.username || ''
          })
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name, username: profile.username })
        .eq('id', user.id)

      if (error) throw error
      setMessage('Profile updated!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('Passwords do not match')
      setPasswordSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters')
      setPasswordSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error
      
      setPasswordMessage('Password updated successfully!')
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setShowPasswordForm(false)
        setPasswordMessage('')
      }, 2000)
    } catch (error: any) {
      setPasswordMessage(error.message || 'Error updating password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const confirmText = 'DELETE'
    if (deleteConfirmText !== confirmText) {
      return
    }

    setDeleting(true)

    try {
      // Delete all user data manually (in order due to foreign key constraints)
      await Promise.all([
        supabase.from('habit_logs').delete().eq('user_id', user.id),
        supabase.from('tasks').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
      ])

      await Promise.all([
        supabase.from('habits').delete().eq('user_id', user.id),
        supabase.from('projects').delete().eq('user_id', user.id),
        supabase.from('instagram_posts').delete().eq('user_id', user.id),
        supabase.from('freelance_clients').delete().eq('user_id', user.id),
      ])

      // Delete profile last
      await supabase.from('profiles').delete().eq('id', user.id)
      
      // Sign out the user
      await supabase.auth.signOut()
      
      // Redirect to login
      window.location.href = '/login'
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('Error deleting account. Please try again or contact support.')
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-foreground-muted">Loading settings...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-foreground-muted">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                <UserIcon size={20} className="text-accent-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <p className="text-sm text-foreground-muted">Update your personal details</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-foreground-muted" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg text-foreground-muted cursor-not-allowed"
                />
                <p className="text-xs text-foreground-muted mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="username"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-accent-success/10 text-accent-success'}`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Account Actions */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Shield size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Account Actions</h2>
                <p className="text-sm text-foreground-muted">Manage your account security</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border-subtle">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-foreground-muted">Sign out of your account</p>
                </div>
                <LogoutButton />
              </div>

              <div className="p-4 bg-background rounded-lg border border-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-foreground-muted">Update your password</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm hover:opacity-90 transition"
                  >
                    {showPasswordForm ? 'Cancel' : 'Change'}
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordChange} className="space-y-4 mt-4 pt-4 border-t border-border-subtle">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                    </div>

                    {passwordMessage && (
                      <div className={`p-3 rounded-lg text-sm ${
                        passwordMessage.includes('success') 
                          ? 'bg-accent-success/10 text-accent-success' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {passwordMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="w-full py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
                    >
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>

              <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-400">Delete Account</p>
                    <p className="text-sm text-foreground-muted">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                  <p className="text-xs text-red-400">
                    ⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                <Info size={20} className="text-accent-primary" />
              </div>
              <h3 className="font-semibold">Account Info</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-foreground-muted">Member since</p>
                <p className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-foreground-muted">User ID</p>
                <p className="font-mono text-xs break-all">{user?.id.slice(0, 20)}...</p>
              </div>
            </div>
          </div>

          {/* Preferences (Coming Soon) */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle opacity-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Palette size={20} className="text-purple-400" />
              </div>
              <h3 className="font-semibold">Preferences</h3>
            </div>
            <p className="text-sm text-foreground-muted">Theme, notifications, and other preferences coming soon</p>
          </div>

          {/* Data Export (Coming Soon) */}
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle opacity-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Database size={20} className="text-blue-400" />
              </div>
              <h3 className="font-semibold">Data Export</h3>
            </div>
            <p className="text-sm text-foreground-muted">Export your data in JSON or CSV format</p>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface p-6 rounded-2xl w-full max-w-md border-2 border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Shield size={24} className="text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-red-400">Delete Account</h2>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-foreground-muted">⚠️ WARNING: This action cannot be undone!</p>
              
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <p className="font-medium mb-2">This will permanently delete:</p>
                <ul className="space-y-1 text-sm text-foreground-muted">
                  <li>• Your account</li>
                  <li>• All your habits</li>
                  <li>• All your projects and tasks</li>
                  <li>• All your Instagram posts</li>
                  <li>• All your freelance clients</li>
                  <li>• All your data</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="DELETE"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                disabled={deleting}
                className="flex-1 py-3 bg-background border border-border-subtle text-foreground rounded-lg hover:bg-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
